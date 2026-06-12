import React, { useState, useEffect } from 'react';
import { Head, usePage, Link, router } from '@inertiajs/react';
import LanguageSwitcher from '../Components/LanguageSwitcher';
import ThemeToggle from '../Components/ThemeToggle';
import { LogOut, FileSignature, UploadCloud, ShieldCheck, AlertTriangle, Key, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';

export default function Dashboard() {
  const { auth, activeCertificate, activeCertificates, messages, versionName, extensionMinVersion } = usePage().props;
  const user = auth.user;
  // Multi-device: activeCertificates is the array, activeCertificate is the first (newest) for backward compat
  const certs = activeCertificates || (activeCertificate ? [activeCertificate] : []);
  const hasCerts = certs.length > 0;

  // States
  const [modalOpen, setModalOpen]   = useState(false);
  const [confirmText, setConfirmText]   = useState('');
  const [password, setPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deviceName, setDeviceName]     = useState('');
  const [loading, setLoading]           = useState(false);
  const [success, setSuccess]           = useState(false);
  const [backupData, setBackupData]     = useState(null);
  const [errorMsg, setErrorMsg]         = useState('');
  const [extensionStatus, setExtensionStatus] = useState({ checked: false, installed: false, version: null, outdated: false });
  const [syncStatus, setSyncStatus] = useState(null); // { status: 'active' | 'mismatch' | 'no_extension_cert' | 'revoked' | 'error' | 'timeout', data: null }
  const [extensionModalOpen, setExtensionModalOpen]     = useState(false);
  const [extensionOutdatedOpen, setExtensionOutdatedOpen] = useState(false);
  const [showPassword, setShowPassword]     = useState(false);
  const [revokeTarget, setRevokeTarget]     = useState(null); // { serial_number, device_name }
  const [revokeLoading, setRevokeLoading]   = useState(false);
  const [revokeError, setRevokeError]       = useState('');

  const t = messages?.Dashboard || {
    welcome_back: "Welcome Back",
    sign_new_doc: "Sign New Document",
    sign_new_doc_desc: "Upload a PDF and place your cryptographic QR signature securely.",
    my_documents: "My Documents",
    my_documents_desc: "View documents stored in your connected Google Drive.",
    cert_active: "Certificate Active",
    cert_none: "No Active Certificate",
    cert_none_desc: "Generate a certificate to sign documents offline with cryptographic certainty.",
    btn_add_device: "Add New Device Certificate",
    btn_generate: "Generate Certificate",
    btn_regenerate: "Add New Device Certificate",
    logout: "Logout",
    warning_title: "ℹ️ Adding New Device Certificate",
    warning_desc: "You already have an active certificate on another device.",
    warning_continue: "With multi-device architecture:",
    warning_item1: "Old certificates will remain",
    warning_item1_strong: "ACTIVE",
    warning_item2: "Documents signed on other devices remain",
    warning_item2_strong: "VALID",
    warning_item2_suffix: "and verifiable.",
    warning_item3: "Each device has its own independent",
    warning_item3_strong: '"CERTIFICATE"',
    warning_confirm: "Generate a new certificate for this device?",
    confirm_label: 'Type "I UNDERSTAND" to continue',
    confirm_placeholder: "I UNDERSTAND",
    confirm_keyword: "I UNDERSTAND",
    create_new_key: "Add This Device",
    generate_secure_key: "Generate Secure Key",
    device_name_label: "Device Name (Optional)",
    device_name_placeholder: "e.g. Work Laptop, Home PC...",
    new_cert_password: "New Certificate Password (Min 8 Characters)",
    new_password_placeholder: "Enter new password...",
    confirm_password_label: "Confirm New Password",
    confirm_password_placeholder: "Confirm new password...",
    password_min_length: "Password must be at least 8 characters",
    btn_cancel: "CANCEL",
    btn_yes_replace: "ADD DEVICE CERTIFICATE",
    btn_generate_cert: "GENERATE CERTIFICATE",
    cert_issued: "Certificate Issued!",
    cert_issued_desc: "Your certificate and secure key have been generated and saved locally.",
    extension_alert: "TrustlessSign Extension is required. Please install the extension first.",
    devices_title: "Active Devices",
    device_serial: "Serial",
    device_expires: "Expires",
  };

  // Compare semver strings — returns true if installed < required
  const isVersionOutdated = (installed, required) => {
    if (!installed || !required) return false;
    // Strip any pre-release suffix like -dev, -beta for numeric comparison
    const parse = (v) => v.replace(/[-+].*/,'').split('.').map(Number);
    const a = parse(installed);
    const b = parse(required);
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      const ai = a[i] || 0, bi = b[i] || 0;
      if (ai < bi) return true;
      if (ai > bi) return false;
    }
    return false;
  };

  // Check if extension is installed and compare version
  useEffect(() => {
    const checkExtension = () => {
      const timeout = setTimeout(() => {
        setExtensionStatus({ checked: true, installed: false, version: null, outdated: false });
      }, 1500);

      const handlePingResponse = (e) => {
        if (e.data && e.data.type === 'TRUSTLESS_PING_RESPONSE') {
          clearTimeout(timeout);
          window.removeEventListener('message', handlePingResponse);
          const extVersion = e.data.version || null;
          const outdated = isVersionOutdated(extVersion, extensionMinVersion);
          setExtensionStatus({ checked: true, installed: true, version: extVersion, outdated });
        }
      };

      window.addEventListener('message', handlePingResponse);
      window.postMessage({ type: 'TRUSTLESS_PING_REQUEST' }, '*');

      return () => {
        clearTimeout(timeout);
        window.removeEventListener('message', handlePingResponse);
      };
    };

    checkExtension();
  }, [extensionMinVersion]);

  // [NEW] Extension-First Sync Check
  useEffect(() => {
    if (!extensionStatus.installed) return;
    
    let isMounted = true;
    const syncTimeout = setTimeout(() => {
        if (isMounted) {
            setSyncStatus({ status: 'timeout' });
        }
    }, 5000); // circuit breaker / fallback

    const handleSerialResponse = async (e) => {
        if (e.data && e.data.type === 'TRUSTLESS_GET_CERT_SERIAL_RESPONSE') {
            clearTimeout(syncTimeout);
            window.removeEventListener('message', handleSerialResponse);
            if (!isMounted) return;

            const { serial, hasCert } = e.data.payload;
            if (!hasCert || !serial) {
                setSyncStatus({ status: 'no_extension_cert' });
                return;
            }

            try {
                const syncRes = await axios.post('/certificates/sync-check', {
                    serial_number: serial
                });
                
                if (syncRes.data.active) {
                    setSyncStatus({ status: 'active', data: syncRes.data });
                } else if (syncRes.data.is_revoked || syncRes.data.expired) {
                    setSyncStatus({ status: 'revoked', data: syncRes.data });
                } else if (!syncRes.data.owned) {
                    setSyncStatus({ status: 'mismatch', data: syncRes.data });
                }
            } catch (err) {
                setSyncStatus({ status: 'error' });
            }
        }
    };
    
    window.addEventListener('message', handleSerialResponse);
    window.postMessage({ type: 'TRUSTLESS_GET_CERT_SERIAL_REQUEST' }, '*');
    
    return () => {
        isMounted = false;
        clearTimeout(syncTimeout);
        window.removeEventListener('message', handleSerialResponse);
    };
  }, [extensionStatus.installed]);

  const handleCertificateAction = () => {
    if (!extensionStatus.installed) {
      setExtensionModalOpen(true);
      return;
    }
    if (extensionStatus.outdated) {
      setExtensionOutdatedOpen(true);
      return;
    }
    setModalOpen(true);
    setConfirmText('');
    setPassword('');
    setConfirmPassword('');
    setDeviceName('');
    setErrorMsg('');
    setSuccess(false);
  };

  const handleSignNewDoc = (e) => {
    if (!extensionStatus.installed) {
      e.preventDefault();
      setExtensionModalOpen(true);
      return;
    }
    if (extensionStatus.outdated) {
      e.preventDefault();
      setExtensionOutdatedOpen(true);
      return;
    }
    if (syncStatus && syncStatus.status !== 'active') {
      e.preventDefault();
      alert('Sertifikat Anda tidak valid (mismatch/revoked). Silakan periksa peringatan di atas.');
      return;
    }
    // else navigate naturally to /sign
  };

  const handleGenerateCertificate = async () => {
    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Fetch Sanctum token and GDrive credentials from backend
      const credResponse = await axios.get('/user/credentials');
      const { token } = credResponse.data;

      // 2. Send request to Extension via postMessage
      const handleExtensionResponse = (e) => {
        if (e.data && e.data.type === 'TRUSTLESS_GENERATE_KEY_RESPONSE') {
          window.removeEventListener('message', handleExtensionResponse);
          
          const response = e.data.payload;
          if (response && response.status === 'success') {
            setSuccess(true);
            setLoading(false);
            if (response.tsignBase64) {
              setBackupData({
                driveSuccess: response.driveSuccess,
                driveUrl: response.driveUrl,
                tsignBase64: response.tsignBase64,
                fileName: response.fileName
              });
              // Don't auto-close modal so user can download the backup
            } else {
              setTimeout(() => {
                setModalOpen(false);
                router.reload(); // Refresh props to show active certificate
              }, 2000);
            }
          } else {
            setErrorMsg(response?.message || "Extension failed to generate certificate.");
            setLoading(false);
          }
        }
      };

      window.addEventListener('message', handleExtensionResponse);

      window.postMessage({
        type: 'TRUSTLESS_GENERATE_KEY_REQUEST',
        payload: {
          password:   password,
          deviceName: deviceName || 'Dashboard',
          email:      user.email,
          apiToken:   token
        }
      }, '*');

    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || "Failed to initiate certificate generation.");
      setLoading(false);
    }
  };

  const handleDownloadLocal = () => {
    if (!backupData || !backupData.tsignBase64) return;
    const byteCharacters = atob(backupData.tsignBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = backupData.fileName || 'trustlesssign_backup.tsign';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Revoke a specific certificate by serial number
  const handleRevoke = async () => {
    if (!revokeTarget) return;
    setRevokeLoading(true);
    setRevokeError('');
    try {
      await axios.post(`/certificates/${revokeTarget.serial_number}/revoke`, {
        reason: 'Revoked by user from Dashboard'
      });
      setRevokeTarget(null);
      router.reload();
    } catch (err) {
      setRevokeError(err.response?.data?.message || 'Failed to revoke certificate.');
    } finally {
      setRevokeLoading(false);
    }
  };

  return (
    <>
      <Head title="Dashboard" />
      <div className="min-h-screen transition-colors duration-300">
        <header className="flex justify-between items-center p-4 lg:px-8 border-b border-border-subtle bg-surface-glass relative z-50">
          <div className="flex items-center gap-4">
            {user.avatar && <img src={user.avatar} alt="Avatar" className="w-10 h-10 rounded-full border border-border-default" />}
            <div>
              <h2 className="font-semibold text-text-primary leading-tight">{user.name}</h2>
              <p className="text-xs text-text-tertiary">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
            <div className="w-px h-6 bg-border-default hidden sm:block"></div>
            <Link href="/logout" method="post" as="button" className="text-sm font-semibold text-text-secondary hover:text-accent-danger flex items-center gap-2 transition-colors">
              <LogOut size={16} /> <span className="hidden sm:inline">{t.logout}</span>
            </Link>
          </div>
        </header>

        <main className="max-w-5xl mx-auto p-4 lg:p-8 mt-6">
          <h1 className="text-3xl font-bold mb-6">{t.welcome_back}</h1>
          
          {syncStatus && syncStatus.status !== 'active' && (
            <div className={`mb-6 p-4 rounded-xl border ${
              syncStatus.status === 'revoked' ? 'bg-accent-warning-soft border-accent-warning text-accent-warning' : 
              'bg-accent-danger-soft border-accent-danger text-accent-danger'
            }`}>
              <div className="flex gap-3">
                <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-lg mb-1">
                    {syncStatus.status === 'revoked' && 'Sertifikat telah di-revoke'}
                    {syncStatus.status === 'mismatch' && 'Sertifikat tidak dikenal (Mismatch)'}
                    {syncStatus.status === 'no_extension_cert' && 'Tidak Ada Sertifikat di Ekstensi'}
                    {syncStatus.status === 'timeout' && 'Gangguan Komunikasi Ekstensi'}
                    {syncStatus.status === 'error' && 'Gangguan Server'}
                  </h3>
                  <p className="text-sm font-medium">
                    {syncStatus.status === 'revoked' && 'Sertifikat di dalam browser ekstensi Anda telah dinonaktifkan (revoke). Silakan generate ulang sertifikat baru untuk dapat melakukan tanda tangan.'}
                    {syncStatus.status === 'mismatch' && 'Sertifikat yang berada di dalam browser ekstensi tidak cocok dengan database server kami. Silakan generate ulang sertifikat atau lakukan impor sertifikat yang benar melalui ekstensi.'}
                    {syncStatus.status === 'no_extension_cert' && 'Kami mendeteksi Anda belum memiliki sertifikat yang tersimpan di ekstensi. Silakan buat sertifikat baru.'}
                    {syncStatus.status === 'timeout' && 'Gagal memeriksa status keamanan ekstensi Anda. Pastikan ekstensi TrustlessSign berjalan normal di browser.'}
                    {syncStatus.status === 'error' && 'Terjadi gangguan saat memverifikasi keamanan sertifikat Anda ke server. Periksa koneksi Anda.'}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Certificate Management Section */}
          <div className="glass-panel p-6 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                  hasCerts ? 'bg-accent-success-soft text-accent-success' : 'bg-accent-warning-soft text-accent-warning'
                }`}>
                  <ShieldCheck size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-lg leading-none">
                    {hasCerts ? t.cert_active : t.cert_none}
                  </h3>
                  <p className="text-sm text-text-secondary leading-normal">
                    {hasCerts
                      ? `${certs.length} active device${certs.length > 1 ? 's' : ''}`
                      : t.cert_none_desc}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCertificateAction}
                className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-all focus:ring focus:outline-none cursor-pointer shrink-0 ${
                  hasCerts
                    ? 'bg-accent-primary text-white hover:bg-opacity-90'
                    : 'bg-accent-success text-white hover:bg-opacity-90'
                }`}
              >
                {hasCerts ? (t.btn_add_device || 'Add Device') : t.btn_generate}
              </button>
            </div>

            {/* Multi-device certificate list */}
            {hasCerts && (
              <div className="mt-3 space-y-2 border-t border-border-subtle pt-4">
                <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">{t.devices_title || 'Active Devices'}</p>
                {certs.map((cert, idx) => (
                  <div key={cert.serial_number} className="flex items-center justify-between p-3 bg-surface-secondary rounded-lg border border-border-subtle text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent-primary-soft text-accent-primary flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-text-primary">
                          {cert.device_name || 'Unknown Device'}
                        </p>
                        <p className="text-xs text-text-tertiary">
                          {t.device_serial || 'Serial'}: {cert.serial_number?.slice(0, 12)}… · {t.device_expires || 'Expires'}: {new Date(cert.expires_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setRevokeTarget(cert); setRevokeError(''); }}
                      className="text-xs px-2.5 py-1 rounded-md border border-accent-danger text-accent-danger hover:bg-accent-danger hover:text-white transition-all font-semibold shrink-0"
                    >
                      {t.btn_revoke || 'Revoke'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              href="/sign"
              onClick={handleSignNewDoc}
              className={`glass-panel p-6 flex flex-col items-center text-center gap-4 group transition-all ${
                extensionStatus.outdated
                  ? 'border-accent-warning hover:border-accent-warning cursor-pointer'
                  : 'hover:border-accent-primary cursor-pointer'
              }`}
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform ${
                extensionStatus.outdated
                  ? 'bg-accent-warning-soft text-accent-warning'
                  : 'bg-accent-primary-soft text-accent-primary'
              }`}>
                {extensionStatus.outdated ? <AlertTriangle size={32} /> : <FileSignature size={32} />}
              </div>
              <div>
                <h3 className="font-bold text-lg">{t.sign_new_doc}</h3>
                <p className="text-sm text-text-secondary mt-1">{t.sign_new_doc_desc}</p>
                {extensionStatus.outdated && (
                  <p className="text-xs text-accent-warning font-semibold mt-2">{t.ext_outdated_hint || '⚠ Extension update required'}</p>
                )}
              </div>
            </Link>
            
            <div className="glass-panel p-6 flex flex-col items-center text-center gap-4 cursor-not-allowed opacity-75">
              <div className="w-16 h-16 rounded-full bg-surface-tertiary flex items-center justify-center text-text-tertiary">
                <UploadCloud size={32} />
              </div>
              <div>
                <h3 className="font-bold text-lg">{t.my_documents}</h3>
                <p className="text-sm text-text-secondary mt-1">{t.my_documents_desc}</p>
              </div>
            </div>
          </div>
        </main>

        {/* Dashboard Footer — version status panel */}
        <footer className="p-4 mt-auto text-center text-sm font-medium text-text-tertiary">
          <div className="inline-flex flex-col sm:flex-row items-center justify-center gap-3 flex-wrap">
            {/* Web version — always ready */}
            <span className="flex items-center gap-1.5">
              TrustlessSign Web — {versionName}
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-accent-success-soft text-accent-success">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                {t.ext_status_ok || 'Up-to-date'}
              </span>
            </span>

            <span className="hidden sm:inline text-border-default">·</span>

            {/* Extension version — dynamic */}
            <span className="flex items-center gap-1.5">
              TrustlessSign Extension
              {!extensionStatus.checked && (
                <span className="text-xs text-text-tertiary animate-pulse">{t.ext_checking || 'Checking...'}</span>
              )}
              {extensionStatus.checked && !extensionStatus.installed && (
                <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-surface-tertiary text-text-tertiary">
                  {t.ext_not_installed || 'Not Installed'}
                </span>
              )}
              {extensionStatus.checked && extensionStatus.installed && !extensionStatus.outdated && (
                <>
                  <span className="text-text-tertiary">— {extensionStatus.version}</span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-accent-success-soft text-accent-success">
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    {t.ext_status_ok || 'Up-to-date'}
                  </span>
                </>
              )}
              {extensionStatus.checked && extensionStatus.installed && extensionStatus.outdated && (
                <>
                  <span className="text-text-tertiary">— {extensionStatus.version}</span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-accent-warning-soft text-accent-warning">
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    {t.ext_status_outdated || 'Outdated'}
                  </span>
                </>
              )}
            </span>
          </div>
        </footer>
      </div>

      {/* Certificate Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full p-6 space-y-6 bg-surface-elevated animate-fade-in relative z-55">
            {success ? (
              <div className="text-center py-6 space-y-4">
                <CheckCircle className="mx-auto text-accent-success" size={64} />
                <h3 className="text-xl font-bold">{t.cert_issued}</h3>
                <p className="text-sm text-text-secondary">{t.cert_issued_desc}</p>
                {backupData?.driveSuccess && (
                  <p className="text-sm text-accent-success font-medium">✅ Auto-backed up to your Google Drive.</p>
                )}
                {(backupData?.driveUrl || backupData?.tsignBase64) && (
                  <div className="mt-6 space-y-3">
                    {backupData.driveUrl ? (
                      <button
                        onClick={() => window.open(backupData.driveUrl, '_blank')}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-surface-tertiary border border-accent-success text-accent-success rounded-md hover:bg-surface-elevated transition-all font-semibold"
                      >
                        📂 Open Google Drive Backup
                      </button>
                    ) : (
                      <button
                        onClick={handleDownloadLocal}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-surface-tertiary border border-border-strong text-text-primary rounded-md hover:bg-surface-elevated hover:border-accent-primary transition-all font-semibold"
                      >
                        ⬇️ Download Local Backup (.tsign)
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setModalOpen(false);
                        router.reload();
                      }}
                      className="w-full text-text-tertiary hover:text-text-primary text-sm font-medium transition-colors py-2"
                    >
                      Close & Continue
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {hasCerts && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-accent-primary">
                      <Key size={20} />
                      <h2 className="text-lg font-bold tracking-tight">{t.warning_title}</h2>
                    </div>
                    <div className="text-sm text-text-secondary space-y-2 leading-relaxed bg-accent-warning-soft p-4 rounded-lg border border-accent-warning text-accent-warning mb-4">
                      <p className="font-bold">⚠️ PERINGATAN AUTO-REVOKE</p>
                      <p className="font-medium">
                        Membuat sertifikat baru akan <strong>menonaktifkan (revoke) semua sertifikat Anda yang sebelumnya</strong>.
                      </p>
                      <p className="font-medium">
                        Akibatnya, dokumen-dokumen lama yang pernah Anda tandatangani akan menampilkan peringatan (warna oranye) saat diverifikasi, meskipun isi dokumennya tetap terbukti asli.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-text-secondary">{t.confirm_label}</label>
                      <input
                        type="text"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder={t.confirm_placeholder}
                        className="w-full px-3 py-2 border border-border-default rounded-md bg-surface-primary focus:ring focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-accent-primary">
                    <Key size={20} />
                    <h3 className="font-bold text-lg">{hasCerts ? t.create_new_key : t.generate_secure_key}</h3>
                  </div>

                  {/* Device Name */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-text-secondary">{t.device_name_label || 'Device Name (Optional)'}</label>
                    <input
                      type="text"
                      value={deviceName}
                      onChange={(e) => setDeviceName(e.target.value)}
                      placeholder={t.device_name_placeholder || 'e.g. Work Laptop, Home PC...'}
                      className="w-full px-3 py-2 border border-border-default rounded-md bg-surface-primary focus:ring focus:outline-none"
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-text-secondary">{t.new_cert_password}</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        placeholder={t.new_password_placeholder}
                        className="w-full px-3 py-2 border border-border-default rounded-md bg-surface-primary focus:ring focus:outline-none pr-10"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {password.length > 0 && password.length < 8 && (
                      <p className="text-xs text-accent-danger">{t.password_min_length}</p>
                    )}
                  </div>


                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-text-secondary">{t.confirm_password_label}</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        placeholder={t.confirm_password_placeholder}
                        className="w-full px-3 py-2 border border-border-default rounded-md bg-surface-primary focus:ring focus:outline-none pr-10"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                {errorMsg && (
                  <p className="text-xs text-accent-danger font-semibold bg-accent-danger-soft p-3 rounded-md border border-accent-danger">
                    {errorMsg}
                  </p>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button 
                    disabled={loading}
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 border border-border-default rounded-md hover:bg-surface-secondary transition-colors text-sm font-semibold cursor-pointer"
                  >
                    {t.btn_cancel}
                  </button>
                  <button
                    disabled={
                      (hasCerts && confirmText !== t.confirm_keyword) ||
                      password.length < 8 ||
                      password !== confirmPassword ||
                      loading
                    }
                    onClick={handleGenerateCertificate}
                    className="px-4 py-2 bg-accent-primary text-white rounded-md hover:bg-opacity-90 transition-all text-sm font-semibold disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    {loading && <Loader2 className="animate-spin" size={16} />}
                    {hasCerts ? (t.btn_yes_replace || 'ADD DEVICE CERTIFICATE') : t.btn_generate_cert}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {/* Extension Outdated Modal */}
      {extensionOutdatedOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full p-6 space-y-6 bg-surface-elevated animate-fade-in relative z-55">
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-accent-warning-soft text-accent-warning mx-auto flex items-center justify-center">
                <AlertTriangle size={32} />
              </div>
              <h2 className="text-xl font-bold tracking-tight">{t.ext_outdated_title || 'Extension Outdated'}</h2>
              <p className="text-sm text-text-secondary leading-relaxed">
                {t.ext_outdated_desc
                  ? t.ext_outdated_desc
                      .replace('{{current}}', extensionStatus.version || '?')
                      .replace('{{required}}', extensionMinVersion || '?')
                  : `Your extension (v${extensionStatus.version}) is outdated. Please update to v${extensionMinVersion} or newer to continue.`
                }
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <a
                href={`https://github.com/vnot-programming/TrustLessSign/releases`}
                target="_blank" rel="noreferrer"
                className="w-full px-4 py-3 bg-accent-warning text-white rounded-md hover:bg-opacity-90 transition-all text-sm font-semibold flex justify-center items-center text-center cursor-pointer"
              >
                {t.btn_update_ext || 'Update Extension'}
              </a>
            </div>

            <div className="flex justify-center pt-2">
              <button
                onClick={() => setExtensionOutdatedOpen(false)}
                className="text-text-secondary hover:text-text-primary text-sm font-medium transition-colors cursor-pointer"
              >
                {t.btn_cancel || 'CANCEL'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Extension Required Modal */}
      {extensionModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full p-6 space-y-6 bg-surface-elevated animate-fade-in relative z-55">
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-accent-warning-soft text-accent-warning mx-auto flex items-center justify-center">
                <AlertTriangle size={32} />
              </div>
              <h2 className="text-xl font-bold tracking-tight">{t.install_ext_title || "Extension Required"}</h2>
              <p className="text-sm text-text-secondary leading-relaxed">
                {t.install_ext_desc || "TrustlessSign extension is required to generate cryptographic certificates safely in your browser."}
              </p>
            </div>
            
            <div className="flex flex-col gap-3 pt-2">
              <a 
                href="https://chrome.google.com/webstore/detail/trustlesssign"
                target="_blank" rel="noreferrer"
                className="w-full px-4 py-3 bg-accent-primary text-white rounded-md hover:bg-opacity-90 transition-all text-sm font-semibold flex justify-center items-center text-center cursor-pointer"
              >
                {t.btn_chrome_store || "Install from Chrome Store"}
              </a>
              <a 
                href={`https://github.com/vnot-programming/TrustLessSign/releases/download/v${__EXTENSION_VERSION__}/trustlesssign-v${__EXTENSION_VERSION__}.crx`}
                target="_blank" rel="noreferrer"
                className="w-full px-4 py-3 border border-border-default rounded-md hover:bg-surface-secondary transition-colors text-sm font-semibold flex justify-center items-center text-center cursor-pointer"
              >
                {t.btn_manual_install || "Download .crx (Manual Install)"}
              </a>
            </div>

            <div className="flex justify-center pt-2">
              <button 
                onClick={() => setExtensionModalOpen(false)}
                className="text-text-secondary hover:text-text-primary text-sm font-medium transition-colors cursor-pointer"
              >
                {t.btn_cancel || "CANCEL"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Certificate Confirmation Modal */}
      {revokeTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel max-w-sm w-full p-6 space-y-4 bg-surface-elevated animate-fade-in">
            <div className="flex items-center gap-3 text-accent-danger">
              <AlertTriangle size={24} />
              <h2 className="text-lg font-bold">{t.revoke_title || 'Revoke Certificate'}</h2>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              {t.revoke_desc || 'Are you sure you want to revoke the certificate for'}{' '}
              <strong className="text-text-primary">{revokeTarget.device_name || 'this device'}</strong>?
              {' '}{t.revoke_warning || 'Documents signed with this certificate will become unverifiable.'}
            </p>
            <p className="text-xs text-text-tertiary font-mono">Serial: {revokeTarget.serial_number}</p>
            {revokeError && (
              <p className="text-xs text-accent-danger bg-accent-danger-soft p-2 rounded border border-accent-danger">{revokeError}</p>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button
                disabled={revokeLoading}
                onClick={() => setRevokeTarget(null)}
                className="px-4 py-2 border border-border-default rounded-md text-sm font-semibold hover:bg-surface-secondary transition-colors cursor-pointer"
              >
                {t.btn_cancel || 'Cancel'}
              </button>
              <button
                disabled={revokeLoading}
                onClick={handleRevoke}
                className="px-4 py-2 bg-accent-danger text-white rounded-md text-sm font-semibold hover:bg-opacity-90 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {revokeLoading && <Loader2 className="animate-spin" size={16} />}
                {t.btn_revoke_confirm || 'Yes, Revoke'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
