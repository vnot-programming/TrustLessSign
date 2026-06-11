import React, { useState, useEffect } from 'react';
import { Head, usePage, Link, router } from '@inertiajs/react';
import LanguageSwitcher from '../Components/LanguageSwitcher';
import ThemeToggle from '../Components/ThemeToggle';
import { LogOut, FileSignature, UploadCloud, ShieldCheck, AlertTriangle, Key, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';

export default function Dashboard() {
  const { auth, activeCertificate, messages, versionName } = usePage().props;
  const user = auth.user;

  // States
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [extensionStatus, setExtensionStatus] = useState({ checked: false, installed: false });
  const [extensionModalOpen, setExtensionModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Translation keys - Dashboard section
  const t = messages?.Dashboard || {
    welcome_back: "Welcome Back",
    sign_new_doc: "Sign New Document",
    sign_new_doc_desc: "Upload a PDF and place your cryptographic QR signature securely.",
    my_documents: "My Documents",
    my_documents_desc: "View documents stored in your connected Google Drive.",
    cert_active: "Certificate Active",
    cert_none: "No Active Certificate",
    cert_none_desc: "Generate a certificate to sign documents offline with cryptographic certainty.",
    btn_regenerate: "Re-generate / Replace Certificate",
    btn_generate: "Generate Certificate",
    logout: "Logout",
    warning_title: "⚠️ CRITICAL SECURITY WARNING!",
    warning_desc: "You already have an active certificate registered in the system.",
    warning_continue: "If you continue to create/replace with a new certificate:",
    warning_item1: "Your old certificate will automatically be",
    warning_item1_strong: "REVOKED",
    warning_item2: "ALL PDF documents you have previously signed will become",
    warning_item2_strong: "INVALID",
    warning_item2_suffix: "when others verify them.",
    warning_item3: "The status of old documents will change to",
    warning_item3_strong: '"CERTIFICATE REVOKED"',
    warning_confirm: "Are you sure you want to continue?",
    confirm_label: 'Type "I UNDERSTAND" to continue',
    confirm_placeholder: "I UNDERSTAND",
    confirm_keyword: "I UNDERSTAND",
    create_new_key: "Create New Key",
    generate_secure_key: "Generate Secure Key",
    new_cert_password: "New Certificate Password (Min 8 Characters)",
    new_password_placeholder: "Enter new password...",
    confirm_password_label: "Confirm New Password",
    confirm_password_placeholder: "Confirm new password...",
    password_min_length: "Password must be at least 8 characters",
    btn_cancel: "CANCEL",
    btn_yes_replace: "YES, REPLACE CERTIFICATE",
    btn_generate_cert: "GENERATE CERTIFICATE",
    cert_issued: "Certificate Issued!",
    cert_issued_desc: "Your certificate and secure key have been generated and saved locally.",
    extension_alert: "TrustlessSign Extension is required. Please install the extension first.",
  };

  // Check if extension is installed
  useEffect(() => {
    const checkExtension = () => {
      if (window.__TRUSTLESS_SIGN_EXTENSION_INSTALLED__ === true || document.documentElement.dataset.trustlessSignInstalled === "true") {
        setExtensionStatus({ checked: true, installed: true });
      } else {
        // Double check via quick message ping
        const timeout = setTimeout(() => {
          setExtensionStatus({ checked: true, installed: false });
        }, 1000);

        const handlePingResponse = (e) => {
          if (e.data && e.data.type === 'TRUSTLESS_PING_RESPONSE') {
            setExtensionStatus({ checked: true, installed: true });
            clearTimeout(timeout);
            window.removeEventListener('message', handlePingResponse);
          }
        };

        window.addEventListener('message', handlePingResponse);
        window.postMessage({ type: 'TRUSTLESS_PING_REQUEST' }, '*');

        return () => {
          clearTimeout(timeout);
          window.removeEventListener('message', handlePingResponse);
        };
      }
    };

    checkExtension();
  }, []);

  const handleCertificateAction = () => {
    if (!extensionStatus.installed) {
      setExtensionModalOpen(true);
      return;
    }
    setModalOpen(true);
    setConfirmText('');
    setPassword('');
    setConfirmPassword('');
    setErrorMsg('');
    setSuccess(false);
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
            setTimeout(() => {
              setModalOpen(false);
              router.reload(); // Refresh props to show active certificate
            }, 2000);
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
          password: password,
          email: user.email,
          apiToken: token
        }
      }, '*');

    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || "Failed to initiate certificate generation.");
      setLoading(false);
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
          
          {/* Certificate Management Section */}
          <div className="glass-panel p-6 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${activeCertificate ? 'bg-accent-success-soft text-accent-success' : 'bg-accent-warning-soft text-accent-warning'}`}>
                <ShieldCheck size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg leading-none">
                  {activeCertificate ? t.cert_active : t.cert_none}
                </h3>
                <p className="text-sm text-text-secondary leading-normal">
                  {activeCertificate 
                    ? `Serial: ${activeCertificate.serial_number} (Expires: ${new Date(activeCertificate.expires_at).toLocaleDateString()})` 
                    : t.cert_none_desc}
                </p>
              </div>
            </div>
            <button 
              onClick={handleCertificateAction}
              className={`px-6 py-3 rounded-lg font-bold text-sm transition-all focus:ring focus:outline-none cursor-pointer ${activeCertificate ? 'bg-accent-danger text-white hover:bg-opacity-90' : 'bg-accent-success text-white hover:bg-opacity-90'}`}
            >
              {activeCertificate ? t.btn_regenerate : t.btn_generate}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/sign" className="glass-panel p-6 flex flex-col items-center text-center gap-4 hover:border-accent-primary group transition-all">
              <div className="w-16 h-16 rounded-full bg-accent-primary-soft flex items-center justify-center text-accent-primary group-hover:scale-110 transition-transform">
                <FileSignature size={32} />
              </div>
              <div>
                <h3 className="font-bold text-lg">{t.sign_new_doc}</h3>
                <p className="text-sm text-text-secondary mt-1">{t.sign_new_doc_desc}</p>
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

        {/* Dashboard Footer */}
        <footer className="p-4 mt-auto text-center text-sm font-medium text-text-tertiary">
          <p>TrustlessSign Web - Version: {versionName}</p>
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
              </div>
            ) : (
              <>
                {activeCertificate && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-accent-danger">
                      <AlertTriangle size={28} />
                      <h2 className="text-xl font-bold tracking-tight">{t.warning_title}</h2>
                    </div>
                    
                    <div className="text-sm text-text-secondary space-y-2 leading-relaxed">
                      <p>{t.warning_desc}</p>
                      <p className="font-semibold text-text-primary">{t.warning_continue}</p>
                      <ol className="list-decimal list-inside pl-1 space-y-1">
                        <li>{t.warning_item1} <strong>{t.warning_item1_strong}</strong>.</li>
                        <li>{t.warning_item2} <strong>{t.warning_item2_strong}</strong> {t.warning_item2_suffix}</li>
                        <li>{t.warning_item3} <strong>{t.warning_item3_strong}</strong>.</li>
                      </ol>
                      <p className="font-semibold mt-4">{t.warning_confirm}</p>
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
                    <h3 className="font-bold text-lg">{activeCertificate ? t.create_new_key : t.generate_secure_key}</h3>
                  </div>

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
                      (activeCertificate && confirmText !== t.confirm_keyword) || 
                      password.length < 8 || 
                      password !== confirmPassword || 
                      loading
                    }
                    onClick={handleGenerateCertificate}
                    className="px-4 py-2 bg-accent-danger text-white rounded-md hover:bg-opacity-90 transition-all text-sm font-semibold disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    {loading && <Loader2 className="animate-spin" size={16} />}
                    {activeCertificate ? t.btn_yes_replace : t.btn_generate_cert}
                  </button>
                </div>
              </>
            )}
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
    </>
  );
}
