import React, { useState, useEffect } from 'react';
import { Head, usePage, Link } from '@inertiajs/react';
import LanguageSwitcher from '../Components/LanguageSwitcher';
import ThemeToggle from '../Components/ThemeToggle';
import { ShieldCheck, ArrowRight, X } from 'lucide-react';

export default function Welcome({ autoOpenLogin = false }) {
  const { auth, messages } = usePage().props;
  const t = messages?.Welcome || {};
  const user = auth?.user;

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(autoOpenLogin);

  useEffect(() => {
    if (autoOpenLogin) {
      setIsLoginModalOpen(true);
    }
  }, [autoOpenLogin]);

  return (
    <>
      <Head title="Welcome to TrustlessSign" />
      <div className="min-h-screen flex flex-col text-text-primary">
        
        <header className="flex justify-between items-center p-6 bg-surface-glass sticky top-0 z-50 border-b border-border-subtle backdrop-blur-md">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-accent-primary" size={28} />
            <span className="font-bold text-xl tracking-tight">TrustlessSign</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
            {user ? (
              <Link href="/dashboard" className="text-sm font-semibold hover:text-accent-primary transition-colors focus:outline-none focus:ring-2 focus:ring-accent-primary rounded px-2 py-1">
                {t.dashboard || "Dashboard"}
              </Link>
            ) : (
              <button 
                onClick={() => setIsLoginModalOpen(true)} 
                className="text-sm font-semibold text-text-secondary hover:text-accent-primary transition-colors focus:outline-none focus:ring-2 focus:ring-accent-primary rounded px-2 py-1"
                id="header-login-btn"
              >
                {t.login || "Login"}
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="glass-panel p-10 max-w-2xl w-full flex flex-col items-center gap-6 border border-border-subtle rounded-xl shadow-glass bg-surface-secondary">
            <div className="badge-premium mb-2 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-accent-primary-soft text-accent-primary border border-accent-primary/20">
              <span className="pulsing-dot w-2 h-2 rounded-full bg-accent-primary animate-pulse"></span>
              {t.badge || "Secure & Decentralized"}
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              {t.title || "Zero-Trust Digital Signatures"}
            </h1>
            
            <p className="text-lg text-text-secondary max-w-lg leading-relaxed">
              {t.desc || "Sign documents offline via Chrome Extension. Verify instantly with cryptographic certainty. No central authority required."}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mt-6">
              {user ? (
                <Link href="/dashboard" className="flex items-center justify-center gap-2 bg-accent-primary hover:bg-accent-hover text-white px-8 py-3 rounded-full font-semibold transition-all duration-normal shadow-md hover:shadow-lg w-full sm:w-auto focus:ring-2 focus:ring-accent-primary focus:outline-none">
                  {t.dashboard || "Dashboard"} <ArrowRight size={18} />
                </Link>
              ) : (
                <button 
                  onClick={() => setIsLoginModalOpen(true)} 
                  className="flex items-center justify-center gap-2 bg-accent-primary hover:bg-accent-hover text-white px-8 py-3 rounded-full font-semibold transition-all duration-normal shadow-md hover:shadow-lg w-full sm:w-auto focus:ring-2 focus:ring-accent-primary focus:outline-none"
                  id="get-started-btn"
                >
                  {t.get_started || "Get Started"} <ArrowRight size={18} />
                </button>
              )}
            </div>
            
            <div className="mt-8 pt-8 border-t border-border-subtle w-full">
              <p className="text-sm text-text-tertiary mb-4">{t.auth_providers || "Supported authentication providers:"}</p>
              <div className="flex justify-center gap-3 flex-wrap">
                <a href="/auth/google/redirect" className="flex items-center gap-2 bg-surface-elevated border border-border-default px-6 py-2 rounded-full text-sm font-semibold hover:border-accent-primary transition-colors focus:ring-2 focus:ring-accent-primary focus:outline-none">
                  <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.58c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Google
                </a>
                <a href="/auth/facebook/redirect" className="hidden items-center gap-2 bg-[#1877F2] text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-[#166FE5] transition-colors focus:ring-2 focus:ring-accent-primary focus:outline-none">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  Facebook
                </a>
                <a href="/auth/line/redirect" className="hidden items-center gap-2 bg-[#06C755] text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-[#05b34c] transition-colors focus:ring-2 focus:ring-accent-primary focus:outline-none">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 3.9 8.924 9.179 9.605.358.077.854.237.979.553.113.284.073.729.034 1.034l-.208 1.258c-.065.395-.316 1.545 1.354.843 1.67-0.702 9.02-5.313 11.517-8.625 0.768-1.018 1.145-2.28 1.145-4.668zm-15.021 3.109h-3.414c-.287 0-.521-.234-.521-.521V6.84c0-.287.234-.521.521-.521h3.414c.287 0 .521.234.521.521s-.234.521-.521.521H6.084v1.545h2.895c.287 0 .521.234.521.521s-.234.521-.521.521H6.084v1.545h2.895c.287 0 .521.234.521.521 0 .287-.234.521-.521.521zm4.842 0h-.888c-.287 0-.521-.234-.521-.521V6.84c0-.287.234-.521.521-.521s.521.234.521.521v5.526c0 .287-.234.521-.521.521zm4.786-5.526v3.468l-2.457-3.327c-.064-.085-.145-.149-.24-.185-.095-.035-.198-.044-.298-.023-.1.021-.19.073-.261.144-.071.071-.122.161-.144.261-.021.1-.012.203.023.298.036.095.1.176.185.24v3.987h-.888c-.287 0-.521-.234-.521-.521V6.84c0-.287.234-.521.521-.521s.521.234.521.521v3.468l2.457-3.327c.064-.085.145-.149.24-.185.095-.035.198-.044.298-.023.1.021.19.073.261.144.071.071.122.161.144.261.021.1.012.203-.023.298-.036-.095-.1-.176-.185-.24v3.987h.888c.287 0 .521.234.521.521 0 .287-.234.521-.521.521z"/></svg>
                  Line
                </a>
              </div>
            </div>
          </div>
        </main>

        <footer className="w-full py-6 text-center border-t border-border-subtle text-text-tertiary text-sm flex flex-col sm:flex-row justify-center items-center gap-4 mt-auto">
          <span>&copy; 2026 TrustlessSign. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-accent-primary transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-accent-primary transition-colors">Terms of Service</Link>
          </div>
        </footer>

        {/* Premium Login Modal Dialog */}
        {isLoginModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-normal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="bg-surface-secondary border border-border-default rounded-xl shadow-xl w-full max-w-md p-6 flex flex-col gap-6 relative">
              <button 
                onClick={() => setIsLoginModalOpen(false)}
                className="absolute right-4 top-4 text-text-secondary hover:text-text-primary focus:ring-2 focus:ring-accent-primary focus:outline-none rounded-full p-1 transition-colors"
                aria-label={t.close || "Close"}
              >
                <X size={20} />
              </button>
              
              <div className="flex flex-col items-center text-center gap-2 mt-2">
                <div className="p-3 bg-accent-primary-soft rounded-full text-accent-primary mb-2">
                  <ShieldCheck size={36} />
                </div>
                <h2 id="modal-title" className="text-2xl font-bold tracking-tight text-text-primary">
                  {t.modal_title || "Select Sign In Provider"}
                </h2>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {t.modal_desc || "Authentication is required to sign documents and save them."}
                </p>
              </div>

              <div className="flex flex-col gap-3 mt-2">
                <a 
                  href="/auth/google/redirect" 
                  className="flex items-center justify-center gap-3 bg-surface-elevated border border-border-default hover:border-accent-primary text-text-primary font-semibold py-3 px-4 rounded-lg transition-all focus:ring-2 focus:ring-accent-primary focus:outline-none"
                  id="modal-google-auth"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.58c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Google
                </a>
                <a 
                  href="/auth/facebook/redirect" 
                  className="hidden items-center justify-center gap-3 bg-[#1877F2] hover:bg-[#166FE5] text-white font-semibold py-3 px-4 rounded-lg transition-all focus:ring-2 focus:ring-accent-primary focus:outline-none"
                  id="modal-facebook-auth"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  Facebook
                </a>
                <a 
                  href="/auth/line/redirect" 
                  className="hidden items-center justify-center gap-3 bg-[#06C755] hover:bg-[#05b34c] text-white font-semibold py-3 px-4 rounded-lg transition-all focus:ring-2 focus:ring-accent-primary focus:outline-none"
                  id="modal-line-auth"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 3.9 8.924 9.179 9.605.358.077.854.237.979.553.113.284.073.729.034 1.034l-.208 1.258c-.065.395-.316 1.545 1.354.843 1.67-0.702 9.02-5.313 11.517-8.625 0.768-1.018 1.145-2.28 1.145-4.668zm-15.021 3.109h-3.414c-.287 0-.521-.234-.521-.521V6.84c0-.287.234-.521.521-.521h3.414c.287 0 .521.234.521.521s-.234.521-.521.521H6.084v1.545h2.895c.287 0 .521.234.521.521s-.234.521-.521.521H6.084v1.545h2.895c.287 0 .521.234.521.521 0 .287-.234.521-.521.521zm4.842 0h-.888c-.287 0-.521-.234-.521-.521V6.84c0-.287.234-.521.521-.521s.521.234.521.521v5.526c0 .287-.234.521-.521.521zm4.786-5.526v3.468l-2.457-3.327c-.064-.085-.145-.149-.24-.185-.095-.035-.198-.044-.298-.023-.1.021-.19.073-.261.144-.071.071-.122.161-.144.261-.021.1-.012.203.023.298.036.095.1.176.185.24v3.987h-.888c-.287 0-.521-.234-.521-.521V6.84c0-.287.234-.521.521-.521s.521.234.521.521v3.468l2.457-3.327c.064-.085.145-.149.24-.185.095-.035.198-.044.298-.023.1.021.19.073.261.144.071.071.122.161.144.261.021.1.012.203-.023.298-.036-.095-.1-.176-.185-.24v3.987h.888c.287 0 .521.234.521.521 0 .287-.234.521-.521.521z"/></svg>
                  Line
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
