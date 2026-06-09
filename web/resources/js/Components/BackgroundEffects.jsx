import React, { useEffect, useRef } from 'react';

export default function BackgroundEffects() {
  const particleFieldRef = useRef(null);

  useEffect(() => {
    const particleField = particleFieldRef.current;
    if (!particleField) return;

    particleField.innerHTML = '';

    const getParticleColor = () => {
      const isDark = document.documentElement.classList.contains('dark') || document.documentElement.getAttribute('data-theme') === 'dark';
      const colors = isDark 
        ? ['rgba(34, 201, 151, 0.4)', 'rgba(139, 92, 246, 0.3)', 'rgba(212, 168, 67, 0.3)', 'rgba(255, 255, 255, 0.2)']
        : ['rgba(34, 201, 151, 0.6)', 'rgba(139, 92, 246, 0.5)', 'rgba(212, 168, 67, 0.5)', 'rgba(0, 0, 0, 0.2)'];
      return colors[Math.floor(Math.random() * colors.length)];
    };

    const particleCount = window.innerWidth < 768 ? 20 : 40;
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'absolute rounded-full pointer-events-none opacity-40';
      
      const size = Math.random() * 4 + 1;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      particle.style.background = getParticleColor();
      
      const floatDuration = Math.random() * 20 + 15;
      particle.style.animation = `particleFloat ${floatDuration}s linear infinite`;
      
      particleField.appendChild(particle);
    }
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(var(--grid-line)_1px,transparent_1px),linear-gradient(90deg,var(--grid-line)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_50%_50%,black_20%,transparent_70%)] opacity-30 dark:opacity-20" />
      
      {/* Orbs */}
      <div className="absolute rounded-full blur-[100px] opacity-40 dark:opacity-30 w-[600px] h-[600px] -top-[200px] -right-[100px] animate-[orbFloat_20s_ease-in-out_infinite] bg-[radial-gradient(circle,rgba(34,201,151,0.3),transparent_70%)]" />
      <div className="absolute rounded-full blur-[100px] opacity-40 dark:opacity-30 w-[400px] h-[400px] -bottom-[100px] -left-[50px] animate-[orbFloat_25s_ease-in-out_infinite_reverse] bg-[radial-gradient(circle,rgba(139,92,246,0.25),transparent_70%)]" />
      <div className="absolute rounded-full blur-[100px] opacity-40 dark:opacity-30 w-[300px] h-[300px] top-[40%] left-[50%] animate-[orbFloat_18s_ease-in-out_infinite_5s] bg-[radial-gradient(circle,rgba(212,168,67,0.2),transparent_70%)]" />
      <div className="absolute rounded-full blur-[100px] opacity-40 dark:opacity-30 w-[500px] h-[500px] -top-[150px] left-[20%] animate-[orbFloat_22s_ease-in-out_infinite] bg-[radial-gradient(circle,rgba(34,201,151,0.2),transparent_70%)]" />
      <div className="absolute rounded-full blur-[100px] opacity-40 dark:opacity-30 w-[350px] h-[350px] -bottom-[50px] right-[10%] animate-[orbFloat_26s_ease-in-out_infinite_reverse] bg-[radial-gradient(circle,rgba(139,92,246,0.2),transparent_70%)]" />

      {/* Particle Field */}
      <div ref={particleFieldRef} className="absolute inset-0" />
    </div>
  );
}
