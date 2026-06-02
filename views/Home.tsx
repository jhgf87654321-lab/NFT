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
      if (Number.isFinite(video.duration) && video.duration > 0) {
        video.currentTime = 0;
      }
    };

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    if (video.readyState >= 1) onLoadedMetadata();

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
    };
  }, []);

  const handleMotionSlider = (value: number) => {
    setMotionPct(value);
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;
    video.currentTime = (value / 100) * video.duration;
  };

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
    <div className="relative min-h-screen bg-white text-black overflow-x-hidden flex flex-col font-sans">
      <div className="absolute inset-0 grid-bg opacity-[0.03] pointer-events-none z-0"></div>

      <div className="flex-1 flex flex-col min-w-0 z-10 p-6 md:p-10 relative">
        <header className="flex justify-between items-start border-b border-primary/10 pb-6 mb-8 mt-4">
          <div className="flex flex-col items-start gap-0.5">
            <span className="text-black/50 text-[8px] font-black uppercase tracking-[0.5em] block">SPECULATIVE MATRIX</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black uppercase tracking-tight">AXON FUTURE_</span>
              <span className="bg-primary text-white text-[6.5px] font-black uppercase px-2 py-0.5 rounded tracking-widest">PRO.NODE</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate?.(View.AUTH)}
            className="w-11 h-11 rounded-full overflow-hidden border border-primary/10 hover:border-primary hover:scale-105 active:scale-95 transition-all shadow-sm"
          >
            <img
              src={avatarUrl || 'https://picsum.photos/100/100?seed=axon_prime'}
              alt="Identity Avatar"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </button>
        </header>

        <div className="relative w-full h-[min(36vh,320px)] sm:h-[min(40vh,360px)] border border-primary rounded-[2rem] overflow-hidden shadow-md group mb-10">
          <div
            onClick={onEnter}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onEnter();
            }}
            className="absolute inset-0 cursor-pointer"
          >
            <video
              ref={videoRef}
              id="garment-video"
              src={coverVideo}
              muted
              playsInline
              preload="auto"
              className="absolute inset-0 w-full h-full object-cover object-[center_35%] pointer-events-none group-hover:brightness-105 transition-[filter] duration-500"
            />
            <div className="absolute top-0 left-0 w-2 h-16 bg-[#5F3D94]"></div>
            <div className="absolute top-6 right-6 z-10 flex flex-col items-end gap-1 pointer-events-none">
              <span className="text-[10px] font-mono font-black tracking-widest text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">01 // 04</span>
              <div className="w-20 h-0.5 bg-white/40 relative overflow-hidden">
                <div className="absolute top-0 left-0 h-full bg-[#5F3D94] transition-[width] duration-75" style={{ width: `${motionPct}%` }}></div>
              </div>
              <span className="text-[8px] font-black tracking-widest uppercase text-white/90 drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.9)] font-space">EDITORIAL NODE</span>
            </div>
            <div className="absolute bottom-14 right-5 w-12 h-12 bg-[#5F3D94] rounded-full border border-primary flex items-center justify-center shadow-lg transform group-hover:scale-110 active:scale-95 transition-transform text-white pointer-events-none">
              <span className="material-icons-round text-white text-lg animate-pulse">north_east</span>
            </div>
          </div>

          <div
            className="absolute bottom-0 left-0 right-0 z-20 px-5 pb-4 pt-6 bg-gradient-to-t from-black/70 via-black/35 to-transparent"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="text-[7px] font-black uppercase tracking-widest text-white/70 shrink-0">MOTION</span>
              <input
                id="motion-slider"
                type="range"
                min={0}
                max={100}
                step={0.1}
                value={motionPct}
                onChange={(e) => handleMotionSlider(Number(e.target.value))}
                onInput={(e) => handleMotionSlider(Number((e.target as HTMLInputElement).value))}
                className="motion-slider w-full h-1 appearance-none rounded-full bg-white/25 accent-[#5F3D94] cursor-pointer"
                aria-label="视频进度滑动轴"
              />
              <span className="text-[7px] font-mono font-black text-white/80 shrink-0 w-8 text-right">{Math.round(motionPct)}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onEnter}
          className="group relative w-full bg-primary text-white hover:bg-[#5F3D94] hover:text-white hover:border-primary p-5 rounded-full border border-primary flex items-center justify-between px-8 overflow-hidden active:scale-98 transition-all mb-12 shadow-sm"
        >
          <span className="font-black uppercase tracking-[0.25em] text-[10px]">进入社区动态</span>
          <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
            <span className="material-icons-round text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </div>
        </button>

        <div className="flex flex-col gap-6 mb-28">
          <div className="flex justify-between items-end border-b border-primary/15 pb-4">
            <div>
              <span className="bg-primary text-white text-[7px] font-black uppercase tracking-[0.4em] px-2.5 py-1 mb-1.5 inline-block">SPECULATIVE PIPELINE //</span>
              <h3 className="text-2xl font-black uppercase tracking-tighter leading-none font-display">CHANNELS</h3>
            </div>
            <span className="text-[9px] font-black font-mono text-black/40">02 // 04</span>
          </div>

          <div className="flex flex-col divide-y divide-primary/15">
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
                className={`group flex items-center justify-between py-6 transition-all duration-200 cursor-pointer ${activeFeature === i ? 'bg-primary text-white px-4 border-l-4 border-white/40' : 'bg-transparent hover:px-2'}`}
              >
                <div className="flex items-center gap-6">
                  <span className={`font-mono text-lg font-black ${activeFeature === i ? 'text-white' : 'text-black/30'}`}>
                    0{i + 1}
                  </span>
                  <div>
                    <h4 className="font-black uppercase tracking-tight text-sm">{f.title}</h4>
                    <p className={`text-[8px] font-bold uppercase tracking-wider ${activeFeature === i ? 'text-white/60' : 'text-black/40'}`}>{f.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-[7px] font-black uppercase tracking-widest px-2.5 py-0.5 border ${activeFeature === i ? 'border-white/40 text-white' : 'border-primary/10 text-black/60 bg-white/45'}`}>
                    {f.stats}
                  </span>
                  <span className="material-icons-round text-sm transition-transform group-hover:translate-x-1.5">east</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <footer className="border-t border-primary/10 pt-10 pb-16 flex justify-between items-center text-black/50">
          <span className="text-[8px] font-mono font-bold tracking-widest uppercase">Protocol V.2.1-AXON</span>
          <div className="flex gap-2">
            <span className="w-1.5 h-1.5 bg-primary/10 rounded-full"></span>
            <span className="w-1.5 h-1.5 bg-primary/10 rounded-full"></span>
            <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Home;
