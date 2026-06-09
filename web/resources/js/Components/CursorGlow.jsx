import React, { useEffect, useRef } from 'react';

export default function CursorGlow() {
  const glowRef = useRef(null);

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;

    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let cx = tx;
    let cy = ty;
    let animationFrameId;

    const onMouseMove = (e) => {
      tx = e.clientX;
      ty = e.clientY;
    };

    const render = () => {
      cx += (tx - cx) * 0.1;
      cy += (ty - cy) * 0.1;
      if (glowRef.current) {
        glowRef.current.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%)`;
      }
      animationFrameId = requestAnimationFrame(render);
    };

    document.addEventListener('mousemove', onMouseMove);
    animationFrameId = requestAnimationFrame(render);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div 
      ref={glowRef}
      className="fixed top-0 left-0 w-[600px] h-[600px] rounded-full pointer-events-none z-0 opacity-0 transition-opacity duration-500 will-change-transform"
      style={{
        background: 'radial-gradient(circle, var(--cursor-glow) 0%, transparent 70%)',
      }}
      id="cursor-glow"
    />
  );
}
