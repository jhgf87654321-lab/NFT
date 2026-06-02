import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View } from '../types';
import { ensureUserProfile } from '../lib/userProfile';
import HomeHeroPoster from '../assets/home-hero.png';
import LogoImg from '../assets/LOGO-02.png';

const COVER_VIDEO_SRC = '/cover.mp4';
const SEGMENT_COUNT = 4;
const SEGMENT_DURATION = 3;
const WHEEL_STEP_THRESHOLD = 48;
const WHEEL_COOLDOWN_MS = 420;

interface HomeProps {
  onEnter: () => void;
  onNavigate?: (view: View) => void;
}

function revealClass(visible: boolean) {
  return visible
    ? 'opacity-100 translate-y-0 scale-100 max-h-96 pointer-events-auto mb-3'
    : 'opacity-0 translate-y-6 scale-[0.98] max-h-0 pointer-events-none mb-0 overflow-hidden';
}

const Home: React.FC<HomeProps> = ({ onEnter, onNavigate }) => {
  const [activeFeature, setActiveFeature] = useState<number | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  /** 0 = 初始；1–4 = 四段视频，每段 3 秒，对应四次滚轮 */
  const [segment, setSegment] = useState(0);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [scrubReady, setScrubReady] = useState(false);
  const [bufferPct, setBufferPct] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const durationRef = useRef(0);
  const segmentRef = useRef(0);
  const wheelAccumRef = useRef(0);
  const wheelLockedRef = useRef(false);
  const segmentStopRef = useRef<number | null>(null);

  const clearSegmentStop = useCallback(() => {
    if (segmentStopRef.current !== null) {
      window.clearTimeout(segmentStopRef.current);
      segmentStopRef.current = null;
    }
  }, []);

  const playSegment = useCallback(
    (seg: number) => {
      segmentRef.current = seg;
      setSegment(seg);

      const video = videoRef.current;
      clearSegmentStop();

      if (!video) return;

      if (seg <= 0) {
        video.pause();
        try {
          video.currentTime = 0;
        } catch {
          // ignore
        }
        return;
      }

      const start = (seg - 1) * SEGMENT_DURATION;
      const duration = durationRef.current;
      const end = duration > 0 ? Math.min(start + SEGMENT_DURATION, duration) : start + SEGMENT_DURATION;

      const beginPlay = () => {
        try {
          video.currentTime = start;
        } catch {
          // ignore
        }
        const playPromise = video.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => {
            video.pause();
          });
        }

        segmentStopRef.current = window.setTimeout(() => {
          video.pause();
          try {
            video.currentTime = end;
          } catch {
            // ignore
          }
        }, SEGMENT_DURATION * 1000);
      };

      if (video.readyState >= 2) {
        beginPlay();
      } else {
        video.addEventListener('canplay', beginPlay, { once: true });
      }
    },
    [clearSegmentStop],
  );

  const stepSegment = useCallback(
    (direction: 1 | -1) => {
      const next = Math.min(SEGMENT_COUNT, Math.max(0, segmentRef.current + direction));
      if (next === segmentRef.current) return;
      playSegment(next);
    },
    [playSegment],
  );

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setVideoSrc(COVER_VIDEO_SRC));
    return () => window.cancelAnimationFrame(id);
  }, []);

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
    if (!video || !videoSrc) return;

    const updateBuffer = () => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) return;
      if (video.buffered.length === 0) return;
      const end = video.buffered.end(video.buffered.length - 1);
      setBufferPct(Math.min(100, Math.round((end / video.duration) * 100)));
    };

    const onLoadedMetadata = () => {
      if (Number.isFinite(video.duration) && video.duration > 0) {
        durationRef.current = video.duration;
        video.currentTime = 0;
        setScrubReady(true);
      }
      updateBuffer();
    };

    const onCanPlay = () => {
      setScrubReady(true);
      updateBuffer();
    };

    const onError = () => setScrubReady(true);

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('progress', updateBuffer);
    video.addEventListener('error', onError);

    if (video.readyState >= 1) onLoadedMetadata();
    if (video.readyState >= 3) onCanPlay();

    const fallback = window.setTimeout(() => setScrubReady(true), 4000);

    return () => {
      window.clearTimeout(fallback);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('progress', updateBuffer);
      video.removeEventListener('error', onError);
    };
  }, [videoSrc]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (wheelLockedRef.current) return;

      wheelAccumRef.current += e.deltaY;
      if (Math.abs(wheelAccumRef.current) < WHEEL_STEP_THRESHOLD) return;

      const direction: 1 | -1 = wheelAccumRef.current > 0 ? 1 : -1;
      wheelAccumRef.current = 0;
      wheelLockedRef.current = true;
      window.setTimeout(() => {
        wheelLockedRef.current = false;
      }, WHEEL_COOLDOWN_MS);

      stepSegment(direction);
    };

    el.addEventListener('wheel', onWheel, { passive: false, capture: true });
    return () => {
      el.removeEventListener('wheel', onWheel, { capture: true });
    };
  }, [stepSegment]);

  useEffect(() => clearSegmentStop, [clearSegmentStop]);

  const features = [
    {
      title: '模特捏脸',
      desc: 'Parameterized Facial Synthesizer',
      stats: 'LIVE SYNC',
      view: View.CREATOR,
    },
    {
      title: '形象生成器',
      desc: 'Biometric Identity Wardrobe Node',
      stats: 'SYS.ACTIVE',
      view: View.MODEL_FACE_GEN,
    },
    {
      title: '虚拟试穿',
      desc: 'AI Specimen Fit Accuracy',
      stats: 'SYS.ONLINE',
      view: View.TRY_ON,
    },
    {
      title: '数字衣橱',
      desc: 'Secured Digital Wardrobe System',
      stats: 'ARCHIVE',
      view: View.WARDROBE,
    },
  ];

  const progressPct = (segment / SEGMENT_COUNT) * 100;
  const revealedFeatures =
    segment <= 1 ? 0 : segment >= SEGMENT_COUNT ? 4 : segment - 1;
  const showBufferHint = videoSrc && !scrubReady && bufferPct < 100;

  const isFeatureVisible = (index: number) => {
    if (index < 3) return segment >= index + 2;
    return segment >= SEGMENT_COUNT;
  };

  return (
    <div ref={rootRef} className="absolute inset-0 overflow-hidden bg-black text-white font-sans">
      <div className="absolute inset-0 z-0">
        <img
          src={HomeHeroPoster}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover object-[center_35%]"
        />
        <video
          ref={videoRef}
          id="garment-video"
          src={videoSrc ?? undefined}
          poster={HomeHeroPoster}
          muted
          playsInline
          preload="metadata"
          disablePictureInPicture
          className="absolute inset-0 w-full h-full object-cover object-[center_35%]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/10 to-black/80 pointer-events-none"></div>
      </div>

      <div className="relative z-10 h-full flex flex-col pointer-events-none">
        <header className="shrink-0 flex justify-between items-start px-6 md:px-10 pt-6 md:pt-8 pb-4 pointer-events-auto">
          <div className="flex items-center">
            <img src={LogoImg} alt="LOKADA" className="h-14 sm:h-16 md:h-[4.5rem] w-auto object-contain" />
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
          <span className="text-[10px] font-mono font-black tracking-widest text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            {String(revealedFeatures).padStart(2, '0')} // 04
          </span>
          <div className="w-20 h-0.5 bg-white/40 relative overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-[#5F3D94] transition-[width] duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-[8px] font-black tracking-widest uppercase text-white/90 drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.9)] font-space">
            SEG {segment || 0} / {SEGMENT_COUNT}
          </span>
        </div>

        <div className="flex-1 min-h-0 flex flex-col items-center justify-center pointer-events-none gap-3">
          {segment === 0 && (
            <span className="text-[8px] font-black uppercase tracking-[0.35em] text-white/45 select-none animate-pulse text-center leading-relaxed">
              滚动滚轮
              <br />
              共 {SEGMENT_COUNT} 段 · 每段 {SEGMENT_DURATION}s
            </span>
          )}
          {showBufferHint && (
            <span className="text-[7px] font-black uppercase tracking-[0.25em] text-white/35">
              {bufferPct > 0 ? `视频缓冲 ${bufferPct}%` : '视频加载中…'}
            </span>
          )}
        </div>

        <div className="shrink-0 px-6 md:px-10 pb-6 md:pb-8 flex flex-col items-stretch pointer-events-none">
          <div className={`transform transition-all duration-500 ease-out ${revealClass(segment >= 1)}`}>
            <button
              type="button"
              onClick={onEnter}
              className="pointer-events-auto group relative w-full bg-primary/90 backdrop-blur-md text-white hover:bg-[#5F3D94] py-5 rounded-full border border-white/20 flex items-center justify-between px-8 overflow-hidden active:scale-98 transition-all shadow-lg"
            >
              <span className="font-black uppercase tracking-[0.25em] text-[10px]">进入社区动态</span>
              <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                <span className="material-icons-round text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </div>
            </button>
          </div>

          {features.map((f, i) => {
            const visible = isFeatureVisible(i);
            return (
              <div
                key={f.title}
                className={`transform transition-all duration-500 ease-out ${revealClass(visible)}`}
                style={{ transitionDelay: visible ? `${i * 60}ms` : '0ms' }}
              >
                <div
                  onClick={() => onNavigate?.(f.view)}
                  onMouseEnter={() => setActiveFeature(i)}
                  onMouseLeave={() => setActiveFeature(null)}
                  role="button"
                  tabIndex={visible ? 0 : -1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') onNavigate?.(f.view);
                  }}
                  className={`pointer-events-auto group flex items-center justify-between py-4 px-4 rounded-2xl border backdrop-blur-md transition-colors duration-200 cursor-pointer ${
                    activeFeature === i
                      ? 'bg-primary border-white/30 text-white'
                      : 'bg-black/40 border-white/10 text-white hover:bg-black/55'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`font-mono text-base font-black ${activeFeature === i ? 'text-white' : 'text-white/35'}`}>
                      0{i + 1}
                    </span>
                    <div>
                      <h4 className="font-black uppercase tracking-tight text-sm">{f.title}</h4>
                      <p className={`text-[8px] font-bold uppercase tracking-wider ${activeFeature === i ? 'text-white/60' : 'text-white/45'}`}>
                        {f.desc}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[7px] font-black uppercase tracking-widest px-2 py-0.5 border ${
                        activeFeature === i ? 'border-white/40 text-white' : 'border-white/15 text-white/70 bg-white/10'
                      }`}
                    >
                      {f.stats}
                    </span>
                    <span className="material-icons-round text-sm transition-transform group-hover:translate-x-1.5">east</span>
                  </div>
                </div>
              </div>
            );
          })}

          <div className={`transform transition-all duration-500 ease-out ${revealClass(segment >= SEGMENT_COUNT)}`}>
            <footer className="pt-1 flex justify-between items-center text-white/40 pointer-events-none">
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
    </div>
  );
};

export default Home;
