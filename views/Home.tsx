import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View } from '../types';
import { COVER_VIDEO_FALLBACK, COVER_VIDEO_SRC } from '../lib/coverVideo';
import HomeHeroPoster from '../assets/home-hero.png';
import LogoImg from '../assets/LOGO-02.png';

const SEGMENT_COUNT = 4;
const SEGMENT_DURATION = 3;
const WHEEL_STEP_THRESHOLD = 48;
const WHEEL_COOLDOWN_MS = 420;

const HERO_COPY: Record<number, { en: string; zh: string }> = {
  1: { en: 'Deconstruct Fashion.', zh: '解构时尚' },
  2: { en: 'Pixel-Perfect Craftsmanship.', zh: '像素级工艺' },
  3: { en: 'Pixel-Perfect Craftsmanship.', zh: '像素级工艺' },
};

interface HomeProps {
  onNavigate?: (view: View) => void;
}

function FloatingDataOverlay() {
  const nodes = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        x: 8 + ((i * 17) % 84),
        y: 12 + ((i * 23) % 76),
        label: `${(i * 47) % 360}°`,
        code: ['vec3 uv', 'σ: 0.84', 'tex_sample', 'bias +0.02', 'LOD: 2', 'normal.z'][i % 6],
        delay: (i % 5) * 0.35,
      })),
    [],
  );

  return (
    <div className="absolute inset-0 z-[3] pointer-events-none overflow-hidden" aria-hidden>
      <svg className="absolute inset-0 w-full h-full opacity-25" viewBox="0 0 100 100" preserveAspectRatio="none">
        <line x1="0" y1="72" x2="100" y2="72" stroke="rgba(255,255,255,0.35)" strokeWidth="0.08" strokeDasharray="1.2 1.8" />
        <line x1="18" y1="0" x2="18" y2="100" stroke="rgba(255,255,255,0.2)" strokeWidth="0.06" strokeDasharray="0.8 1.4" />
        <line x1="0" y1="38" x2="62" y2="38" stroke="rgba(255,255,255,0.15)" strokeWidth="0.05" />
      </svg>
      {nodes.map((n) => (
        <div
          key={n.id}
          className="absolute animate-pulse"
          style={{ left: `${n.x}%`, top: `${n.y}%`, animationDelay: `${n.delay}s`, animationDuration: '2.4s' }}
        >
          <span className="block w-1 h-1 rounded-full bg-white/80 shadow-[0_0_6px_rgba(255,255,255,0.9)]" />
          <span className="block mt-1 text-[6px] font-mono text-white/55 tracking-wider whitespace-nowrap">{n.label}</span>
        </div>
      ))}
      <div className="absolute left-[6%] bottom-[18%] font-mono text-[7px] text-white/40 leading-relaxed tracking-widest">
        <span className="block opacity-70">// mesh.topology</span>
        <span className="block opacity-50">for (tex in layers) {'{'}</span>
        <span className="block pl-2 opacity-40">decode(uv);</span>
      </div>
      <div className="absolute right-[8%] top-[22%] font-mono text-[6px] text-white/35 text-right leading-relaxed">
        <span className="block">X: 128.004</span>
        <span className="block">Y: 64.992</span>
        <span className="block">Z: 01.000</span>
      </div>
    </div>
  );
}

