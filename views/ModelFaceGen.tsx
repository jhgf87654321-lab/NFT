import React, { Suspense, useEffect, useState } from 'react';
import BlackLogoImg from '../assets/BLACK-LOGO-02.png';
import { View } from '../types';
import { ensureUserProfile } from '../lib/userProfile';

const ModelStudioApp = React.lazy(() =>
  import('../MDRS-main/src/ModelStudioApp').then((m) => ({ default: m.ModelStudioApp })),
);

type ModelFaceGenProps = {
  onNavigate?: (view: View) => void;
};

const ModelFaceGen: React.FC<ModelFaceGenProps> = ({ onNavigate }) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    ensureUserProfile()
      .then((doc) => {
        if (!mounted) return;
        const url = doc?.avatarUrl ? String(doc.avatarUrl).trim() : '';
        setAvatarUrl(url || null);
      })
      .catch(() => {
        if (mounted) setAvatarUrl(null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-[#FAF9F6] text-black selection:bg-primary selection:text-white">
      <div className="fixed inset-0 pointer-events-none -z-20 overflow-hidden">
        <div className="absolute top-[10%] right-[20%] w-[50%] h-[50%] bg-[#5F3D94]/5 blur-[150px] rounded-full" />
      </div>

      <header className="relative z-50 px-8 lg:px-16 pt-10 flex justify-between items-center mb-10 select-none">
        <div className="flex items-center gap-6 font-sans">
          <img src={BlackLogoImg} alt="LOKADA" className="h-12 sm:h-14 w-auto object-contain shrink-0" />
          <h1 className="font-future font-black text-2xl leading-none text-black tracking-widest uppercase font-display">
            模特捏脸
          </h1>
          <div className="h-6 w-px bg-primary/15 hidden md:block" />
          <p className="text-[9px] tracking-[0.3em] uppercase text-black/45 font-bold leading-none hidden md:block font-sans">
            PARAMETRIC FACE SYNTHESIZER
          </p>
        </div>

        <div className="flex items-center gap-6">
          <span className="text-[9px] font-mono text-black/45 tracking-widest hidden lg:block uppercase">
            [ MODEL CARD ENGINE ]
          </span>
          <button
            type="button"
            onClick={() => onNavigate?.(View.AUTH)}
            className="group flex items-center gap-3 bg-white hover:bg-neutral-100 border border-primary/10 rounded-full pl-5 pr-2 py-1.5 transition-all text-[9.5px] uppercase tracking-widest font-black active:scale-95 shadow-sm text-black"
          >
            <span>Network Node</span>
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-primary/10 group-hover:border-primary/50 transition-colors">
              <img
                src={avatarUrl || 'https://picsum.photos/100/100?seed=axon_face'}
                alt="User"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-primary border border-white animate-pulse" />
            </div>
          </button>
        </div>
      </header>

      <main className="w-full max-w-7xl mx-auto px-4 lg:px-8 relative z-10 mb-28">
        <div className="bg-white border border-neutral-300 rounded-none overflow-visible shadow-none">
          <Suspense
            fallback={
              <div className="flex min-h-[420px] items-center justify-center bg-[#FAF9F6] text-[10px] font-bold uppercase tracking-widest text-black/40">
                加载模特工作室…
              </div>
            }
          >
            <ModelStudioApp embed axonShell onNavigateAuth={() => onNavigate?.(View.AUTH)} />
          </Suspense>
        </div>
      </main>
    </div>
  );
};

export default ModelFaceGen;
