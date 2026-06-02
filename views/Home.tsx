import React, { useEffect, useRef, useState } from 'react';
import { View } from '../types';
import { ensureUserProfile } from '../lib/userProfile';
import coverVideo from '../assets/封面.mp4';

interface HomeProps {
  onEnter: () => void;
  onNavigate?: (view: View) => void;
}

const Home: React.FC<HomeProps> = ({ onEnter, onNavigate }) => {
  const [activeFeature, setActiveFeature] = useState<number | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [motionPct, setMotionPct] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const motionPctRef = useRef(0);

  const seekToPct = (pct: number) => {
    const clamped = Math.min(100, Math.max(0, pct));
    motionPctRef.current = clamped;
    setMotionPct(clamped);
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;
    video.currentTime = (clamped / 100) * video.duration;
  };

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

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoadedMetadata = () => {
      seekToPct(0);
    };

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    if (video.readyState >= 1) onLoadedMetadata();

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
    };
  }, []);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const step = Math.min(2.5, Math.max(0.2, Math.abs(e.deltaY) * 0.006));
      seekToPct(motionPctRef.current + (e.deltaY > 0 ? step : -step));
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const features = [
    {
      title: '模特捏脸',
      desc: 'Parameterized Facial Synthesizer',
      icon: 'face',
      stats: 'LIVE SYNC',
      view: View.CREATOR,
    },
    {
      title: '形象生成器',
      desc: 'Biometric Identity Wardrobe Node',
      icon: 'biotech',
      stats: 'SYS.ACTIVE',
      view: View.MODEL_FACE_GEN,
    },
    {
      title: '虚拟试穿',
      desc: 'AI Specimen Fit Accuracy',
      icon: 'view_in_ar',
      stats: 'SYS.ONLINE',
      view: View.TRY_ON,
    },
    {
      title: '数字衣橱',
      desc: 'Secured Digital Wardrobe System',
      icon: 'grid_view',
      stats: 'ARCHIVE',
      view: View.WARDROBE,
    },
  ];

  return (
    <div className="relative h-full w-full overflow-hidden bg-black text-white font-sans">
      <div ref={heroRef} className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          id="garment-video"
          src={coverVideo}
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover object-[center_35%]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/75 pointer-events-none"></div>
      </div>

      <div className="relative z-10 h-full flex flex-col pointer-events-none">
        <header className="shrink-0 flex justify-between items-start px-6 md:px-10 pt-6 md:pt-8 pb-4 pointer-events-auto">
          <div className="flex flex-col items-start gap-0.5">
            <span className="text-white/60 text-[8px] font-black uppercase tracking-[0.5em] block">SPECULATIVE MATRIX</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black uppercase tracking-tight text-white">AXON FUTURE_</span>
              <span className="bg-primary text-white text-[6.5px] font-black uppercase px-2 py-0.5 rounded tracking-widest">PRO.NODE</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate?.(View.AUTH)}
            className="w-11 h-11 rounded-full overflow-hidden border border-white/20 hover:border-white hover:scale-105 active:scale-95 transition-all shadow-sm"
          >
            <img
              src={avatarUrl || 'https://picsum.photos/100/100?seed=axon_prime'}
              alt="Identity Avatar"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </button>
        </header>

        <div className="absolute top-6 right-6 md:right-10 z-20 flex flex-col items-end gap-1 pointer-events-none">
          <span className="text-[10px] font-mono font-black tracking-widest text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">01 // 04</span>
          <div className="w-20 h-0.5 bg-white/40 relative overflow-hidden">
            <div className="absolute top-0 left-0 h-full bg-[#5F3D94] transition-[width] duration-75" style={{ width: `${motionPct}%` }}></div>
          </div>
          <span className="text-[8px] font-black tracking-widest uppercase text-white/90 drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.9)] font-space">EDITORIAL NODE</span>
        </div>

        <div className="flex-1 min-h-0 flex items-center justify-center pointer-events-none">
          <span className="text-[8px] font-black uppercase tracking-[0.35em] text-white/45 select-none">滚动滚轮浏览动态</span>
        </div>

        <div className="shrink-0 pointer-events-auto px-6 md:px-10 pb-6 md:pb-8 max-h-[46vh] flex flex-col gap-4">
          <button
            type="button"
            onClick={onEnter}
            className="group relative w-full bg-primary/90 backdrop-blur-md text-white hover:bg-[#5F3D94] p-5 rounded-full border border-white/20 flex items-center justify-between px-8 overflow-hidden active:scale-98 transition-all shadow-lg shrink-0"
          >
            <span className="font-black uppercase tracking-[0.25em] text-[10px]">进入社区动态</span>
            <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
              <span className="material-icons-round text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
          </button>

          <div className="flex flex-col gap-3 overflow-y-auto no-scrollbar min-h-0 rounded-2xl bg-black/35 backdrop-blur-md border border-white/10 p-4">
            <div className="flex justify-between items-end border-b border-white/15 pb-3 shrink-0">
              <div>
                <span className="bg-primary text-white text-[7px] font-black uppercase tracking-[0.4em] px-2.5 py-1 mb-1.5 inline-block">SPECULATIVE PIPELINE //</span>
                <h3 className="text-xl font-black uppercase tracking-tighter leading-none font-display text-white">CHANNELS</h3>
              </div>
              <span className="text-[9px] font-black font-mono text-white/40">02 // 04</span>
            </div>

            <div className="flex flex-col divide-y divide-white/10">
              {features.map((f, i) => (
                <div
                  key={f.title}
                  onClick={() => onNavigate?.(f.view)}
                  onMouseEnter={() => setActiveFeature(i)}
                  onMouseLeave={() => setActiveFeature(null)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') onNavigate?.(f.view);
                  }}
                  className={`group flex items-center justify-between py-4 transition-all duration-200 cursor-pointer ${activeFeature === i ? 'bg-primary text-white px-3 border-l-4 border-white/40 rounded-lg' : 'bg-transparent hover:px-2 text-white'}`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`font-mono text-base font-black ${activeFeature === i ? 'text-white' : 'text-white/35'}`}>
                      0{i + 1}
                    </span>
                    <div>
                      <h4 className="font-black uppercase tracking-tight text-sm">{f.title}</h4>
                      <p className={`text-[8px] font-bold uppercase tracking-wider ${activeFeature === i ? 'text-white/60' : 'text-white/45'}`}>{f.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[7px] font-black uppercase tracking-widest px-2 py-0.5 border ${activeFeature === i ? 'border-white/40 text-white' : 'border-white/15 text-white/70 bg-white/10'}`}>
                      {f.stats}
                    </span>
                    <span className="material-icons-round text-sm transition-transform group-hover:translate-x-1.5">east</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <footer className="shrink-0 pt-2 flex justify-between items-center text-white/40">
            <span className="text-[8px] font-mono font-bold tracking-widest uppercase">Protocol V.2.1-AXON</span>
            <div className="flex gap-2">
              <span className="w-1.5 h-1.5 bg-white/20 rounded-full"></span>
              <span className="w-1.5 h-1.5 bg-white/20 rounded-full"></span>
              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Home;