function MaterialScanOverlay({ active }: { active: boolean }) {
  const tags: {
    label: string;
    sub: string;
    w: string;
    top?: string;
    left?: string;
    bottom?: string;
    right?: string;
  }[] = [
    { label: 'Material: Lace Pattern', sub: 'Opacity 0.72', top: '17%', left: '38%', w: '30%' },
    { label: 'Texture: Denim', sub: 'Weave · 12oz', bottom: '18%', right: '7%', w: '28%' },
  ];

  return (
    <div className="absolute inset-0 z-[3] pointer-events-none overflow-hidden" aria-hidden>
      <div
        className={`absolute left-0 right-0 h-[2px] bg-white/70 shadow-[0_0_16px_rgba(255,255,255,0.55)] transition-opacity duration-500 ${active ? 'opacity-100 animate-scan' : 'opacity-0'}`}
        style={{ top: active ? undefined : '50%' }}
      />
      {tags.map((t) => (
        <div
          key={t.label}
          className={`absolute transition-all duration-700 ${active ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
          style={{ top: t.top, left: t.left, bottom: t.bottom, right: t.right, width: t.w }}
        >
          <div className="relative border border-white/50 bg-[#0a1628]/55 backdrop-blur-sm px-2 py-1.5">
            <span className="absolute -top-px -left-px w-2 h-2 border-t border-l border-white/80" />
            <span className="absolute -top-px -right-px w-2 h-2 border-t border-r border-white/80" />
            <span className="absolute -bottom-px -left-px w-2 h-2 border-b border-l border-white/80" />
            <span className="absolute -bottom-px -right-px w-2 h-2 border-b border-r border-white/80" />
            <p className="text-[8px] font-mono font-bold uppercase tracking-wider text-white">{t.label}</p>
            <p className="text-[6px] font-mono text-white/55 mt-0.5">{t.sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function EyeFocusOverlay() {
  return (
    <div className="absolute inset-0 z-[3] pointer-events-none flex items-start justify-center pt-[28%] md:pt-[26%]" aria-hidden>
      <div className="relative w-16 h-16 md:w-20 md:h-20">
        <svg viewBox="0 0 80 80" className="w-full h-full animate-[spin_8s_linear_infinite]">
          <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
          <circle
            cx="40"
            cy="40"
            r="34"
            fill="none"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="1"
            strokeDasharray="8 20 4 20"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-[38%] rounded-full border border-white/60" />
        <div className="absolute inset-[46%] rounded-full bg-white/80 shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
      </div>
    </div>
  );
}

function HeroCopyBlock({ segment }: { segment: number }) {
  const copy = HERO_COPY[segment];
  if (!copy) return null;

  const parallaxY = -(segment - 1) * 14;

  return (
    <div
      className="absolute inset-x-0 top-[38%] md:top-[36%] z-[4] flex flex-col items-center text-center px-8 pointer-events-none transition-all duration-700 ease-out"
      style={{ transform: `translateY(${parallaxY}px)` }}
    >
      <p className="text-xl sm:text-2xl md:text-3xl font-display font-black uppercase tracking-[0.18em] text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.85)]">
        {copy.en}
      </p>
      <p className="mt-2 text-[11px] sm:text-xs font-bold tracking-[0.35em] text-white/75 uppercase">{copy.zh}</p>
      <p className="mt-3 max-w-xs text-[8px] font-mono text-white/40 tracking-widest leading-relaxed hidden sm:block">
        AI precision · material fidelity · aesthetic control
      </p>
    </div>
  );
}

function revealClass(visible: boolean) {
  return visible
    ? 'opacity-100 translate-y-0 scale-100 max-h-96 pointer-events-auto mb-3'
    : 'opacity-0 translate-y-6 scale-[0.98] max-h-0 pointer-events-none mb-0 overflow-hidden';
}

function featureRevealClass(visible: boolean) {
  return visible
    ? 'opacity-100 translate-y-0 pointer-events-auto mb-2'
    : 'opacity-0 translate-y-10 max-h-0 pointer-events-none mb-0 overflow-hidden';
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const [activeFeature, setActiveFeature] = useState<number | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [segment, setSegment] = useState(0);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [scrubReady, setScrubReady] = useState(false);
  const [bufferPct, setBufferPct] = useState(0);
  const [featuresReady, setFeaturesReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const durationRef = useRef(0);
  const segmentRef = useRef(0);
  const wheelAccumRef = useRef(0);
  const wheelLockedRef = useRef(false);
  const segmentStopRef = useRef<number | null>(null);
  const pendingSegmentRef = useRef<number | null>(null);
  const videoSrcRef = useRef<string | null>(null);
  const triedFallbackRef = useRef(false);

  const clearSegmentStop = useCallback(() => {
    if (segmentStopRef.current !== null) {
      window.clearTimeout(segmentStopRef.current);
      segmentStopRef.current = null;
    }
  }, []);

  const startVideoLoad = useCallback((url: string) => {
    if (videoSrcRef.current === url) return;
    videoSrcRef.current = url;
    setVideoSrc(url);
    setScrubReady(false);
    setBufferPct(0);
  }, []);

  const tryFallbackVideo = useCallback(() => {
    if (triedFallbackRef.current || videoSrcRef.current === COVER_VIDEO_FALLBACK) return;
    triedFallbackRef.current = true;
    startVideoLoad(COVER_VIDEO_FALLBACK);
  }, [startVideoLoad]);

  const playSegment = useCallback(
    (seg: number) => {
      segmentRef.current = seg;
      setSegment(seg);

      if (seg !== SEGMENT_COUNT) {
        setFeaturesReady(false);
      }

      const video = videoRef.current;
      clearSegmentStop();
      if (!video || seg <= 0) {
        video?.pause();
        setFeaturesReady(false);
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
        void video.play().catch(() => video.pause());
        segmentStopRef.current = window.setTimeout(() => {
          video.pause();
          try {
            video.currentTime = end;
          } catch {
            // ignore
          }
          if (seg === SEGMENT_COUNT) {
            setFeaturesReady(true);
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

  const goToSegment = useCallback(
    (next: number) => {
      const clamped = Math.min(SEGMENT_COUNT, Math.max(0, next));
      if (clamped === segmentRef.current) return;

      if (!videoSrcRef.current) {
        pendingSegmentRef.current = clamped;
        startVideoLoad(COVER_VIDEO_SRC);
        segmentRef.current = clamped;
        setSegment(clamped);
        return;
      }

      playSegment(clamped);
    },
    [playSegment, startVideoLoad],
  );

  const stepSegment = useCallback(
    (direction: 1 | -1) => {
      goToSegment(segmentRef.current + direction);
    },
    [goToSegment],
  );

  useEffect(() => {
    const run = () => {
      void import('../lib/userProfile').then(({ ensureUserProfile }) =>
        ensureUserProfile()
          .then((doc) => {
            const url = doc?.avatarUrl ? String(doc.avatarUrl).trim() : '';
            setAvatarUrl(url || null);
          })
          .catch(() => setAvatarUrl(null)),
      );
    };
    const id =
      typeof window.requestIdleCallback === 'function'
        ? window.requestIdleCallback(run, { timeout: 2500 })
        : window.setTimeout(run, 1500);
    return () => {
      if (typeof window.cancelIdleCallback === 'function' && typeof id === 'number') {
        window.cancelIdleCallback(id);
      } else {
        window.clearTimeout(id as number);
      }
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc) return;

    video.preload = 'auto';
    video.load();

    const updateBuffer = () => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) return;
      if (video.buffered.length === 0) return;
      const end = video.buffered.end(video.buffered.length - 1);
      setBufferPct(Math.min(100, Math.round((end / video.duration) * 100)));
    };

    const onLoadedMetadata = () => {
      if (Number.isFinite(video.duration) && video.duration > 0) {
        durationRef.current = video.duration;
        setScrubReady(true);
      }
      updateBuffer();
    };

    const onCanPlay = () => {
      setScrubReady(true);
      updateBuffer();
      const pending = pendingSegmentRef.current;
      if (pending !== null) {
        pendingSegmentRef.current = null;
        playSegment(pending);
      }
    };

    const onError = () => {
      tryFallbackVideo();
    };

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('progress', updateBuffer);
    video.addEventListener('error', onError);

    if (video.readyState >= 1) onLoadedMetadata();
    if (video.readyState >= 3) onCanPlay();

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('progress', updateBuffer);
      video.removeEventListener('error', onError);
    };
  }, [videoSrc, playSegment, tryFallbackVideo]);

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
    return () => el.removeEventListener('wheel', onWheel, { capture: true });
  }, [stepSegment]);

  useEffect(() => clearSegmentStop, [clearSegmentStop]);

  const features = [
    { title: '模特捏脸', desc: 'Parameterized Facial Synthesizer', stats: 'LIVE SYNC', view: View.MODEL_FACE_GEN },
    { title: '形象生成器', desc: 'Biometric Identity Wardrobe Node', stats: 'SYS.ACTIVE', view: View.CREATOR },
    { title: '虚拟试穿', desc: 'AI Specimen Fit Accuracy', stats: 'SYS.ONLINE', view: View.TRY_ON },
    { title: '数字衣橱', desc: 'Secured Digital Wardrobe System', stats: 'ARCHIVE', view: View.WARDROBE },
  ];

  const progressPct = (segment / SEGMENT_COUNT) * 100;
  const revealedFeatures = featuresReady ? 4 : 0;
  const showBufferHint = videoSrc && !scrubReady;
  const showPoster = segment === 0 && !scrubReady;
  const mediaSharp = segment > 0;
  const showHeroCopy = segment >= 1 && segment <= 3;
  const showFinalCta = segment >= SEGMENT_COUNT && !featuresReady;
  const showMaterialScan = segment === 2 || segment === 3;
  const showDataOverlay = segment === 1;
  const showEyeFocus = segment >= SEGMENT_COUNT;

  const featureCount = features.length;
  const featureStaggerMs = 100;

  return (
    <div ref={rootRef} className="absolute inset-0 overflow-hidden bg-black text-white font-sans">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div
          className={`absolute inset-0 transition-all duration-700 ease-out ${mediaSharp ? 'blur-0 scale-100' : 'blur-[8px] scale-[1.03]'}`}
        >
          <img
            src={HomeHeroPoster}
            alt=""
            aria-hidden
            className={`absolute inset-0 w-full h-full object-cover object-[center_35%] transition-opacity duration-300 ${showPoster ? 'opacity-100' : 'opacity-0'}`}
          />
          <video
            ref={videoRef}
            id="garment-video"
            src={videoSrc ?? undefined}
            poster={HomeHeroPoster}
            muted
            playsInline
            preload={videoSrc ? 'auto' : 'none'}
            disablePictureInPicture
            className={`absolute inset-0 z-[1] w-full h-full object-cover object-[center_35%] ${segment > 0 || scrubReady ? 'opacity-100' : 'opacity-0'}`}
          />
        </div>
        <div className="absolute inset-0 z-[2] bg-gradient-to-b from-black/55 via-black/10 to-black/80 pointer-events-none"></div>
        {showDataOverlay && <FloatingDataOverlay />}
        {showMaterialScan && <MaterialScanOverlay active={showMaterialScan} />}
        {showEyeFocus && <EyeFocusOverlay />}
      </div>

      <div className="relative z-10 h-full flex flex-col pointer-events-none">
        <header className="shrink-0 flex justify-between items-center px-6 md:px-10 pt-6 md:pt-8 pb-4 pointer-events-auto">
          <div className="flex items-center">
            <img src={LogoImg} alt="LOKADA" className="h-28 sm:h-32 md:h-[9rem] w-auto object-contain" />
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
            <div className="absolute top-0 left-0 h-full bg-[#5F3D94] transition-[width] duration-300" style={{ width: `${progressPct}%` }} />
          </div>
          <span className="text-[8px] font-black tracking-widest uppercase text-white/90 drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.9)] font-space">
            SEG {segment} / {SEGMENT_COUNT}
          </span>
        </div>

        <div className="flex-1 min-h-0 relative pointer-events-none">
          {showHeroCopy && <HeroCopyBlock segment={segment} />}

          {showFinalCta && (
            <div className="absolute inset-x-0 top-[30%] md:top-[28%] z-[4] flex flex-col items-center px-8 pointer-events-auto animate-in fade-in duration-700">
              <button
                type="button"
                onClick={() => onNavigate?.(View.CREATOR)}
                className="group relative px-8 py-3 rounded-full border border-white/80 bg-[#0a1628]/40 backdrop-blur-md text-white hover:bg-white hover:text-[#0a1628] active:scale-[0.98] transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.12)]"
              >
                <span className="block text-xs font-black uppercase tracking-[0.28em]">立刻开始设计</span>
                <span className="block mt-1 text-[8px] font-bold uppercase tracking-[0.22em] text-white/60 group-hover:text-[#0a1628]/60 transition-colors">
                  Start Creating
                </span>
              </button>
            </div>
          )}

          {segment === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <span className="text-[8px] font-black uppercase tracking-[0.35em] text-white/45 select-none animate-pulse text-center leading-relaxed">
                滚动滚轮 · 探索 AI 时尚精度
                <br />
                共 {SEGMENT_COUNT} 段 · 每段 {SEGMENT_DURATION}s
              </span>
              {showBufferHint && (
                <span className="text-[7px] font-black uppercase tracking-[0.25em] text-white/35">
                  {bufferPct > 0 ? `视频缓冲 ${bufferPct}%` : '视频加载中…'}
                </span>
              )}
            </div>
          )}
        </div>

        <div
          className={`shrink-0 px-4 md:px-8 pb-5 md:pb-6 flex flex-col items-center pointer-events-none ${
            featuresReady ? 'max-h-[36vh] md:max-h-[40vh] overflow-y-auto no-scrollbar' : ''
          }`}
        >
          <div className="w-full max-w-[min(100%,22rem)] md:max-w-md mx-auto origin-bottom scale-[0.82] sm:scale-[0.88] md:scale-[0.9]">
          {features.map((f, i) => {
            const visible = featuresReady;
            const delayMs = visible ? (featureCount - 1 - i) * featureStaggerMs : 0;
            return (
              <div
                key={f.title}
                className={`transform transition-all duration-700 ease-out ${featureRevealClass(visible)}`}
                style={{ transitionDelay: visible ? `${delayMs}ms` : '0ms' }}
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
                  className={`pointer-events-auto group flex items-center justify-between py-2.5 px-3 rounded-xl border backdrop-blur-md transition-colors duration-200 cursor-pointer ${
                    activeFeature === i ? 'bg-primary border-white/30 text-white' : 'bg-black/40 border-white/10 text-white hover:bg-black/55'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`font-mono text-sm font-black shrink-0 ${activeFeature === i ? 'text-white' : 'text-white/35'}`}>0{i + 1}</span>
                    <div className="min-w-0">
                      <h4 className="font-black uppercase tracking-tight text-xs truncate">{f.title}</h4>
                      <p className={`text-[7px] font-bold uppercase tracking-wider truncate ${activeFeature === i ? 'text-white/60' : 'text-white/45'}`}>{f.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className={`text-[6px] font-black uppercase tracking-widest px-1.5 py-0.5 border ${activeFeature === i ? 'border-white/40 text-white' : 'border-white/15 text-white/70 bg-white/10'}`}>
                      {f.stats}
                    </span>
                    <span className="material-icons-round text-xs transition-transform group-hover:translate-x-1">east</span>
                  </div>
                </div>
              </div>
            );
          })}

          <div
            className={`transform transition-all duration-700 ease-out ${featureRevealClass(featuresReady)}`}
            style={{ transitionDelay: featuresReady ? `${featureCount * featureStaggerMs + 80}ms` : '0ms' }}
          >
            <footer className="pt-1 flex justify-between items-center text-white/40 pointer-events-none">
              <span className="text-[7px] font-mono font-bold tracking-widest uppercase">Protocol V.2.1-AXON</span>
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
    </div>
  );
};

export default Home;
