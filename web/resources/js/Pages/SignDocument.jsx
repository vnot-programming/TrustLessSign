import React, { useState, useEffect, useRef } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import Draggable from 'react-draggable';
import { Document, Page, pdfjs } from 'react-pdf';
import { ShieldCheck, Upload, Save, Eye, Key, Loader2, CheckCircle2, AlertCircle, FileText, ExternalLink, HelpCircle } from 'lucide-react';
import LanguageSwitcher from '../Components/LanguageSwitcher';
import ThemeToggle from '../Components/ThemeToggle';
import QRious from '../Utils/qrious.min.js';
import axios from 'axios';
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
  const [qrPosition, setQrPosition] = useState({ x: 50, y: 50 });
  const containerRef = useRef(null);
  const nodeRef = useRef(null);

  // Form states
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [notes, setNotes] = useState('');
  const [password, setPassword] = useState('');

  // Status and result states
  const [extensionInstalled, setExtensionInstalled] = useState(false);
  const [signingStatus, setSigningStatus] = useState({
    isActive: false,
    stage: 'IDLE', // IDLE, DOWNLOADING, STAMPING, UPLOADING, SUCCESS, ERROR
    percentage: 0,
    message: ''
  });
  const [signResult, setSignResult] = useState(null);
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
    if (window.__TRUSTLESS_SIGN_EXTENSION_INSTALLED__ === true) {
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
        }
      })
      .catch(err => console.error("Failed to load reason categories:", err));
  }, []);

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
      const { token, gdrive_token } = credsRes.data;

      // Convert PDF to Base64
      const pdfBase64 = await fileToBase64(file);

      // Generate verification token client-side
      const verifyToken = crypto.randomUUID();
      const verifyUrl = `${window.location.origin}/verify/${verifyToken}`;

      // Generate visual QR code PNG using qrious
      const qr = new QRious({
        value: verifyUrl,
        size: 150,
        level: 'H'
      });
      const qrPngBase64 = qr.toDataURL('image/png');

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
          if (result && result.status === 'success') {
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
                verifyUrl: verifyUrl,
                pdfBase64: result.pdfBase64
              });
            }, 1500);

          } else {
            setErrorMsg(result?.message || "Failed to sign document.");
            setSigningStatus({ isActive: false, stage: 'ERROR', percentage: 0, message: '' });
          }
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

      window.postMessage({
        type: 'TRUSTLESS_SIGN_REQUEST',
        payload: {
          pdfBase64: pdfBase64,
          filename: file.name,
          gdriveToken: gdrive_token,
          apiToken: token,
          qrPosition: {
            page: pageNumber,
            x: qrPosition.x,
            y: qrPosition.y,
            size: 80
          },
          reason_sub_category_id: selectedSubCategoryId ? parseInt(selectedSubCategoryId) : null,
          reason_final: reason_final,
          notes: notes,
          password: password,
          qrPngBase64: qrPngBase64
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
    link.download = `signed_${file.name}`;
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

          {signResult ? (
            // SIGN SUCCESS SCREEN
            <div className="glass-panel p-8 max-w-xl mx-auto space-y-6 text-center animate-fade-in">
              <div className="w-20 h-20 bg-accent-success-soft text-accent-success rounded-full flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle2 size={48} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-text-primary">{t.success_title}</h2>
                <p className="text-sm text-text-secondary">{t.success_desc}</p>
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
                    disabled={!file || !extensionInstalled || !password}
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
                  <div className="relative border border-border-default shadow-md bg-white select-none" ref={containerRef}>
                    <Document 
                      file={file} 
                      onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                      className="max-w-full"
                    >
                      <Page pageNumber={pageNumber} width={600} />
                    </Document>

                    {/* Draggable QR Code Representation */}
                    <Draggable 
                      bounds="parent"
                      position={qrPosition}
                      onDrag={handleDrag}
                      onStop={handleDragStop}
                      nodeRef={nodeRef}
                    >
                      <div ref={nodeRef} className="absolute top-0 left-0 w-24 h-24 border-2 border-accent-primary bg-accent-primary-soft flex items-center justify-center cursor-move shadow-lg backdrop-blur-sm group rounded-md select-none z-55">
                        <div className="absolute -top-8 bg-surface-elevated text-xs px-2 py-1 rounded shadow-md border border-border-subtle opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          QR Position: x:{Math.round(qrPosition.x)}, y:{Math.round(qrPosition.y)}
                        </div>
                        <span className="text-accent-primary font-bold text-xs text-center pointer-events-none select-none">{t.qr_area}</span>
                      </div>
                    </Draggable>
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
