import React, { useEffect, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { ShieldAlert, ShieldCheck, Download, AlertTriangle, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function Verify({ token }) {
  const { messages } = usePage().props;
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const t = messages?.Verification || {
    title: "Document Verification",
    valid: "Document Valid",
    invalid: "Not Valid",
    not_saved: "Document Not Valid (Not Yet Saved)",
    signer: "Signer",
    signed_at: "Signed At"
  };

  useEffect(() => {
    axios.get(`/api/v1/verify/${token}`)
      .then(res => {
        setData(res.data);
      })
      .catch(err => {
        setError(err.response?.data?.message || 'Verification failed. Document not found.');
      })
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <>
      <Head title={t.title} />
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="glass-panel max-w-lg w-full p-8 space-y-6">
          <h1 className="text-2xl font-bold text-center border-b border-border-subtle pb-4">{t.title}</h1>

          {loading && (
            <div className="flex flex-col items-center py-12 text-text-tertiary">
              <Loader2 className="animate-spin mb-4 text-accent-primary" size={32} />
              <p>Verifying cryptographic signature...</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-accent-danger-soft flex items-center justify-center text-accent-danger">
                <ShieldAlert size={32} />
              </div>
              <h2 className="text-xl font-bold text-accent-danger">
                {error.includes('Belum Tersimpan') ? t.not_saved : t.invalid}
              </h2>
              <p className="text-sm text-text-secondary">{error}</p>
            </div>
          )}

          {data && !loading && (
            <div className="space-y-6">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-accent-success-soft flex items-center justify-center text-accent-success mb-2">
                  <ShieldCheck size={32} />
                </div>
                <h2 className="text-xl font-bold text-accent-success">{t.valid}</h2>
                <div className="badge-premium bg-surface-secondary shadow-none border-border-default mt-2">
                  <span className="pulsing-dot"></span>
                  Signature Verified
                </div>
              </div>

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
                  <span className="text-text-tertiary">Certificate Status</span>
                  <span className={`font-semibold capitalize ${data.certificate.status === 'valid' ? 'text-accent-success' : 'text-accent-danger'}`}>
                    {data.certificate.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-tertiary">Document Hash</span>
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
                  <Download size={18} /> View Original Document
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
