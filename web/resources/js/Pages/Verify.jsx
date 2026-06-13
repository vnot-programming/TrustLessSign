import React, { useEffect, useState, useRef } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { ShieldAlert, ShieldCheck, Download, Loader2, Camera, Search } from 'lucide-react';
import axios from 'axios';
import { Html5Qrcode } from 'html5-qrcode';

export default function Verify({ token }) {
  const { messages } = usePage().props;
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(!!token);
  const [shortIdInput, setShortIdInput] = useState('');
  
  // Scanner States
  const [isScanning, setIsScanning] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const scannerRef = useRef(null);

  const t = messages?.Verification || {
    title: "Document Verification",
    valid: "Document Valid",
    invalid: "Not Valid",
    not_saved: "Document Not Valid (Not Yet Saved)",
    signer: "Signer",
    signed_at: "Signed At",
    cert_status: "Certificate Status",
    doc_hash: "Document Hash",
    verifying: "Verifying cryptographic signature...",
    sig_verified: "Signature Verified",
    view_doc: "View Original Document",
  };

  useEffect(() => {
    if (token) {
      axios.get(`/api/verify/${token}`)
        .then(res => {
          setData(res.data);
        })
        .catch(err => {
          setError(err.response?.data?.message || 'Verification failed. Document not found.');
        })
        .finally(() => setLoading(false));
    }
  }, [token]);

  // Scanner Logic
  useEffect(() => {
    let html5QrCode;
    if (!token && isScanning) {
      html5QrCode = new Html5Qrcode("reader");
      
      html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 100 },
          aspectRatio: window.innerWidth < 600 ? 1.0 : 1.77,
        },
        (decodedText) => {
          html5QrCode.stop().then(() => {
            setIsScanning(false);
            // Assuming the decoded text might be the full URL or just the token/shortId
            // Extract token if it's a URL
            let scannedToken = decodedText;
            if (decodedText.includes('/verify/')) {
               scannedToken = decodedText.split('/verify/').pop();
            }
            window.location.href = `/verify/${scannedToken}`;
          });
        },
        (errorMessage) => {
          // parse error, ignore mostly
        }
      ).catch((err) => {
        setScannerError("Camera permission denied or camera not found. Please enter ID manually.");
        setIsScanning(false);
      });
    }

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(console.error);
      }
    };
  }, [isScanning, token]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (shortIdInput.trim()) {
      window.location.href = `/verify/${shortIdInput.trim()}`;
    }
  };

  if (!token) {
    return (
      <>
        <Head title={t.title} />
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <div className="glass-panel max-w-lg w-full p-8 space-y-6">
            <h1 className="text-2xl font-bold text-center border-b border-border-subtle pb-4">{t.title}</h1>
            
            <div className="space-y-4">
              <p className="text-center text-text-secondary text-sm">
                Scan the Barcode/QR Code on the document or enter the ID manually.
              </p>

              {/* Scanner View */}
              {isScanning ? (
                <div className="relative overflow-hidden rounded-xl border border-accent-primary shadow-lg bg-black">
                  <div id="reader" className="w-full"></div>
                  <button 
                    onClick={() => setIsScanning(false)}
                    className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 z-10 text-xs"
                  >
                    Cancel
                  </button>
                  <style dangerouslySetInnerHTML={{__html: `
                    @keyframes scan {
                      0% { top: 30%; }
                      50% { top: 70%; }
                      100% { top: 30%; }
                    }
                  `}} />
                  <div className="absolute inset-0 pointer-events-none border-[3px] border-accent-primary opacity-50 z-0"></div>
                  <div className="absolute top-[30%] left-[15%] w-[70%] h-[2px] bg-accent-primary animate-[scan_2s_ease-in-out_infinite] shadow-[0_0_8px_var(--accent-primary)] z-10"></div>
                </div>
              ) : (
                <button 
                  onClick={() => setIsScanning(true)}
                  className="w-full py-12 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border-default rounded-xl bg-surface-secondary hover:border-accent-primary hover:bg-accent-primary-soft transition-colors text-text-secondary hover:text-accent-primary"
                >
                  <Camera size={48} strokeWidth={1.5} />
                  <span className="font-semibold">Tap to Scan Barcode / QR</span>
                </button>
              )}

              {scannerError && (
                <div className="p-3 bg-accent-danger-soft border border-accent-danger text-accent-danger text-xs rounded-lg text-center">
                  {scannerError}
                </div>
              )}

              <div className="flex items-center gap-4 my-4">
                <div className="flex-1 h-px bg-border-subtle"></div>
                <span className="text-xs text-text-tertiary font-medium uppercase tracking-wider">OR</span>
                <div className="flex-1 h-px bg-border-subtle"></div>
              </div>

              {/* Manual Entry */}
              <form onSubmit={handleManualSubmit} className="space-y-3">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">Manual ID Entry</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
                      <Search size={16} />
                    </div>
                    <input 
                      type="text" 
                      value={shortIdInput}
                      onChange={(e) => setShortIdInput(e.target.value.toUpperCase())}
                      placeholder="e.g. TLS-A1B2C3D4"
                      className="w-full pl-10 pr-4 py-3 bg-surface-primary border border-border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent uppercase font-mono"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={!shortIdInput.trim()}
                    className="bg-text-primary text-surface-primary px-6 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    Verify
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head title={t.title} />
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="glass-panel max-w-lg w-full p-8 space-y-6">
          <h1 className="text-2xl font-bold text-center border-b border-border-subtle pb-4">{t.title}</h1>

          {loading && (
            <div className="flex flex-col items-center py-12 text-text-tertiary">
              <Loader2 className="animate-spin mb-4 text-accent-primary" size={32} />
              <p>{t.verifying}</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-accent-danger-soft flex items-center justify-center text-accent-danger">
                <ShieldAlert size={32} />
              </div>
              <h2 className="text-xl font-bold text-accent-danger">
                {error.includes('Belum Tersimpan') || error.includes('Not Yet Saved') ? t.not_saved : t.invalid}
              </h2>
              <p className="text-sm text-text-secondary">{error}</p>
            </div>
          )}

          {data && !loading && (() => {
            const docStatus = data.document_status; // 'verified', 'signed_revoked_cert', 'signed_expired_cert', 'signed_invalid_cert'
            const certStatus = data.certificate.status; // 'valid', 'revoked', 'expired', 'invalid'

            const isVerified = docStatus === 'verified';
            const isInvalid = docStatus === 'signed_invalid_cert';
            const isWarning = !isVerified && !isInvalid; // revoked or expired

            const themeColor = isVerified ? 'success' : isInvalid ? 'danger' : 'warning';
            const mainIconBg = `bg-accent-${themeColor}-soft`;
            const mainIconColor = `text-accent-${themeColor}`;

            return (
              <div className="space-y-6">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${mainIconBg} ${mainIconColor}`}>
                    {isInvalid ? <ShieldAlert size={32} /> : <ShieldCheck size={32} />}
                  </div>
                  <h2 className={`text-xl font-bold ${mainIconColor}`}>
                    {isVerified ? t.valid : isInvalid ? t.invalid : 'Perlu Konfirmasi'}
                  </h2>
                  
                  {/* Layer 1, 2, 3 Status */}
                  <div className="flex flex-wrap justify-center gap-2 mt-2">
                    <div className="badge-premium bg-surface-secondary shadow-none border-border-default">
                      <span className="pulsing-dot bg-accent-success"></span>
                      Document Valid
                    </div>
                    {!isInvalid && (
                      <div className="badge-premium bg-surface-secondary shadow-none border-border-default">
                        <span className="pulsing-dot bg-accent-success"></span>
                        {t.sig_verified}
                      </div>
                    )}
                    <div className="badge-premium bg-surface-secondary shadow-none border-border-default">
                      <span className={`pulsing-dot bg-accent-${themeColor}`}></span>
                      Certificate {isVerified ? 'Valid' : 'inValid'}
                    </div>
                  </div>
                </div>

                {/* Catatan Khusus untuk status Oranye */}
                {isWarning && (
                  <div className="bg-accent-warning-soft border border-accent-warning text-accent-warning p-4 rounded-lg text-sm leading-relaxed">
                    <p className="font-bold mb-1">⚠️ Catatan Khusus:</p>
                    <p>
                      "Dokumen ini terbukti asli dan benar ditandatangani oleh <strong>{data.signer.name}</strong>. Namun, sertifikat keamanan yang digunakan pada saat itu kini telah <strong>{certStatus === 'revoked' ? 'dinonaktifkan' : 'kedaluwarsa'}</strong>. Sebagai langkah kehati-hatian, mohon pastikan kembali keabsahan dokumen ini secara langsung kepada pihak yang bersangkutan."
                    </p>
                  </div>
                )}

                <div className="bg-surface-secondary rounded-lg p-4 space-y-3 text-sm">
                  <div className="flex justify-between border-b border-border-default pb-2">
                    <span className="text-text-tertiary">{t.signer}</span>
                    <span className="font-semibold">{data.signer.name} ({data.signer.email})</span>
                  </div>
                  <div className="flex justify-between border-b border-border-default pb-2">
                    <span className="text-text-tertiary">{t.signed_at}</span>
                    <span className="font-semibold">{new Date(data.document.signed_at).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b border-border-default pb-2">
                    <span className="text-text-tertiary">{t.cert_status}</span>
                    <span className={`font-semibold capitalize ${mainIconColor}`}>
                      {certStatus}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">{t.doc_hash}</span>
                    <span className="font-mono text-xs truncate max-w-[150px]" title={data.document.doc_hash_sha256}>
                      {data.document.doc_hash_sha256}
                    </span>
                  </div>
                </div>

                {data.document.gdrive_url_signed && (
                  <a 
                    href={data.document.gdrive_url_signed} 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-text-primary text-surface-primary py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-colors focus:ring focus:outline-none"
                  >
                    <Download size={18} /> {t.view_doc}
                  </a>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </>
  );
}
