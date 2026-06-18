import React, { useState, useEffect, useRef } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import { Rnd } from 'react-rnd';
import { Document, Page, pdfjs } from 'react-pdf';
import { ShieldCheck, Upload, Save, Eye, Key, Loader2, CheckCircle2, AlertCircle, FileText, ExternalLink, HelpCircle } from 'lucide-react';
import LanguageSwitcher from '../Components/LanguageSwitcher';
import ThemeToggle from '../Components/ThemeToggle';
import axios from 'axios';
import JsBarcode from 'jsbarcode';
import { generateSignatureFrame, generateModernTSignQR, generatePageStamp } from '../Utils/barcode-generator.js';

// Make JsBarcode available globally for barcode-generator.js
if (typeof window !== 'undefined') {
  window.JsBarcode = JsBarcode;
}

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set worker for react-pdf (Vite compatible)
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function SignDocument() {
  const { auth, messages, locale } = usePage().props;
  const user = auth.user;

  // File states
  const [file, setFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const containerRef = useRef(null);
  const nodeRef = useRef(null);
  const [signatureType, setSignatureType] = useState('image');
  const [imageSigDataUrl, setImageSigDataUrl] = useState(null);

  // Form states
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [notes, setNotes] = useState('');
  const [password, setPassword] = useState('dr4gonlistio');

  // Signer states
  const [signerMode, setSignerMode] = useState('username');
  const [customSigner, setCustomSigner] = useState('');

  // Draggable QR Position and Size
  const [qrPosition, setQrPosition] = useState({ x: 50, y: 50 });
  const [qrSize, setQrSize] = useState({ width: 115, height: 76 });

  // Status and result states
  const [extensionInstalled, setExtensionInstalled] = useState(false);
  const [hasCert, setHasCert] = useState(null);
  const [signingStatus, setSigningStatus] = useState({
    isActive: false,
    stage: 'IDLE', // IDLE, DOWNLOADING, STAMPING, UPLOADING, SUCCESS, ERROR
    percentage: 0,
    message: ''
  });
  const [signResult, setSignResult] = useState(null);
  const [finalFileName, setFinalFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Translation fallbacks
  const t = messages?.Sign || {
    title: "Sign Document",
    drag_qr: "Drag QR Code to position",
    save_to_drive: "Save to Google Drive",
    generate_key: "Generate Private Key",
    sign_and_seal: "Sign & Seal",
    upload_pdf: "Upload PDF",
    upload_hint: "Click or drag PDF to upload",
    reason_category: "Reason Category",
    signing_reason: "Signing Reason",
    select_reason: "-- Select Reason --",
    reason_detail: "Reason Detail / Custom Note",
    reason_detail_placeholder: "Enter detail or custom reason...",
    additional_notes: "Additional Notes (Optional)",
    notes_placeholder: "Additional notes...",
    cert_password: "Master Certificate Password",
    cert_password_placeholder: "Enter certificate password...",
    qr_hint: "Position the QR code exactly where you want your cryptographic signature to appear.",
    preview_hint: "Document preview will appear here",
    qr_area: "QR Code Area",
    status_progress: "Status Progress",
    detail_status: "Detail Status:",
    success_title: "Document Successfully Signed!",
    success_desc: "Signature has been embedded and metadata successfully registered.",
    file_name: "File Name:",
    sha256_hash: "SHA-256 Hash:",
    verify_token: "Verify Token:",
    download_pdf: "Download Signed PDF",
    view_on_drive: "View on Drive",
    sign_another: "Sign another document",
    back_to_dashboard: "Back to Dashboard",
    extension_required: "TrustlessSign Extension Required",
    extension_desc: "Please download and install our browser extension to secure and sign your PDFs offline.",
  };

  const progressTranslations = {
    en: {
      title: "Processing Document...",
      step1: "Read original file from Google Drive",
      step2: "Embed cryptographic signature & QR Code",
      step3: "Upload stamped document back to Google Drive",
      downloading: "Reading original document to local memory...",
      stamping: "Computing document hash... Embedding QR Code and sealing RSA-2048 signature.",
      uploading: "Uploading secure document back to your Google Drive...",
      success: "Success! Recorded stamped document URL to TrustlessSign server."
    },
    id: {
      title: "Memproses Dokumen Berkas...",
      step1: "Membaca berkas asli dari Google Drive",
      step2: "Menyisipkan tanda tangan kriptografi & QR Code",
      step3: "Mengunggah dokumen ter-stamp kembali ke Google Drive",
      downloading: "Membaca berkas asli dari komputer lokal...",
      stamping: "Menghitung hash dokumen... Menyisipkan QR Code dan menyegel tanda tangan RSA-2048.",
      uploading: "Mengunggah dokumen aman kembali ke Google Drive Anda...",
      success: "Sukses! Mencatat URL dokumen ter-stamp ke server TrustlessSign."
    },
    th: {
      title: "กำลังประมวลผลเอกสาร...",
      step1: "อ่านไฟล์ต้นฉบับจาก Google Drive",
      step2: "ฝังลายเซ็นเข้ารหัสและ QR Code",
      step3: "อัปโหลดเอกสารที่ประทับตรากลับไปยัง Google Drive",
      downloading: "กำลังอ่านไฟล์ต้นฉบับลงในหน่วยความจำเครื่อง...",
      stamping: "กำลังคำนวณแฮชเอกสาร... กำลังฝัง QR Code และลงลายเซ็น RSA-2048",
      uploading: "กำลังอัปโหลดเอกสารที่ปลอดภัยกลับไปยัง Google Drive ของคุณ...",
      success: "สำเร็จ! บันทึก URL เอกสารที่ประทับตราไปยังเซิร์ฟเวอร์ TrustlessSign เรียบร้อยแล้ว"
    }
  };

  const currentLang = progressTranslations[locale] || progressTranslations.en;

  // 1. Fetch active extension presence & categories
  useEffect(() => {
    // Check extension
    if (window.__TRUSTLESS_SIGN_EXTENSION_INSTALLED__ === true || document.documentElement.dataset.trustlessSignInstalled === "true") {
      setExtensionInstalled(true);
    } else {
      const handlePingResponse = (e) => {
        if (e.data && e.data.type === 'TRUSTLESS_PING_RESPONSE') {
          setExtensionInstalled(true);
          window.removeEventListener('message', handlePingResponse);
        }
      };
      window.addEventListener('message', handlePingResponse);
      window.postMessage({ type: 'TRUSTLESS_PING_REQUEST' }, '*');
      return () => window.removeEventListener('message', handlePingResponse);
    }
  }, []);

  useEffect(() => {
    // Fetch reasons categories
    axios.get('/reasons/categories')
      .then(res => {
        setCategories(res.data);
        if (res.data.length > 0) {
          setSelectedCategoryId(res.data[0].id.toString());
          if (res.data[0].sub_categories && res.data[0].sub_categories.length > 0) {
            setSelectedSubCategoryId(res.data[0].sub_categories[0].id.toString());
          }
        }
      })
      .catch(err => console.error("Failed to load reason categories:", err));

    // Check certificate
    axios.get('/certificates/me')
      .then(res => {
        if (res.data.has_certificate === false) {
          setHasCert(false);
        } else {
          setHasCert(true);
        }
      })
      .catch(err => {
        if (err.response && err.response.status === 404) {
          setHasCert(false);
        }
      });
  }, []);

  // Fetch visual signature from extension when selected
  useEffect(() => {
    if (signatureType === 'image' && !imageSigDataUrl) {
      const handleFetchImage = (evt) => {
        if (evt.data && evt.data.type === 'TRUSTLESS_FETCH_IMAGE_SIG_RESPONSE') {
          window.removeEventListener('message', handleFetchImage);
          const result = evt.data.payload;
          if (result && result.status === 'success' && result.dataUrl) {
            setImageSigDataUrl(result.dataUrl);
          } else {
            alert('No visual signature found. Please upload one in the TrustlessSign Extension (Keys & Cert tab).');
            setSignatureType('qr');
          }
        }
      };
      window.addEventListener('message', handleFetchImage);
      window.postMessage({ type: 'TRUSTLESS_FETCH_IMAGE_SIG_REQUEST' }, '*');
      
      return () => window.removeEventListener('message', handleFetchImage);
    }
  }, [signatureType, imageSigDataUrl]);

  // Handle Default Size when switching Signature Type
  useEffect(() => {
    if (signatureType === 'image') {
      setQrSize({ width: 115, height: 76 });
    } else {
      setQrSize({ width: 72, height: 46 });
    }
  }, [signatureType]);

  const currentCategory = categories.find(c => c.id.toString() === selectedCategoryId);
  const subCategories = currentCategory?.sub_categories || [];

  const onFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type === 'application/pdf') {
      setFile(selected);
      setPageNumber(1);
      setSignResult(null);
    }
  };

  const handleDrag = (e, data) => {
    setQrPosition({ x: data.x, y: data.y });
  };

  const handleDragStop = (e, data) => {
    setQrPosition({ x: data.x, y: data.y });
  };

  // Convert File object to Base64 helper
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const handleSign = async (e) => {
    e.preventDefault();
    if (!file || !password) return;

    setErrorMsg('');
    setSigningStatus({
      isActive: true,
      stage: 'DOWNLOADING',
      percentage: 15,
      message: currentLang.downloading
    });

    try {
      // 1. Fetch Sanctum API token and GDrive credentials
      const credsRes = await axios.get('/user/credentials');
      let { token, gdrive_token } = credsRes.data;

      // Automatically refresh GDrive token to prevent 401 Unauthenticated errors
      try {
        const refreshRes = await axios.post('/api/gdrive/refresh', {}, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (refreshRes.data && refreshRes.data.gdrive_token) {
          gdrive_token = refreshRes.data.gdrive_token;
        }
      } catch (refreshErr) {
        if (refreshErr.response && (refreshErr.response.status === 401 || refreshErr.response.status === 400)) {
          setErrorMsg("Google Drive Session Expired. Please sign out and sign in again to reconnect your account.");
          setSigningStatus({ isActive: false, stage: 'ERROR', percentage: 0, message: '' });
          return;
        }
        console.warn('Failed to refresh GDrive token. Proceeding with existing token.', refreshErr);
      }

      // Convert PDF to Base64
      const pdfBase64 = await fileToBase64(file);

      // Generate verification token client-side
      const verifyToken = crypto.randomUUID();
      const verifyUrlFull = `${window.location.origin}/verify/${verifyToken}`;
      const verifyUrlShort = `${window.location.origin}/verify`;
      const shortId = verifyToken.split('-')[0].toUpperCase();

      let finalQrPngBase64 = '';
      const actualSigner = signerMode === 'custom' ? customSigner : user.name;
      if (signatureType === 'image') {
        finalQrPngBase64 = await generateSignatureFrame(
            actualSigner,
            shortId,
            verifyUrlShort,
            imageSigDataUrl,
            false, // isQrCode = false
            t.signed_by,
            t.verify_at
        );
      } else {
        // Modern standalone QR Code
        finalQrPngBase64 = await generateModernTSignQR(verifyUrlFull);
      }

      // Get concatenated final reason text
      const selectedSub = subCategories.find(s => s.id.toString() === selectedSubCategoryId);
      const subText = locale === 'id' ? selectedSub?.reason_text_id 
                    : locale === 'th' ? selectedSub?.reason_text_th 
                    : selectedSub?.reason_text_en;
      
      let reason_final = '';
      if (selectedSub?.is_custom) {
        reason_final = customReason;
      } else {
        reason_final = subText && customReason ? `${subText}: ${customReason}`
                     : subText ? subText
                     : customReason ? customReason
                     : 'Digital Verification';
      }

      // Simulate download time to make UI feel premium
      await new Promise(r => setTimeout(r, 1200));

      // 2. Move to Stamping Phase
      setSigningStatus({
        isActive: true,
        stage: 'STAMPING',
        percentage: 45,
        message: currentLang.stamping
      });

      await new Promise(r => setTimeout(r, 1000));

      // 3. Trigger signing extension via content script bridging
      const handleExtensionResponse = (evt) => {
        if (evt.data && evt.data.type === 'TRUSTLESS_SIGN_RESPONSE') {
          window.removeEventListener('message', handleExtensionResponse);
          
          const result = evt.data.payload;
          if (result && (result.status === 'success' || result.status === 'warning')) {
            // Upload completed successfully
            setSigningStatus({
              isActive: true,
              stage: 'SUCCESS',
              percentage: 100,
              message: currentLang.success
            });

            setTimeout(() => {
              setSigningStatus(prev => ({ ...prev, isActive: false }));
              setSignResult({
                verifyToken: result.verifyToken,
                hash: result.hash,
                gdriveUrl: result.gdriveUrl,
                verifyUrl: verifyUrlFull,
                pdfBase64: result.pdfBase64,
                isWarning: result.status === 'warning',
                warningMessage: result.message
              });
            }, 1500);

          } else {
            setErrorMsg(result?.message || "Failed to sign document.");
            setSigningStatus({ isActive: false, stage: 'ERROR', percentage: 0, message: '' });
          }
        } else if (evt.data && evt.data.type === 'TRUSTLESS_SIGN_ERROR') {
          window.removeEventListener('message', handleExtensionResponse);
          const result = evt.data.payload;
          setErrorMsg(result?.message || "Extension communication error.");
          setSigningStatus({ isActive: false, stage: 'ERROR', percentage: 0, message: '' });
        }
      };

      window.addEventListener('message', handleExtensionResponse);

      // Start simulated upload progress
      setSigningStatus({
        isActive: true,
        stage: 'UPLOADING',
        percentage: 55,
        message: currentLang.uploading
      });

      let uploadPct = 55;
      const progressInterval = setInterval(() => {
        if (uploadPct < 92) {
          uploadPct += Math.floor(Math.random() * 8) + 3;
          setSigningStatus(prev => {
            if (prev.stage === 'UPLOADING') {
              return { ...prev, percentage: uploadPct };
            }
            return prev;
          });
        } else {
          clearInterval(progressInterval);
        }
      }, 400);

      const now = new Date();
      const timestamp = now.getFullYear() + '.' + 
          String(now.getMonth() + 1).padStart(2, '0') + '.' + 
          String(now.getDate()).padStart(2, '0') + '_' + 
          String(now.getHours()).padStart(2, '0') + '-' + 
          String(now.getMinutes()).padStart(2, '0') + '-' + 
          String(now.getSeconds()).padStart(2, '0');
      const prefixedFilename = `signed_web_${timestamp}-${file.name}`;
      setFinalFileName(prefixedFilename);

      // Generate pageStamps array for marginal stamping
      const pageStamps = [];
      for (let i = 1; i <= numPages; i++) {
        const stampStr = await generatePageStamp(shortId, i, numPages, timestamp);
        pageStamps.push(stampStr);
      }

      window.postMessage({
        type: 'TRUSTLESS_SIGN_REQUEST',
        payload: {
          pdfBase64: pdfBase64,
          filename: prefixedFilename,
          gdriveToken: gdrive_token,
          apiToken: token,
          pageStamps: pageStamps,
          qrPosition: {
            page: pageNumber,
            x: qrPosition.x,
            y: qrPosition.y,
            size: qrSize.width
          },
          reason_sub_category_id: selectedSubCategoryId ? parseInt(selectedSubCategoryId) : null,
          reason_final: reason_final,
          notes: notes,
          password: password,
          qrPngBase64: finalQrPngBase64,
          author: actualSigner,
          verifyToken: verifyToken
        }
      }, '*');

    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || err.message || "An error occurred during signing.");
      setSigningStatus({ isActive: false, stage: 'ERROR', percentage: 0, message: '' });
    }
  };

  const downloadSignedPdf = () => {
    if (!signResult || !signResult.pdfBase64) return;
    const binary = atob(signResult.pdfBase64);
    const array = [];
    for (let i = 0; i < binary.length; i++) {
      array.push(binary.charCodeAt(i));
    }
    const blob = new Blob([new Uint8Array(array)], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = finalFileName || `signed_web_${file.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to determine status checklist icon & text style
  const getStepStatus = (stepStage) => {
    const stages = ['IDLE', 'DOWNLOADING', 'STAMPING', 'UPLOADING', 'SUCCESS'];
    const currentIdx = stages.indexOf(signingStatus.stage);
    const stepIdx = stages.indexOf(stepStage);

    if (currentIdx > stepIdx) {
      return { icon: <span className="text-accent-success font-semibold mr-2">✔️</span>, textStyle: 'text-text-secondary' };
    } else if (currentIdx === stepIdx) {
      return { icon: <span className="inline-block animate-spin mr-2">🔄</span>, textStyle: 'text-text-primary font-bold' };
    } else {
      return { icon: <span className="text-text-tertiary mr-2">⏳</span>, textStyle: 'text-text-tertiary' };
    }
  };

  return (
    <>
      <Head title={t.title} />
      <div className="min-h-screen p-4 md:p-8 relative">
        <div className="max-w-5xl mx-auto space-y-6">
          <header className="flex items-center justify-between glass-panel p-4 relative z-50">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-accent-primary" size={24} />
              <h1 className="text-xl font-bold">{t.title}</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <LanguageSwitcher />
                <ThemeToggle />
              </div>
              <div className="w-px h-6 bg-border-default hidden sm:block"></div>
              <button 
                onClick={() => router.visit('/dashboard')}
                className="text-sm font-semibold text-text-secondary hover:text-accent-primary transition-all focus:outline-none cursor-pointer"
              >
                {t.back_to_dashboard}
              </button>
            </div>
          </header>

          {!extensionInstalled && (
            <div className="bg-accent-warning-soft border border-accent-warning text-text-primary p-4 rounded-lg flex items-center gap-3">
              <AlertCircle className="text-accent-warning" size={24} />
              <div>
                <h4 className="font-bold">{t.extension_required}</h4>
                <p className="text-sm text-text-secondary">{t.extension_desc}</p>
              </div>
            </div>
          )}

          {extensionInstalled && hasCert === false && (
            <div className="bg-accent-danger-soft border border-accent-danger text-accent-danger p-4 rounded-lg flex items-center gap-3 mb-4">
              <AlertCircle className="text-accent-danger" size={24} />
              <div>
                <h4 className="font-bold">No Certificate Found</h4>
                <p className="text-sm">Please open the TrustlessSign Extension, go to "Keys & Cert" tab, and generate your certificate first.</p>
              </div>
            </div>
          )}

          {signResult ? (
            // SIGN SUCCESS SCREEN
            <div className="glass-panel p-8 max-w-xl mx-auto space-y-6 text-center animate-fade-in">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-lg ${signResult.isWarning ? 'bg-accent-warning-soft text-accent-warning' : 'bg-accent-success-soft text-accent-success'}`}>
                {signResult.isWarning ? <AlertCircle size={48} /> : <CheckCircle2 size={48} />}
              </div>
              <div className="space-y-2">
                <h2 className={`text-2xl font-bold ${signResult.isWarning ? 'text-accent-warning' : 'text-text-primary'}`}>
                  {signResult.isWarning ? 'Saved Locally' : t.success_title}
                </h2>
                <p className="text-sm text-text-secondary">
                  {signResult.isWarning ? (signResult.warningMessage || 'Google Drive session expired. Document saved locally.') : t.success_desc}
                </p>
              </div>

              <div className="p-4 bg-surface-primary rounded-lg text-left space-y-3 border border-border-subtle text-xs">
                <div className="flex justify-between border-b border-border-subtle pb-2">
                  <span className="text-text-tertiary">{t.file_name}</span>
                  <span className="font-semibold text-text-primary">{file.name}</span>
                </div>
                <div className="flex justify-between border-b border-border-subtle pb-2">
                  <span className="text-text-tertiary">{t.sha256_hash}</span>
                  <span className="font-mono text-text-primary overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px]" title={signResult.hash}>
                    {signResult.hash}
                  </span>
                </div>
                <div className="flex justify-between pb-2">
                  <span className="text-text-tertiary">{t.verify_token}</span>
                  <span className="font-mono text-text-primary">{signResult.verifyToken}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center">
                <button 
                  onClick={downloadSignedPdf}
                  className="flex items-center justify-center gap-2 bg-accent-success text-white px-5 py-3 rounded-lg hover:bg-opacity-90 font-semibold transition-all text-sm cursor-pointer shadow-md"
                >
                  <Save size={16} /> {t.download_pdf}
                </button>
                {signResult.gdriveUrl && (
                  <a 
                    href={signResult.gdriveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 border border-border-strong px-5 py-3 rounded-lg hover:bg-surface-secondary text-text-primary font-semibold transition-all text-sm cursor-pointer"
                  >
                    <ExternalLink size={16} /> {t.view_on_drive}
                  </a>
                )}
              </div>
              <div className="pt-4 border-t border-border-subtle">
                <button 
                  onClick={() => { setFile(null); setSignResult(null); }}
                  className="text-sm text-accent-primary font-semibold hover:underline cursor-pointer"
                >
                  {t.sign_another}
                </button>
              </div>
            </div>
          ) : (
            // SIGN FORM SCREEN
            <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <aside className="glass-panel p-6 space-y-6 h-fit lg:col-span-1">
                <form onSubmit={handleSign} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold mb-2">{t.upload_pdf}</label>
                    <div className="border-2 border-dashed border-border-strong rounded-lg p-6 text-center hover:border-accent-primary transition-colors cursor-pointer relative">
                      <input type="file" accept=".pdf" onChange={onFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required />
                      <Upload className="mx-auto text-text-tertiary mb-2" size={24} />
                      <p className="text-sm text-text-secondary">{t.upload_hint}</p>
                    </div>
                  </div>

                  {file && (
                    <>
                      {/* Signature Type Selector */}
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-text-secondary">Signature Type</label>
                        <select 
                          value={signatureType} 
                          onChange={(e) => setSignatureType(e.target.value)}
                          className="w-full px-3 py-2 border border-border-default rounded-md bg-surface-elevated text-sm text-text-primary focus:ring focus:outline-none focus:border-accent-primary"
                        >
                          <option value="qr">Cryptographic QR Code</option>
                          <option value="image">Visual Signature (Image)</option>
                        </select>
                      </div>

                      {/* Penanda tangan (Signer) Selector */}
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-text-secondary">Penanda tangan (Signer)</label>
                        <select 
                          value={signerMode} 
                          onChange={(e) => {
                            setSignerMode(e.target.value);
                            if (e.target.value === 'username') {
                              alert(`Penandatangan atau Signer adalah ${user.name}`);
                            }
                          }}
                          className="w-full px-3 py-2 border border-border-default rounded-md bg-surface-elevated text-sm text-text-primary focus:ring focus:outline-none focus:border-accent-primary"
                        >
                          <option value="username">{user.name} (Google)</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>

                      {/* Custom Signer Input */}
                      {signerMode === 'custom' && (
                        <div className="space-y-1 animate-fade-in">
                          <label className="block text-xs font-semibold text-text-secondary">Nama Penanda tangan</label>
                          <input 
                            type="text" 
                            value={customSigner}
                            onChange={(e) => setCustomSigner(e.target.value)}
                            placeholder="Masukkan nama penanda tangan..."
                            className="w-full px-3 py-2 border border-border-default rounded-md bg-surface-elevated text-sm text-text-primary focus:ring focus:outline-none focus:border-accent-primary"
                            required
                          />
                        </div>
                      )}

                      {/* Reason Category dropdown */}
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-text-secondary">{t.reason_category}</label>
                        <select 
                          value={selectedCategoryId} 
                          onChange={(e) => {
                            setSelectedCategoryId(e.target.value);
                            setSelectedSubCategoryId('');
                          }}
                          className="w-full px-3 py-2 border border-border-default rounded-md bg-surface-elevated text-sm text-text-primary focus:ring focus:outline-none focus:border-accent-primary"
                        >
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>
                              {locale === 'id' ? cat.name_id : locale === 'th' ? cat.name_th : cat.name_en}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Reason Subcategory dropdown */}
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-text-secondary">{t.signing_reason}</label>
                        <select 
                          value={selectedSubCategoryId} 
                          onChange={(e) => setSelectedSubCategoryId(e.target.value)}
                          className="w-full px-3 py-2 border border-border-default rounded-md bg-surface-elevated text-sm text-text-primary focus:ring focus:outline-none focus:border-accent-primary"
                          required
                        >
                          <option value="">{t.select_reason}</option>
                          {subCategories.map(sub => (
                            <option key={sub.id} value={sub.id}>
                              {locale === 'id' ? sub.reason_text_id : locale === 'th' ? sub.reason_text_th : sub.reason_text_en}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Custom note / Detail input */}
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-text-secondary">{t.reason_detail}</label>
                        <textarea 
                          value={customReason}
                          onChange={(e) => setCustomReason(e.target.value)}
                          placeholder={t.reason_detail_placeholder}
                          className="w-full px-3 py-2 border border-border-default rounded-md bg-surface-elevated text-sm text-text-primary focus:ring focus:outline-none focus:border-accent-primary h-20 resize-none"
                        />
                      </div>

                      {/* Notes text area */}
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-text-secondary">{t.additional_notes}</label>
                        <textarea 
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder={t.notes_placeholder}
                          className="w-full px-3 py-2 border border-border-default rounded-md bg-surface-elevated text-sm text-text-primary focus:ring focus:outline-none focus:border-accent-primary h-16 resize-none"
                        />
                      </div>


                      {/* Password input */}
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-text-secondary flex items-center gap-1">
                          <Key size={12} /> {t.cert_password}
                        </label>
                        <input 
                          type="password" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={t.cert_password_placeholder}
                          className="w-full px-3 py-2 border border-border-default rounded-md bg-surface-elevated text-sm text-text-primary focus:ring focus:outline-none focus:border-accent-primary"
                          required
                        />
                      </div>

                      <div className="p-3 bg-surface-elevated border border-border-subtle rounded-md">
                        <p className="text-xs font-semibold text-accent-primary mb-1">{t.drag_qr}</p>
                        <p className="text-[10px] text-text-tertiary">{t.qr_hint}</p>
                      </div>
                    </>
                  )}

                  {errorMsg && (
                    <div className="bg-accent-danger-soft border border-accent-danger text-accent-danger p-3 rounded-md text-xs font-semibold">
                      {errorMsg}
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={!file || !extensionInstalled || !password || hasCert === false || (signerMode === 'custom' && !customSigner.trim())}
                    className="w-full bg-text-primary text-surface-primary py-3 rounded-lg font-semibold disabled:opacity-50 transition-colors cursor-pointer hover:bg-opacity-90 shadow-sm"
                  >
                    {t.sign_and_seal}
                  </button>
                </form>
              </aside>

              <section className="lg:col-span-2 glass-panel p-6 min-h-[600px] flex flex-col items-center justify-center overflow-auto relative">
                {!file ? (
                  <div className="text-center text-text-tertiary">
                    <Eye className="mx-auto mb-2 opacity-50" size={48} />
                    <p>{t.preview_hint}</p>
                  </div>
                ) : (
                  <div className="w-full flex flex-col items-center">
                    {numPages > 1 && (
                      <div className="flex items-center gap-3 bg-surface-elevated p-2 rounded-lg border border-border-default shadow-sm mb-4">
                        <button 
                          onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                          disabled={pageNumber <= 1}
                          className="px-3 py-1 bg-surface-primary border border-border-subtle rounded text-sm text-text-primary disabled:opacity-50 hover:bg-surface-secondary transition-colors cursor-pointer"
                          type="button"
                        >
                          Prev
                        </button>
                        <span className="text-sm font-semibold text-text-secondary whitespace-nowrap">
                          Page {pageNumber} of {numPages}
                        </span>
                        <button 
                          onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
                          disabled={pageNumber >= numPages}
                          className="px-3 py-1 bg-surface-primary border border-border-subtle rounded text-sm text-text-primary disabled:opacity-50 hover:bg-surface-secondary transition-colors cursor-pointer"
                          type="button"
                        >
                          Next
                        </button>
                        <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border-subtle">
                          <span className="text-xs text-text-tertiary">Go to:</span>
                          <input 
                            type="number" 
                            min="1" 
                            max={numPages}
                            placeholder="#"
                            className="w-16 px-2 py-1 text-sm border border-border-default rounded bg-surface-primary text-text-primary focus:outline-none focus:border-accent-primary"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const val = parseInt(e.target.value, 10);
                                if (!isNaN(val) && val >= 1 && val <= numPages) {
                                  setPageNumber(val);
                                  e.target.value = '';
                                }
                              }
                            }}
                          />
                        </div>
                      </div>
                    )}
                    <div className="relative border border-border-default shadow-md bg-white select-none" ref={containerRef}>
                    <Document 
                      file={file} 
                      onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                      className="max-w-full"
                    >
                      <Page pageNumber={pageNumber} width={600} />
                    </Document>

                    {/* Resizable and Draggable QR Code Representation */}
                    <Rnd
                      bounds="parent"
                      size={{ width: qrSize.width, height: qrSize.height }}
                      position={{ x: qrPosition.x, y: qrPosition.y }}
                      onDragStop={(e, d) => {
                        setQrPosition({ x: d.x, y: d.y });
                        console.log(`Ukuran : ${qrSize.width} x ${qrSize.height}`);
                        console.log(`Posisi : x=${Math.round(d.x)}, y=${Math.round(d.y)}`);
                      }}
                      onResizeStop={(e, direction, ref, delta, position) => {
                        const newWidth = parseInt(ref.style.width, 10);
                        const newHeight = parseInt(ref.style.height, 10);
                        setQrSize({
                          width: newWidth,
                          height: newHeight
                        });
                        setQrPosition(position);
                        console.log(`Ukuran : ${newWidth} x ${newHeight}`);
                        console.log(`Posisi : x=${Math.round(position.x)}, y=${Math.round(position.y)}`);
                      }}
                      lockAspectRatio={signatureType === 'qr' ? true : true}
                      className="absolute top-0 left-0 border-2 border-accent-primary bg-white/80 flex items-center justify-center cursor-move shadow-lg backdrop-blur-sm group rounded-md select-none z-55 overflow-hidden"
                    >
                        <div className="absolute -top-8 bg-surface-elevated text-xs px-2 py-1 rounded shadow-md border border-border-subtle opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          Drag and resize to place the signature
                        </div>
                        {signatureType === 'image' && imageSigDataUrl ? (
                          <img src={imageSigDataUrl} alt="Visual Signature" className="w-full h-full object-contain pointer-events-none select-none" />
                        ) : (
                          <img src="/logo-tSign.svg" alt="QR Code" className="w-1/3 h-1/3 opacity-50 pointer-events-none select-none" />
                        )}
                    </Rnd>
                  </div>
                )}
              </section>
            </main>
          )}
        </div>
      </div>

      {/* Progress Status Overlay Modal */}
      {signingStatus.isActive && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full p-6 space-y-6 bg-surface-elevated animate-fade-in border border-border-default shadow-xl">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-text-primary">{currentLang.title}</h3>
              <p className="text-xs text-text-tertiary">{signingStatus.message}</p>
            </div>

            {/* Custom Progress Bar */}
            <div className="space-y-2">
              <div className="w-full bg-surface-secondary h-3 rounded-full overflow-hidden border border-border-subtle">
                <div 
                  className={`h-full transition-all duration-300 rounded-full ${signingStatus.stage === 'SUCCESS' ? 'bg-accent-success' : 'bg-accent-primary'}`}
                  style={{ width: `${signingStatus.percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs font-semibold text-text-secondary">
                <span>{t.status_progress}</span>
                <span>{signingStatus.percentage}%</span>
              </div>
            </div>

            {/* Detailed Checklist Status */}
            <div className="pt-2 border-t border-border-subtle space-y-3 text-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-2">{t.detail_status}</p>
              
              <div className="flex items-center">
                {getStepStatus('DOWNLOADING').icon}
                <span className={getStepStatus('DOWNLOADING').textStyle}>{currentLang.step1}</span>
              </div>
              
              <div className="flex items-center">
                {getStepStatus('STAMPING').icon}
                <span className={getStepStatus('STAMPING').textStyle}>{currentLang.step2}</span>
              </div>
              
              <div className="flex items-center">
                {getStepStatus('UPLOADING').icon}
                <span className={getStepStatus('UPLOADING').textStyle}>
                  {currentLang.step3} {signingStatus.stage === 'UPLOADING' && `(${signingStatus.percentage}%)`}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
