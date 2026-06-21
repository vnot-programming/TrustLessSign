import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import ThemeToggle from '../Components/ThemeToggle';

export default function Terms() {
  return (
    <>
      <Head title="Terms of Service - TrustlessSign" />
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
            <h1 className="text-3xl md:text-4xl font-bold mb-6">Terms of Service</h1>
            <p className="text-text-secondary mb-8 border-b border-border-subtle pb-4">Last updated: June 20, 2026</p>

            <div className="flex flex-col gap-8 text-text-primary leading-relaxed">
              <section>
                <h2 className="text-2xl font-bold mb-4 text-accent-primary">1. Acceptance of Terms</h2>
                <p>By installing and using the TrustlessSign extension, you agree to these Terms of Service. If you do not agree with any part of these terms, please uninstall the extension immediately.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 text-accent-primary">2. Service Description</h2>
                <p>TrustlessSign provides cryptographic digital signatures for PDF files locally within your browser. The cryptographic keys are bound to your local environment and device.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 text-accent-primary">3. User Responsibilities</h2>
                <p>You are solely responsible for keeping your Master Password secure. TrustlessSign operates on a zero-knowledge architecture, meaning we cannot recover your keys or signatures if you lose your Master Password. You are responsible for any actions taken using your cryptographic signature.</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4 text-accent-primary">4. Limitation of Liability</h2>
                <p>TrustlessSign is provided "as is" without any warranties. We are not liable for any lost data, lost documents, or damages resulting from the use or inability to use this service.</p>
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
