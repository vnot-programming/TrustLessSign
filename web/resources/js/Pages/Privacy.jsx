import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import ThemeToggle from '../Components/ThemeToggle';

export default function Privacy() {
  return (
    <>
      <Head title="Privacy Policy - TrustlessSign" />
      <div className="min-h-screen flex flex-col text-text-primary bg-surface-primary">
        <header className="flex justify-between items-center p-6 bg-surface-glass sticky top-0 z-50 border-b border-border-subtle backdrop-blur-md">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-accent-primary" size={28} />
            <Link href="/" className="font-bold text-xl tracking-tight">TrustlessSign</Link>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-accent-primary transition-colors">
              <ArrowLeft size={16} /> Back
            </Link>
          </div>
        </header>

        <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-12">
          <div className="glass-panel p-8 md:p-12 rounded-2xl border border-border-subtle bg-surface-secondary shadow-glass">
            <h1 className="text-3xl md:text-4xl font-bold mb-6">Privacy Policy</h1>
            <p className="text-text-secondary mb-8 border-b border-border-subtle pb-4">Last updated: June 20, 2026</p>
            
            <div className="flex flex-col gap-8 text-text-primary leading-relaxed">
              <section>
                <h2 className="text-2xl font-bold mb-4 text-accent-primary">1. Information Collection</h2>
                <p>TrustlessSign operates on a zero-trust model. We do not store your private keys or cryptographic material on our servers. Your keys are generated and stored entirely locally within your browser extension.</p>
              </section>
              
              <section>
                <h2 className="text-2xl font-bold mb-4 text-accent-primary">2. Google Drive Integration</h2>
                <p>The TrustlessSign extension requests access to your Google Drive to read PDF files and save digitally signed documents back to your Drive. We do not read, access, or modify any files other than those you explicitly choose to sign.</p>
              </section>
              
              <section>
                <h2 className="text-2xl font-bold mb-4 text-accent-primary">3. Document Privacy</h2>
                <p>The PDF documents you sign are processed locally inside the extension. The document content itself is never transmitted to our backend servers. Only cryptographic hashes are used for verification purposes.</p>
              </section>
              
              <section>
                <h2 className="text-2xl font-bold mb-4 text-accent-primary">4. Usage Data</h2>
                <p>We may collect anonymous analytics data regarding extension usage to help improve the product. No personally identifiable information or document contents are collected.</p>
              </section>
            </div>
          </div>
        </main>
        
        <footer className="py-8 text-center text-text-tertiary border-t border-border-subtle mt-auto">
          <p>&copy; 2026 TrustlessSign. All rights reserved.</p>
        </footer>
      </div>
    </>
  );
}
