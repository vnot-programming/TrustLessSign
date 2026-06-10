import React, { useState, useEffect } from 'react';
import { Head, usePage, Link, router } from '@inertiajs/react';
import LanguageSwitcher from '../Components/LanguageSwitcher';
import ThemeToggle from '../Components/ThemeToggle';
import { LogOut, FileSignature, UploadCloud, ShieldCheck, AlertTriangle, Key, Loader2, CheckCircle } from 'lucide-react';
import axios from 'axios';

export default function Dashboard() {
  const { auth, activeCertificate, messages } = usePage().props;
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

  // Translation keys
  const t = messages?.Sign || {
    title: "Sign Document",
    drag_qr: "Drag QR Code to position",
    save_to_drive: "Save to Google Drive",
    generate_key: "Generate Private Key",
    sign_and_seal: "Sign & Seal"
  };

  // Check if extension is installed
  useEffect(() => {
    const checkExtension = () => {
      if (window.__TRUSTLESS_SIGN_EXTENSION_INSTALLED__ === true) {
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
      alert("TrustlessSign Extension is required. Please install the extension first.");
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
              <LogOut size={16} /> <span className="hidden sm:inline">Logout</span>
            </Link>
          </div>
        </header>

        <main className="max-w-5xl mx-auto p-4 lg:p-8 mt-6">
          <h1 className="text-3xl font-bold mb-6">Welcome Back</h1>
          
          {/* Certificate Management Section */}
          <div className="glass-panel p-6 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${activeCertificate ? 'bg-accent-success-soft text-accent-success' : 'bg-accent-warning-soft text-accent-warning'}`}>
                <ShieldCheck size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg leading-none">
                  {activeCertificate ? 'Certificate Active' : 'No Active Certificate'}
                </h3>
                <p className="text-sm text-text-secondary leading-normal">
                  {activeCertificate 
                    ? `Serial: ${activeCertificate.serial_number} (Expires: ${new Date(activeCertificate.expires_at).toLocaleDateString()})` 
                    : 'Generate a certificate to sign documents offline with cryptographic certainty.'}
                </p>
              </div>
            </div>
            <button 
              onClick={handleCertificateAction}
              className={`px-6 py-3 rounded-lg font-bold text-sm transition-all focus:ring focus:outline-none cursor-pointer ${activeCertificate ? 'bg-accent-danger text-white hover:bg-opacity-90' : 'bg-accent-success text-white hover:bg-opacity-90'}`}
            >
              {activeCertificate ? 'Re-generate / Replace Certificate' : 'Generate Certificate'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/sign" className="glass-panel p-6 flex flex-col items-center text-center gap-4 hover:border-accent-primary group transition-all">
              <div className="w-16 h-16 rounded-full bg-accent-primary-soft flex items-center justify-center text-accent-primary group-hover:scale-110 transition-transform">
                <FileSignature size={32} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Sign New Document</h3>
                <p className="text-sm text-text-secondary mt-1">Upload a PDF and place your cryptographic QR signature securely.</p>
              </div>
            </Link>
            
            <div className="glass-panel p-6 flex flex-col items-center text-center gap-4 cursor-not-allowed opacity-75">
              <div className="w-16 h-16 rounded-full bg-surface-tertiary flex items-center justify-center text-text-tertiary">
                <UploadCloud size={32} />
              </div>
              <div>
                <h3 className="font-bold text-lg">My Documents</h3>
                <p className="text-sm text-text-secondary mt-1">View documents stored in your connected Google Drive.</p>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Certificate Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full p-6 space-y-6 bg-surface-elevated animate-fade-in relative z-55">
            {success ? (
              <div className="text-center py-6 space-y-4">
                <CheckCircle className="mx-auto text-accent-success" size={64} />
                <h3 className="text-xl font-bold">Certificate Issued!</h3>
                <p className="text-sm text-text-secondary">Your certificate and secure key have been generated and saved locally.</p>
              </div>
            ) : (
              <>
                {activeCertificate && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-accent-danger">
                      <AlertTriangle size={28} />
                      <h2 className="text-xl font-bold tracking-tight">⚠️ CRITICAL SECURITY WARNING!</h2>
                    </div>
                    
                    <div className="text-sm text-text-secondary space-y-2 leading-relaxed">
                      <p>You already have an active certificate registered in the system.</p>
                      <p className="font-semibold text-text-primary">If you continue to create/replace with a new certificate:</p>
                      <ol className="list-decimal list-inside pl-1 space-y-1">
                        <li>Your old certificate will automatically be <strong>REVOKED</strong>.</li>
                        <li>ALL PDF documents you have previously signed will become <strong>INVALID</strong> when others verify them.</li>
                        <li>The status of old documents will change to <strong>"CERTIFICATE REVOKED"</strong>.</li>
                      </ol>
                      <p className="font-semibold mt-4">Are you sure you want to continue?</p>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-text-secondary">Type "I UNDERSTAND" to continue</label>
                      <input 
                        type="text" 
                        value={confirmText} 
                        onChange={(e) => setConfirmText(e.target.value)} 
                        placeholder="I UNDERSTAND"
                        className="w-full px-3 py-2 border border-border-default rounded-md bg-surface-primary focus:ring focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-accent-primary">
                    <Key size={20} />
                    <h3 className="font-bold text-lg">{activeCertificate ? 'Create New Key' : 'Generate Secure Key'}</h3>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-text-secondary">New Certificate Password (Min 8 Characters)</label>
                    <input 
                      type="password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      placeholder="Enter new password..."
                      className="w-full px-3 py-2 border border-border-default rounded-md bg-surface-primary focus:ring focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-text-secondary">Confirm New Password</label>
                    <input 
                      type="password" 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                      placeholder="Confirm new password..."
                      className="w-full px-3 py-2 border border-border-default rounded-md bg-surface-primary focus:ring focus:outline-none"
                    />
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
                    ( CANCEL )
                  </button>
                  <button 
                    disabled={
                      (activeCertificate && confirmText !== 'I UNDERSTAND') || 
                      password.length < 8 || 
                      password !== confirmPassword || 
                      loading
                    }
                    onClick={handleGenerateCertificate}
                    className="px-4 py-2 bg-accent-danger text-white rounded-md hover:bg-opacity-90 transition-all text-sm font-semibold disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    {loading && <Loader2 className="animate-spin" size={16} />}
                    {activeCertificate ? '(( YES, REPLACE CERTIFICATE ))' : '(( GENERATE CERTIFICATE ))'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
