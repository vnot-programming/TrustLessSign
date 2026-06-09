import React, { useState, useRef, useEffect } from 'react';
import { usePage, router } from '@inertiajs/react';
import { Globe } from 'lucide-react';
import { languages } from '../i18n-config';

export default function LanguageSwitcher() {
  const { locale } = usePage().props;
  const currentLocale = locale || 'en';
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (code) => {
    window.location.search = `?locale=${code}`;
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors border focus:outline-none focus:ring-2 focus:ring-accent-primary ${isOpen ? 'bg-surface-elevated text-text-primary border-border-default' : 'bg-surface-tertiary text-text-secondary border-transparent hover:text-text-primary hover:bg-surface-elevated'}`}
        aria-label="Select Language"
      >
        <Globe size={18} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-surface-elevated border border-border-default rounded-xl shadow-lg py-2 z-50 overflow-hidden">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full text-left px-5 py-3 text-sm font-semibold transition-colors hover:bg-surface-tertiary ${
                currentLocale === lang.code 
                  ? 'text-accent-primary' 
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {lang.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
