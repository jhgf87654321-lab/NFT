import React, { useEffect, useMemo, useRef, useState } from 'react';
import BlackLogoImg from '../../assets/BLACK-LOGO-02.png';
import { generateGeminiImage } from '../../lib/geminiClient';
import { View } from '../../types';

interface TryOnModuleProps {
  onNavigate?: (view: View) => void;
}

type CameraMode = 'front' | 'rear' | 'off';

type CyberCollectionItem = {
  image: string;
  prompt?: string;
  serialNumber?: string;
  isSpecial?: boolean;
  theme?: string;
};

function safeParseJson<T>(value: string | null): { ok: true; value: T } | { ok: false; error: string } {
  if (!value) return { ok: false, error: 'empty' };
  try {
    return { ok: true, value: JSON.parse(value) as T };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

function getStylePromptFromLocalStorage(): string {
  const nftDataStr = localStorage.getItem('generatedNFTData');
  const parsed = safeParseJson<{ prompt?: string }>(nftDataStr);
  if (parsed.ok && typeof parsed.value.prompt === 'string' && parsed.value.prompt.trim()) {
    return parsed.value.prompt.trim();
  }
  return 'high-end avant-garde fashion clothing';
}

async function compressDataUrl(dataUrl: string, maxDim: number, quality: number): Promise<string> {
  if (!dataUrl.startsWith('data:')) return dataUrl;
  // Faster + avoids main-thread <img> decode stalls on large images.
  const resp = await fetch(dataUrl);
  const blob = await resp.blob();
  const bmp = await createImageBitmap(blob);
  const scale = Math.min(1, maxDim / Math.max(bmp.width || 1, bmp.height || 1));
  const w = Math.max(1, Math.round((bmp.width || 1) * scale));
  const h = Math.max(1, Math.round((bmp.height || 1) * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;
  ctx.drawImage(bmp, 0, 0, w, h);
  try {
    const webp = canvas.toDataURL('image/webp', quality);
    if (webp) return webp;
  } catch {
    // ignore
  }
  return canvas.toDataURL('image/jpeg', quality);
}

function dataUrlToInlinePart(dataUrl: string) {
  if (!dataUrl.startsWith('data:')) return null;
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) return null;
  return { inlineData: { mimeType: m[1]!, data: m[2]! } } as const;
}

async function sha256Base64(input: string) {
  const buf = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  const bytes = new Uint8Array(hash);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return btoa(bin).replace(/=+$/g, '');
}

export default function TryOnModule({ onNavigate }: TryOnModuleProps) {
  const [cameraMode, setCameraMode] = useState<CameraMode>('off');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [generatedNFT, setGeneratedNFT] = useState<string | null>(null);
  const [myCyberCollection, setMyCyberCollection] = useState<CyberCollectionItem[]>([]);
  const [portraitImage, setPortraitImage] = useState<string | null>(null);
  const [tryOnPreview, setTryOnPreview] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [selectedOutfitKey, setSelectedOutfitKey] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const portraitImageRef = useRef<string | null>(null);
  const generatedNFTRef = useRef<string | null>(null);

  useEffect(() => {
    portraitImageRef.current = portraitImage;
  }, [portraitImage]);

  useEffect(() => {
    generatedNFTRef.current = generatedNFT;
  }, [generatedNFT]);

  useEffect(() => {
    void import('../../lib/userProfile').then(({ ensureUserProfile }) =>
      ensureUserProfile()
        .then((doc) => {
          const url = doc?.avatarUrl ? String(doc.avatarUrl).trim() : '';
          setAvatarUrl(url || null);
        })
        .catch(() => setAvatarUrl(null)),
    );
  }, []);

  useEffect(() => {
    const storedNFT = localStorage.getItem('generatedNFT');
    if (storedNFT) setGeneratedNFT(storedNFT);

    const storedCollection = localStorage.getItem('myCyberCollection');
    const parsed = safeParseJson<CyberCollectionItem[]>(storedCollection);
    if (parsed.ok && Array.isArray(parsed.value)) {
      setMyCyberCollection(parsed.value);
    } else if (storedCollection) {
      console.error('Failed to parse myCyberCollection', parsed);
    }

    const storedPortrait = localStorage.getItem('tryOnPortraitImage');
    if (storedPortrait) setPortraitImage(storedPortrait);

    const storedTryOn = localStorage.getItem('tryOnLastImage');
    if (storedTryOn) setTryOnPreview(storedTryOn);
  }, []);

  const wardrobeOutfits = useMemo(() => {
    const items: (CyberCollectionItem & { key: string })[] = [];
    const seen = new Set<string>();
    const push = (item: CyberCollectionItem, key: string) => {
      if (!item.image || seen.has(item.image)) return;
      seen.add(item.image);
      items.push({ ...item, key });
    };
    if (generatedNFT) {
      push({ image: generatedNFT, theme: '当前造型', serialNumber: 'LATEST' }, 'latest');
    }
    myCyberCollection.forEach((item, idx) => push(item, item.serialNumber || `saved-${idx}`));
    return items;
  }, [generatedNFT, myCyberCollection]);

  useEffect(() => {
    if (selectedOutfitKey) return;
    if (wardrobeOutfits.length > 0) {
      setSelectedOutfitKey(wardrobeOutfits[0]!.key);
    }
  }, [wardrobeOutfits, selectedOutfitKey]);

  const activeOutfit = wardrobeOutfits.find((o) => o.key === selectedOutfitKey) ?? wardrobeOutfits[0] ?? null;

  useEffect(() => {
    if (activeOutfit?.image) {
      setGeneratedNFT(activeOutfit.image);
    }
  }, [activeOutfit?.image]);

  const applyHint = !portraitImage && cameraMode === 'off'
    ? '请先上传真人照片或打开相机'
    : !activeOutfit
      ? '请从衣橱选择一套服装'
      : '已就绪，点击下方生成试穿';

  const applyLabel = isApplying
    ? '生成中…'
    : cooldownUntil !== null && Date.now() < cooldownUntil
      ? '冷却中，请稍候'
      : '生成试穿';

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    const start = async () => {
      if (cameraMode === 'off') return;
      const facingMode = cameraMode === 'front' ? 'user' : 'environment';
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
        if (cancelled) return;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (e) {
        console.error('Error accessing camera', e);
        alert('无法访问相机。');
      }
    };

    void start();

    return () => {
      cancelled = true;
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [cameraMode]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = event.target?.result;
      if (typeof result !== 'string') {
        console.error('Unexpected FileReader result', result);
        alert('读取文件失败。');
        return;
      }
      try {
        const compressed = await compressDataUrl(result, 1280, 0.85);
        setPortraitImage(compressed);
        localStorage.setItem('tryOnPortraitImage', compressed);
      } catch {
        setPortraitImage(result);
        localStorage.setItem('tryOnPortraitImage', result);
      }
      setCameraMode('off');
    };
    reader.onerror = (err) => {
      console.error('FileReader error', err);
      alert('读取文件失败。');
    };
    reader.readAsDataURL(file);
  };

  const captureFrame = () => {
    const video = videoRef.current;
    if (!video) return null;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.9);
  };

  const handleApplyStyle = async () => {
    if (cooldownUntil && Date.now() < cooldownUntil) {
      const secs = Math.ceil((cooldownUntil - Date.now()) / 1000);
      alert(`Gemini 配额冷却中，请在约 ${secs}s 后再试。`);
      return;
    }

    // Use ref to avoid stale state when user switches images quickly.
    let baseImage = portraitImageRef.current;
    if (cameraMode !== 'off') baseImage = captureFrame();

    if (!baseImage) {
      alert('请上传图片或打开相机。');
      return;
    }
    const currentGeneratedNFT = generatedNFTRef.current;
    if (!currentGeneratedNFT) {
      alert('请先从衣橱选择服装造型。');
      return;
    }

    setIsApplying(true);
    try {
      // Preprocess both images for faster inference + faster transport.
      // Keep TryOn as "fast preview"; higher-res can be added later as an explicit action.
      const [basePrepared, nftPrepared] = await Promise.all([
        compressDataUrl(baseImage, 1024, 0.82).catch(() => baseImage),
        compressDataUrl(currentGeneratedNFT, 1024, 0.82).catch(() => currentGeneratedNFT),
      ]);

      const stylePrompt = getStylePromptFromLocalStorage();
      const prompt =
        `把图2人物的衣服穿在图1人物身上，\n` +
        `要求：\n` +
        `1）图1中的人物身份、五官、发型、肤色、身材比例、肢体姿势必须保持不变；图1的背景环境/镜头角度/构图/景深/光线方向也必须保持不变。\n` +
        `2）只替换服装：从图2中提取所有可见衣服（外套、内搭、下装、靴子/鞋履、明显配饰），把这整套造型自然地穿在图1人物身上。\n` +
        `3）必须同步替换图2中的鞋履和头部相关配饰（如帽子、头盔、发饰、头纱等）：如果图2人物穿了靴子或戴了头饰，那么图1结果中也必须穿同款靴子/鞋、戴同款头饰。\n` +
        `4）不能随意新增或删除鞋履和头饰：如果图2没有帽子，不要凭空加帽子；如果图2有头盔，不要在结果中去掉头盔。只允许做符合图1人物姿势和头部方向的透视调整。\n` +
        `5）服装（包括鞋履和头饰）的设计、版型、结构线、材质、颜色、图案、Logo/文字（如果这些属于“衣服本身”的印花或标识）都不能改变；只允许为了适配图1人物的身体和姿势而改变透视和褶皱（例如拉伸、弯曲、产生新的阴影和皱褶）。\n` +
        `6）严禁把图2的背景元素带入结果：不要保留图2里的背景、标语、海报、字母、图形或任何非服装元素。尤其不要让图2背景中的“FUTURE MODE”等文字出现在结果里。\n` +
        `7）结果必须是一张完整单图、高质量写实照片，光影自然；不能添加水印、UI、边框、海报文字、额外标识。若输出中出现任何不属于衣服本身的文字，请去除。\n` +
        `8）整体效果要看起来就像图1原始照片中，这个人真实穿上了图2这整套服装（含鞋子和头饰），人物姿势与背景完全不变。\n` +
        (stylePrompt ? `9）服装细节和整体气质尽量贴合以下风格描述（仅作为风格倾向，不得改变服装设计本体）：${stylePrompt}。\n` : '');

      // Cache: identical inputs should return instantly (no re-generation).
      const cacheKey = await sha256Base64([basePrepared, nftPrepared, prompt].join('|'));
      const cacheStorageKey = `tryon_cache_${cacheKey}`;
      const cached = localStorage.getItem(cacheStorageKey);
      if (cached && cached.startsWith('data:image/')) {
        setTryOnPreview(cached);
        localStorage.setItem('tryOnLastImage', cached);
        setCameraMode('off');
        return;
      }

      // No COS needed: send inlineData directly.
      const basePart = dataUrlToInlinePart(basePrepared);
      const nftPart = dataUrlToInlinePart(nftPrepared);
      if (!basePart || !nftPart) {
        throw new Error('输入图片格式不支持，请重新选择图片。');
      }

      const newImgData = await generateGeminiImage({
        parts: [basePart, nftPart, { text: prompt }],
        // 不改模型（仅优化本地处理/请求）；如需更快可另开“极速模式”切换模型。
        model: 'gemini-3.1-flash-image-preview',
      });
      setTryOnPreview(newImgData);
      localStorage.setItem('tryOnLastImage', newImgData);
      try {
        // Best-effort cache for future instant reruns.
        localStorage.setItem(cacheStorageKey, newImgData);
      } catch {
        // ignore storage quota errors
      }
      setCameraMode('off');
    } catch (error) {
      console.error('Error applying style', error);
      const msg = error instanceof Error ? error.message : String(error);
      const status = (error as any)?.status as number | undefined;
      if (status === 429 || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota') || msg.includes('429')) {
        // 60s client cooldown to prevent hammering
        setCooldownUntil(Date.now() + 60_000);
        alert('Gemini 配额已用尽（429），请等待 1-2 分钟后重试。');
      } else {
        alert('换装失败。');
      }
    } finally {
      setIsApplying(false);
    }
  };

  const placeholderPortrait =
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCKAMKp0TtEWJYJNcZuRTSgY_qvozq8oPMukJQbQpVZgsHfEt4BELcOppAn9n2f69uW7rHKIppo3NkRAt0fNpWMEQet9_wvR1rbxCAsCi4cJxkoEIVWWgVreHMFkfNN0rRiDtjI1zo24VYB5qj6Vspq0H9mvbfg8v8AYD3amnNu3uYh6CPqSLVBcmRRYlxolIlYPXF2Ruc6Jqsn7-U6JhYZaue9IdiNF1JDy4KM4mM5jNjapu6onKj9gQY0JkJrsmRd4rW6qBYwzv45';

  const panelTitleClass = 'text-[10px] font-black uppercase tracking-[0.2em] text-black/50';
  const previewFrameClass =
    'relative w-full max-w-[220px] sm:max-w-[240px] mx-auto aspect-[3/4] overflow-hidden border border-neutral-200 bg-neutral-100';

  return (
    <div className="relative min-h-full bg-[#FAF9F6] text-black selection:bg-primary selection:text-white flex flex-col">
      <div className="fixed inset-0 pointer-events-none -z-20 overflow-hidden">
        <div className="absolute top-[10%] right-[20%] w-[50%] h-[50%] bg-[#5F3D94]/5 blur-[150px] rounded-full" />
      </div>

      <header className="relative z-50 shrink-0 px-8 lg:px-16 pt-10 flex justify-between items-center mb-4 select-none">
        <div className="flex items-center gap-6 font-sans">
          <img src={BlackLogoImg} alt="LOKADA" className="h-12 sm:h-14 w-auto object-contain shrink-0" />
          <h1 className="font-future font-black text-2xl leading-none text-black tracking-widest uppercase font-display">虚拟试穿</h1>
          <div className="h-6 w-px bg-primary/15 hidden md:block" />
          <p className="text-[9px] tracking-[0.3em] uppercase text-black/45 font-bold leading-none hidden md:block font-sans">
            AI VIRTUAL TRY-ON
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[9px] font-mono text-black/45 tracking-widest hidden lg:block uppercase">[ FIT ENGINE ACTIVE ]</span>
          <button
            type="button"
            onClick={() => onNavigate?.(View.AUTH)}
            className="group flex items-center gap-3 bg-white hover:bg-neutral-100 border border-primary/10 rounded-full pl-5 pr-2 py-1.5 transition-all text-[9.5px] uppercase tracking-widest font-black active:scale-95 shadow-sm text-black"
          >
            <span>Network Node</span>
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-primary/10 group-hover:border-primary/50 transition-colors">
              <img
                src={avatarUrl || 'https://picsum.photos/100/100?seed=axon_prime'}
                alt="User"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-primary border border-white animate-pulse" />
            </div>
          </button>
        </div>
      </header>

      <main className="flex-1 min-h-0 w-full max-w-7xl mx-auto px-4 lg:px-8 relative z-10 mb-28">
        <div className="bg-white border border-neutral-300 overflow-hidden grid grid-cols-1 lg:grid-cols-12 lg:items-start divide-y lg:divide-y-0 lg:divide-x divide-neutral-200">
          {/* 左：真人照片 */}
          <section className="lg:col-span-4 flex flex-col">
            <div className="shrink-0 px-4 py-2 border-b border-neutral-200 bg-[#FAF9F6]">
              <h2 className={panelTitleClass}>真人照片</h2>
            </div>
            <div className="relative px-3 py-2 bg-white">
            <div className={previewFrameClass}>
              {cameraMode !== 'off' ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-contain ${cameraMode === 'front' ? 'scale-x-[-1]' : ''}`}
                />
              ) : portraitImage ? (
                <img src={portraitImage} alt="真人照片" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              ) : (
                <>
                  <img src={placeholderPortrait} alt="" className="w-full h-full object-contain opacity-30 grayscale" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center pointer-events-none">
                    <span className="material-icons-round text-3xl text-black/20 mb-2">person_add</span>
                    <p className="text-xs font-bold text-black/45">上传真人照片</p>
                  </div>
                </>
              )}
            </div>
            </div>
            <div className="shrink-0 px-3 pb-2 pt-1 flex justify-center gap-2 border-t border-neutral-200 bg-[#FAF9F6]">
            <button
              type="button"
              className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${
                cameraMode === 'rear'
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-black/50 border-neutral-200 hover:border-primary/40'
              }`}
              title="相机"
              onClick={() => setCameraMode(cameraMode === 'rear' ? 'off' : 'rear')}
            >
              <span className="material-icons-round text-sm">photo_camera</span>
            </button>
            <button
              type="button"
              className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-sm border border-primary"
              title="上传照片"
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="material-icons-round text-sm">photo_library</span>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
          </div>
        </section>

        {/* 中：生成预览 */}
        <section className="lg:col-span-4 flex flex-col">
          <div className="shrink-0 px-4 py-2 border-b border-neutral-200 bg-[#FAF9F6]">
            <h2 className={panelTitleClass}>生成预览</h2>
          </div>
          <div className="relative px-3 py-2 bg-white">
            <div className={previewFrameClass}>
              {tryOnPreview ? (
                <>
                  <img src={tryOnPreview} alt="试穿预览" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  <div className="absolute left-0 right-0 h-[2px] bg-primary shadow-[0_0_20px_#5F3D94] animate-scan z-10 pointer-events-none"></div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center pointer-events-none">
                  <span className="material-icons-round text-3xl text-primary/30 mb-2">auto_awesome</span>
                  <p className="text-xs font-bold text-black/45">试穿效果将显示于此</p>
                  <p className="text-[9px] text-black/30 mt-1 uppercase tracking-widest">Generate Preview</p>
                </div>
              )}
              {isApplying && (
                <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-20">
                  <span className="material-icons-round text-3xl text-primary animate-spin mb-2">sync</span>
                  <p className="text-[10px] font-bold text-black uppercase tracking-widest">生成中…</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 右：数字衣橱 */}
        <aside className="lg:col-span-4 flex flex-col bg-[#FAF9F6] max-h-[42vh] lg:max-h-[26rem]">
          <div className="shrink-0 px-4 pt-3 pb-2 border-b border-neutral-200">
            <div className="flex items-center justify-between mb-0.5">
              <h2 className="text-sm font-black uppercase tracking-widest text-black">数字衣橱</h2>
              <span className="text-[9px] font-mono text-black/45 bg-white border border-neutral-200 px-2 py-0.5">
                {wardrobeOutfits.length} SPEC
              </span>
            </div>
            <p className="text-[9px] text-black/45 leading-relaxed">选择造型后生成试穿</p>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-3 py-2">
            {wardrobeOutfits.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {wardrobeOutfits.map((item) => {
                  const isSelected = activeOutfit?.key === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => {
                        setSelectedOutfitKey(item.key);
                        setGeneratedNFT(item.image);
                        generatedNFTRef.current = item.image;
                        setCameraMode('off');
                      }}
                      className={`group relative aspect-[3/4] overflow-hidden border transition-all text-left bg-white ${
                        isSelected
                          ? 'border-primary ring-1 ring-primary scale-[1.02]'
                          : 'border-neutral-200 hover:border-primary/50'
                      }`}
                    >
                      <img
                        src={item.image}
                        alt={item.theme || '服装'}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 py-1.5">
                        <p className="text-[6px] font-bold uppercase tracking-wider truncate text-white">
                          {item.theme || 'Couture'}
                        </p>
                        <p className="text-[5.5px] text-white/80 font-mono truncate">{item.serialNumber || '#GEN'}</p>
                      </div>
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                          <span className="material-icons-round text-white text-xs">check</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="min-h-[5rem] flex flex-col items-center justify-center text-center px-3 py-4 border border-dashed border-neutral-300 bg-white">
                <span className="material-icons-round text-3xl text-neutral-300 mb-2">checkroom</span>
                <p className="text-[10px] font-bold uppercase tracking-widest text-black/70 mb-1">衣橱为空</p>
                <p className="text-[9px] text-black/45 leading-relaxed">
                  请先在「形象生成器」中生成造型，保存后会出现在这里
                </p>
              </div>
            )}
          </div>

          <div className="shrink-0 p-3 border-t border-neutral-200 space-y-2 bg-white">
            <div className="flex items-start gap-2 border border-neutral-200 bg-neutral-50 px-2.5 py-2">
              <span className="material-icons-round text-sm text-primary shrink-0 mt-0.5">info</span>
              <p className="text-[9px] text-black/55 leading-relaxed">{applyHint}</p>
            </div>
            <button
              type="button"
              onClick={() => void handleApplyStyle()}
              disabled={isApplying || (cooldownUntil !== null && Date.now() < cooldownUntil)}
              className="w-full bg-primary text-white py-3 flex items-center justify-between px-4 group active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_8px_24px_rgba(95,61,148,0.25)]"
            >
              <div className="flex flex-col items-start gap-0.5">
                <span className="text-sm font-black uppercase tracking-widest">{applyLabel}</span>
                <span className="text-[8px] text-white/70 font-bold uppercase tracking-wider">AI Virtual Try-On</span>
              </div>
              <span className={`material-icons-round text-xl ${isApplying ? 'animate-spin' : ''}`}>
                {isApplying ? 'sync' : 'auto_awesome'}
              </span>
            </button>
          </div>
        </aside>
        </div>
      </main>
    </div>
  );
}

