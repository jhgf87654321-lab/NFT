
import React, { useEffect, useMemo, useState } from 'react';

import { GoogleGenAI } from '@google/genai';

import { View } from '../types';
import { getRandomAestheticReferences, uploadImageToCloudBase, type AestheticReference } from '../lib/apiClient';
import { generateGeminiImage, type GeminiPart } from '../lib/geminiClient';
import { generateGeminiText } from '../lib/geminiTextClient';
import { ConfiguratorPanel } from '../components/ConfiguratorPanel';
import { LiveCanvas } from '../components/LiveCanvas';
import { WardrobeVault } from '../components/WardrobeVault';
import { addNftToMyProfile, ensureUserProfile } from '../lib/userProfile';
import { getCloudbaseAuth } from '../lib/cloudbase';
import { getMintJobSnapshot, startMintJob, subscribeMintJob, type MintJobResult } from '../lib/mintJob';
import { upsertImageInfo } from '../lib/imageInfo';

type Category = 'Body' | 'Skin' | 'Style' | 'Design';
type Gender = 'Male' | 'Female' | 'Creature';
type CreatureTexture = 'Hairy' | 'Hairless';
type DesignMode = 'Random' | 'Custom';

/** 审美风格「工装」：仅制服大类；具体职业/款型由「自定义服装设计」输入框填写 */
export const WORKWEAR_THEME_KEYWORDS_ZH =
  '高概念工装 / 制服大类（WORKWEAR · PROFESSIONAL UNIFORM）+ 奢侈品秀场融合';

export function eraStyleFromEraParam(era: number): string {
  if (era > 70) return 'ultra-modern, futuristic, and cutting-edge';
  if (era < 30) return 'retro, vintage, neutral, and simple';
  return 'a blend of contemporary and classic styles';
}

export function eraStyleLabelZh(era: number): string {
  if (era > 70) return '超现代 / 未来感';
  if (era < 30) return '复古 / 简约';
  return '当代与经典融合';
}

/** 与 generateNFT 内工装分支一致的英文 prompt 片段；uniformDetail 来自设计页输入框 */
export function buildWorkwearStyleInstruction(eraStyle: string, uniformDetail?: string): string {
  const detail = uniformDetail?.trim() ?? '';
  let block = `The aesthetic era is ${eraStyle}.`;
  block +=
    ' The design theme is a specialized high-concept avant-garde WORKWEAR / PROFESSIONAL UNIFORM category (general workwear and service-industry uniform aesthetic — a broad uniform class, NOT a random preset occupation). The character MUST wear a custom high-fashion uniform outfit.';
  if (detail) {
    block += ` The specific profession, role, garment types, cuts, fabrics, utility details, and uniform features MUST exactly follow the user specification: "${detail}". Prioritize this over any generic workwear defaults.`;
  } else {
    block +=
      ' Use a versatile premium workwear uniform silhouette (functional pockets, durable tailored fabrics, professional service or industrial-chic look) without assigning a specific named job until the user provides details in the clothing prompt.';
  }
  block +=
    ' Blend this workwear uniform concept beautifully with sophisticated high-fashion luxury runway aesthetic.';
  return block;
}

interface ParameterSet {
  label: string;
  key: string;
  value: number;
}

type CyberCollectionItem = {
  image: string;
  serialNumber: string;
  isSpecial: boolean;
  theme: string;
  prompt: string;
  cosUrl?: string;
  ownerUid?: string;
};

type CreatorStateV1 = {
  v: 1;
  activeCategory: Category;
  gender: Gender;
  creatureTexture: CreatureTexture;
  designMode: DesignMode;
  customDesign: { top: string; bottom: string; shoes: string };
  /** 设计页：用文字描述服装款式/剪裁/面料等，写入生成 prompt */
  clothingPrompt: string;
  aestheticStyle: 'Default' | '90s Haute Couture Runway' | 'Workwear';
  params: Record<string, number>;
  selectedSkinColor: string;
};

type CreatorProps = {
  onNavigate?: (view: View) => void;
};

const Creator: React.FC<CreatorProps> = ({ onNavigate }) => {
  const [activeCategory, setActiveCategory] = useState<Category>('Body');
  const [gender, setGender] = useState<Gender>('Female');
  const [creatureTexture, setCreatureTexture] = useState<CreatureTexture>('Hairless');
  const [designMode, setDesignMode] = useState<DesignMode>('Random');
  const [customDesign, setCustomDesign] = useState({
    top: 'Coat',
    bottom: 'Pants',
    shoes: 'Sneakers'
  });
  const [aestheticStyle, setAestheticStyle] = useState<CreatorStateV1['aestheticStyle']>('Default');
  const [hbaImageBase64, setHbaImageBase64] = useState<string | null>(null);
  const [customTopImage, setCustomTopImage] = useState<string | null>(null);
  const [customTopDesc, setCustomTopDesc] = useState<string | null>(null);
  const [isAnalyzingTop, setIsAnalyzingTop] = useState(false);
  const [customBottomImage, setCustomBottomImage] = useState<string | null>(null);
  const [customBottomDesc, setCustomBottomDesc] = useState<string | null>(null);
  const [isAnalyzingBottom, setIsAnalyzingBottom] = useState(false);
  const [customShoesImage, setCustomShoesImage] = useState<string | null>(null);
  const [customShoesDesc, setCustomShoesDesc] = useState<string | null>(null);
  const [isAnalyzingShoes, setIsAnalyzingShoes] = useState(false);
  
  // NFT Themes and Traits for randomness
  const themes = ['High-Fashion Editorial', 'Urban Techwear', 'Minimalist Avant-Garde', 'Streetwear Culture', 'Modern Tech-Fashion', 'Studio Lookbook'];
  const materials = ['Matte Nylon', 'Crisp Cotton', 'Heavy Wool', 'Premium Leather', 'Textured Denim', 'Fine Linen'];
  const styles = [
    'Full-Body Editorial Studio Portrait',
    'Wide-Angle Lookbook Photography',
    'High-End Full-Length Fashion Photography',
    'Cinematic Full-Length Portrait',
    'Futuristic Full-Body Fashion Portrait',
  ];

  // Parameter states for each category
  const [params, setParams] = useState<Record<string, number>>({
    muscularity: 35,
    jawline: 70,
    proportions: 64,
    heavy: 25,
    chromaticity: 60,
    era: 29,
    thickness: 100,
    pose: 50,
  });

  const [selectedSkinColor, setSelectedSkinColor] = useState('#E0AC69'); // Default skin tone (Tan Bio)
  const [clothingPrompt, setClothingPrompt] = useState('');
  const [expandOccupation, setExpandOccupation] = useState('');
  const [expandFeatures, setExpandFeatures] = useState('');
  const [isExpanding, setIsExpanding] = useState(false);

  const [lightingStyle, setLightingStyle] = useState('杂志封面');
  const [backgroundTheme, setBackgroundTheme] = useState('赛博实验室');
  const [grainFilter, setGrainFilter] = useState('无噪点');
  const [refImageWeight, setRefImageWeight] = useState(50);
  const [refImage, setRefImage] = useState<string | null>(null);
  const [modcardImage, setModcardImage] = useState<string | null>(null);
  const [isAnalyzingModcard, setIsAnalyzingModcard] = useState(false);
  const [modcardDesc, setModcardDesc] = useState<string | null>(null);
  const [myCyberCollection, setMyCyberCollection] = useState<CyberCollectionItem[]>([]);
  const [points, setPoints] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => setToastMessage(null), 3050);
  };

  const clothingPromptNeedsEnglish = (text: string) => /[\u4e00-\u9fff]/.test(text);

  const translateClothingPromptToEnglish = async (text: string): Promise<string> => {
    const trimmed = text.trim();
    if (!trimmed || !clothingPromptNeedsEnglish(trimmed)) return trimmed;
    try {
      const translated = await generateGeminiText({
        parts: [
          {
            text: `Translate the following fashion/clothing design description into professional English suitable for an AI image generation prompt. Preserve all garment details, materials, cuts, and styling intent. Return ONLY the English text — no quotes, labels, or explanation.\n\n${trimmed}`,
          },
        ],
        model: 'gemini-2.5-flash',
      });
      return translated?.trim() || trimmed;
    } catch (error) {
      console.error('Failed to translate clothing prompt', error);
      return trimmed;
    }
  };

  /** 用户显式要求科技/未来感审美时才在扩写中加入 techwear、cyber 等词汇 */
  const expandWantsTechAesthetic = (occupation: string, features: string) => {
    const combined = `${occupation} ${features}`.toLowerCase();
    const techHints = [
      '科技',
      '未来感',
      '未来',
      '赛博',
      '机能',
      '科幻',
      '赛博朋克',
      'tech',
      'techwear',
      'cyber',
      'cyberpunk',
      'futuristic',
      'sci-fi',
      'scifi',
      'sci fi',
      'mechanical',
      'neon',
    ];
    return techHints.some((hint) => combined.includes(hint.toLowerCase()));
  };

  const handleExpandPrompt = async () => {
    if (!expandOccupation.trim()) return;
    setIsExpanding(true);
    try {
      const occupation = expandOccupation.trim();
      const features = expandFeatures.trim();
      const userContext = features
        ? `occupation/role: ${occupation}\nfeatures: ${features}`
        : `occupation/role: ${occupation}`;
      const wantsTech = expandWantsTechAesthetic(occupation, features);

      const systemPrompt = wantsTech
        ? `你是一位顶尖的前卫高科技时装设计师。
请根据用户提供的职业/角色与可选特征，扩写为精准、专业、详细的中文服装设计描述（聚焦服装款式、上下装、叠穿、功能细节、面料质感与科技机能/runway 细节）。

输出要求：
1. 只返回扩写后的服装描述正文，不要引言、解释或引号。
2. 深入描述专业服装设计：具体上装、下装、叠穿层次、面料质感（如 ripstop 尼龙、做旧皮革、哑光陶瓷片、thermal mesh 等可保留英文材质名）、前卫剪裁与机能细节，将职业气质转化为未来感高定造型。
3. 控制在 2–3 句连贯 evocative 中文，不宜过长。
4. 有机融入用户特征。用户明确要求科技/未来感审美，可使用赛博、机能、未来感等中文词汇。

待扩写输入：
${userContext}`
        : `你是一位顶尖的前卫高定时装设计师与造型指导。
请根据用户提供的职业/角色与可选特征，扩写为精准、专业、详细的中文服装设计描述（聚焦服装款式、叠穿、面料与适合该角色的 runway 级细节）。

输出要求：
1. 只返回扩写后的服装描述正文，不要引言、解释或引号。
2. 聚焦可信、符合职业气质的高级或前卫时装：具体上下装、叠穿、面料质感（如精梳棉、羊毛斜纹、磨砂皮革、细亚麻、结构丹宁、真丝缎等）、剪裁与功能细节——不要默认加入科幻、赛博朋克、机能、霓虹、全息、机械等未来 tropes。
3. 除非用户输入明确提到科技、未来感、赛博、科幻等意图，否则不要添加 techwear/cyber/霓虹/全息/机械等未来词汇。
4. 控制在 2–3 句连贯中文，不宜过长。
5. 有机融入用户特征。

待扩写输入：
${userContext}`;

      const expanded = await generateGeminiText({
        parts: [{ text: systemPrompt }],
        model: 'gemini-2.5-flash',
      });
      if (expanded) setClothingPrompt(expanded);
    } catch (error) {
      console.error('Failed to expand prompt', error);
      alert('提示词扩写失败，请稍后重试。');
    } finally {
      setIsExpanding(false);
    }
  };

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedNFT, setGeneratedNFT] = useState<string | null>(null);
  const [nftData, setNftData] = useState<CyberCollectionItem | null>(null);
  const [nftMetadata, setNftMetadata] = useState<{ theme: string; rarity: string } | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedCollection = localStorage.getItem('myCyberCollection');
      if (storedCollection) setMyCyberCollection(JSON.parse(storedCollection) as CyberCollectionItem[]);
      const storedPoints = localStorage.getItem('userPoints');
      if (storedPoints) setPoints(parseInt(storedPoints, 10) || 0);
    } catch {
      // ignore
    }
  }, []);

  const handleRecycle = (index: number) => {
    const newCollection = [...myCyberCollection];
    newCollection.splice(index, 1);
    setMyCyberCollection(newCollection);
    localStorage.setItem('myCyberCollection', JSON.stringify(newCollection));
    const newPoints = points + 100;
    setPoints(newPoints);
    localStorage.setItem('userPoints', String(newPoints));
    triggerToast('MODEL PROTOCOL RECYCLED. +100 SCORE VALUE.');
  };

  const handleSelectSavedItem = (nft: CyberCollectionItem) => {
    setGeneratedNFT(nft.image);
    setNftData(nft);
    if (nft.prompt) setClothingPrompt(String(nft.prompt));
    if (nft.theme) {
      setNftMetadata({ theme: nft.theme, rarity: nft.isSpecial ? 'LEGENDARY' : 'COMMON' });
    }
    triggerToast('RETRIEVED PORTFOLIO DATA FROM VAULT.');
  };

  const skinColors: Array<{ name: string; hex: string; hint?: string }> = [
    { name: 'Light Bio', hex: '#FFDBAC' },
    { name: 'Warm Bio', hex: '#F1C27D' },
    { name: 'Tan Bio', hex: '#E0AC69', hint: '（亚洲人概率up）' },
    { name: 'Rich Bio', hex: '#8D5524' },
    { name: 'Deep Bio', hex: '#3B2219' },
    { name: 'Phantom', hex: '#E2E2E2' },
    { name: 'Obsidian', hex: '#1A1A1A' },
    { name: 'Neon Puls', hex: '#D4FF00' },
  ];

  const defaultCreatorState = useMemo<CreatorStateV1>(
    () => ({
      v: 1,
      activeCategory: 'Body',
      gender: 'Female',
      creatureTexture: 'Hairless',
      designMode: 'Random',
      customDesign: { top: 'Coat', bottom: 'Pants', shoes: 'Sneakers' },
      clothingPrompt: '',
      aestheticStyle: 'Default',
      params: {
        muscularity: 35,
        jawline: 70,
        proportions: 64,
        heavy: 25,
        chromaticity: 60,
        era: 29,
        thickness: 100,
        pose: 50,
      },
      selectedSkinColor: '#E0AC69',
    }),
    [],
  );

  // Restore Creator controls when returning from other tabs
  useEffect(() => {
    try {
      const raw = localStorage.getItem('creatorState');
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<CreatorStateV1> | null;
      if (!parsed || parsed.v !== 1) return;

      if (parsed.activeCategory) setActiveCategory(parsed.activeCategory);
      if (parsed.gender) setGender(parsed.gender);
      if (parsed.creatureTexture) setCreatureTexture(parsed.creatureTexture);
      if (parsed.designMode) setDesignMode(parsed.designMode);
      if (parsed.customDesign) setCustomDesign(parsed.customDesign);
      if (typeof parsed.clothingPrompt === 'string') setClothingPrompt(parsed.clothingPrompt);
      if (parsed.aestheticStyle) setAestheticStyle(parsed.aestheticStyle);
      if (parsed.params) setParams((prev) => ({ ...prev, ...parsed.params }));
      if (parsed.selectedSkinColor) setSelectedSkinColor(parsed.selectedSkinColor);
    } catch (e) {
      console.error('Failed to restore creatorState', e);
    }
  }, []);

  // Persist Creator controls so state survives navigation
  useEffect(() => {
    try {
      const payload: CreatorStateV1 = {
        ...defaultCreatorState,
        activeCategory,
        gender,
        creatureTexture,
        designMode,
        customDesign,
        clothingPrompt,
        aestheticStyle,
        params,
        selectedSkinColor,
      };
      localStorage.setItem('creatorState', JSON.stringify(payload));
    } catch (e) {
      // ignore quota errors; generation output is more important
      console.error('Failed to persist creatorState', e);
    }
  }, [activeCategory, gender, creatureTexture, designMode, customDesign, clothingPrompt, aestheticStyle, params, selectedSkinColor, defaultCreatorState]);

  const workwearPreviewPrompt = useMemo(() => {
    if (aestheticStyle !== 'Workwear') return '';
    return buildWorkwearStyleInstruction(eraStyleFromEraParam(params.era ?? 50), clothingPrompt);
  }, [aestheticStyle, params.era, clothingPrompt]);

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

  // Restore last generated NFT and metadata when returning to Creator
  useEffect(() => {
    try {
      const snap = getMintJobSnapshot();
      if (snap.status === 'running') setIsGenerating(true);
      if (snap.status === 'done' && snap.result?.imageDataUrl) {
        setIsGenerating(false);
        setGeneratedNFT(snap.result.imageDataUrl);
        setNftMetadata({ theme: snap.result.theme, rarity: snap.result.rarity });
        setNftData({
          image: snap.result.imageDataUrl,
          serialNumber: snap.result.serialNumber,
          isSpecial: snap.result.isSpecial,
          theme: snap.result.theme,
          prompt: snap.result.prompt,
          ...(snap.result.cosUrl ? { cosUrl: snap.result.cosUrl } : {}),
        });
      }

      const storedImg = localStorage.getItem('generatedNFT');
      if (storedImg) {
        setGeneratedNFT(storedImg);
      }
      const storedData = localStorage.getItem('generatedNFTData');
      if (storedData) {
        const parsed = JSON.parse(storedData) as Partial<CyberCollectionItem> | null;
        if (parsed && parsed.theme) {
          setNftMetadata((prev) => ({
            theme: parsed.theme || prev?.theme || 'High-Fashion Editorial',
            rarity: prev?.rarity || '普通',
          }));
        }
      }
    } catch (e) {
      console.error('Failed to restore Creator state', e);
    }
  }, []);

  useEffect(() => {
    const unsub = subscribeMintJob((snap) => {
      if (snap.status === 'running') {
        setIsGenerating(true);
        return;
      }
      if (snap.status === 'done' && snap.result) {
        setIsGenerating(false);
        setGeneratedNFT(snap.result.imageDataUrl);
        setNftMetadata({ theme: snap.result.theme, rarity: snap.result.rarity });
        setNftData({
          image: snap.result.imageDataUrl,
          serialNumber: snap.result.serialNumber,
          isSpecial: snap.result.isSpecial,
          theme: snap.result.theme,
          prompt: snap.result.prompt,
          ...(snap.result.cosUrl ? { cosUrl: snap.result.cosUrl } : {}),
        });
        return;
      }
      if (snap.status === 'error') {
        setIsGenerating(false);
      }
    });
    return () => unsub();
  }, []);

  // Define parameters based on active category
  const getActiveParams = (): ParameterSet[] => {
    switch (activeCategory) {
      case 'Body':
        return [
          { label: '肌肉', key: 'muscularity', value: params.muscularity },
          { label: '体型（瘦 → 壮）', key: 'heavy', value: params.heavy },
          { label: '身高 / 比例', key: 'proportions', value: params.proportions },
          { label: '头饰（简 → 繁）', key: 'jawline', value: params.jawline },
        ];
      case 'Style':
        return [
          { label: '色彩浓度（Chromaticity）', key: 'chromaticity', value: params.chromaticity },
          { label: '年代（复古 → 现代 / Era）', key: 'era', value: params.era },
          { label: '厚重（性感 → 厚重 / Thickness）', key: 'thickness', value: params.thickness },
          { label: '姿态（端正 → 大片 / Pose）', key: 'pose', value: params.pose ?? 50 },
        ];
      default:
        return [];
    }
  };

  const updateParam = (key: string, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const MAX_CUSTOM_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB
  const compressDataUrlForGeminiInline = async (dataUrl: string): Promise<string> => {
    // Only compress data URLs (base64 payload) to reduce /api/gemini request size.
    if (!dataUrl.startsWith('data:')) return dataUrl;

    const img = new Image();
    img.src = dataUrl;

    try {
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('load failed'));
      });
    } catch {
      return dataUrl;
    }

    const maxDim = 1024;
    const w0 = img.width || 1;
    const h0 = img.height || 1;
    const scale = Math.min(1, maxDim / Math.max(w0, h0));
    const w = Math.max(1, Math.round(w0 * scale));
    const h = Math.max(1, Math.round(h0 * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return dataUrl;

    ctx.drawImage(img, 0, 0, w, h);

    // Prefer WebP to shrink base64 size.
    try {
      const webp = canvas.toDataURL('image/webp', 0.82);
      if (webp) return webp;
    } catch {
      // ignore
    }

    try {
      return canvas.toDataURL('image/jpeg', 0.82);
    } catch {
      return dataUrl;
    }
  };

  const handleCustomUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'top' | 'bottom' | 'shoes',
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_CUSTOM_UPLOAD_BYTES) {
      alert('上传图片大小超过 10MB，请换小一点的图片后再试。');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const rawDataUrl = reader.result as string;
      const dataUrl = await compressDataUrlForGeminiInline(rawDataUrl);

      if (type === 'top') {
        setCustomTopImage(dataUrl);
        setIsAnalyzingTop(true);
      } else if (type === 'bottom') {
        setCustomBottomImage(dataUrl);
        setIsAnalyzingBottom(true);
      } else {
        setCustomShoesImage(dataUrl);
        setIsAnalyzingShoes(true);
      }

      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const base64Data = dataUrl.split(',')[1];
        const mimeType = dataUrl.split(';')[0].split(':')[1];

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: {
            parts: [
              {
                text: `Analyze this image of a clothing item (${type}). Provide a highly detailed, concise description of its design, color, material, graphics, cut, and specific details. Do not include any introductory text, just the description.`,
              },
              {
                inlineData: { data: base64Data, mimeType },
              },
            ],
          },
        });

        const desc = response.text?.trim() || `custom ${type} matching the reference image`;
        if (type === 'top') setCustomTopDesc(desc);
        else if (type === 'bottom') setCustomBottomDesc(desc);
        else setCustomShoesDesc(desc);
      } catch (error) {
        console.error(`Failed to analyze ${type} image`, error);
        const fallbackDesc = `custom ${type} matching the reference image`;
        if (type === 'top') setCustomTopDesc(fallbackDesc);
        else if (type === 'bottom') setCustomBottomDesc(fallbackDesc);
        else setCustomShoesDesc(fallbackDesc);
      } finally {
        if (type === 'top') setIsAnalyzingTop(false);
        else if (type === 'bottom') setIsAnalyzingBottom(false);
        else setIsAnalyzingShoes(false);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleModcardUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setModcardImage(base64);
      setIsAnalyzingModcard(true);
      setModcardDesc(null);

      try {
        const m = base64.match(/^data:([^;]+);base64,(.+)$/);
        if (!m) throw new Error('invalid data url');
        const desc = await generateGeminiText({
          parts: [
            {
              text: `This is a model comp card or modcard containing photos and biometric details of a fashion model. Please thoroughly analyze the model's appearance, facial features, demographic/ethnicity, age range, body structure/pose, hairstyle/haircolor, facial expression, and general vibe. Provide a highly detailed, concise English description (2-3 sentences) summarizing these specific physical traits and modeling vibe to be directly injected as character instructions in a downstream generative image AI prompt. Do not write introductory or concluding text, only return the descriptive character instruction itself, strictly in English.`,
            },
            { inlineData: { mimeType: m[1]!, data: m[2]! } },
          ],
          model: 'gemini-2.5-flash',
        });
        setModcardDesc(desc);
        triggerToast('MODCARD SPEC ANALYZED AND REGISTERED SUCCESSFULLY.');
      } catch (error) {
        console.error('Failed to analyze modcard image', error);
        setModcardDesc('Analysis failed. Fallback default high-end fashion model.');
        triggerToast('DECODING RUNWAY SPECS ENCOUNTERED AN ERROR.');
      } finally {
        setIsAnalyzingModcard(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClearModcard = () => {
    setModcardImage(null);
    setModcardDesc(null);
    triggerToast('MODCARD COUTURE NODE SYSTEM DEPROVISIONED.');
  };

  const handleHbaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setHbaImageBase64(reader.result as string);
    reader.readAsDataURL(file);
  };

  const generateNFT = async () => {
    const run = async (): Promise<MintJobResult> => {
      // Randomize traits for high variety
      const randomTheme = themes[Math.floor(Math.random() * themes.length)];
      const randomMaterial = materials[Math.floor(Math.random() * materials.length)];
      const randomStyle = styles[Math.floor(Math.random() * styles.length)];
      const rarities = ['普通', '不凡', '稀有', '史诗', '传奇', '神话'];
      const randomRarity = rarities[Math.floor(Math.random() * rarities.length)];

      const colorPalettes = ['Neon Pink & Cyan', 'Blood Orange & Slate', 'Electric Blue & Silver', 'Acid Green & Charcoal', 'Crimson & Gold', 'Lavender & Mint', 'Cyber Yellow & Black'];
      const randomColor = colorPalettes[Math.floor(Math.random() * colorPalettes.length)];

      setNftMetadata({ theme: randomTheme, rarity: randomRarity });

      // Map UI parameters to prompt instructions (sync with .upgrade13)
      const colorStyleBase =
        params.chromaticity > 70
          ? `The clothing features a bold, high-contrast color palette, prominently featuring ${randomColor}. The design can include tasteful prints or patterns, but they must be clean, premium, and elegant. Absolutely avoid overly dense, messy, chaotic, or "dirty" looking patterns. The background and skin tone must remain natural.`
          : params.chromaticity < 30
            ? 'The clothing is strictly monochrome, black, white, and grey. The background and skin tone must remain natural.'
            : `The clothing has subtle, elegant color accents of ${randomColor}. The background and skin tone must remain natural.`;
      const clothingPromptTrimmed = clothingPrompt.trim();
      const clothingPromptEnglish = clothingPromptTrimmed
        ? await translateClothingPromptToEnglish(clothingPromptTrimmed)
        : '';
      const eraStyle = eraStyleFromEraParam(params.era ?? 50);
      let finalStyleInstruction = `The aesthetic era is ${eraStyle}.`;
      if (aestheticStyle === 'Workwear') {
        finalStyleInstruction = buildWorkwearStyleInstruction(eraStyle, clothingPromptEnglish);
      } else if (aestheticStyle !== 'Default') {
        finalStyleInstruction += ` The specific aesthetic style MUST be highly influenced by: ${aestheticStyle}.`;
      }
      const thicknessStyle = params.thickness > 70
        ? 'heavy, multi-layered, oversized, protective, wearing many layers of clothing'
        : params.thickness < 30
          ? 'minimal clothing, revealing, bare skin, extremely lightweight'
          : 'standard balanced layering and amount of clothing';

      const complexHeadwearStyles = [
        'Dark Mecha: heavy mechanical full-face mask, intricate robotic parts, matte black and dark grey, exposed red wires, glowing sensor eyes, decal stickers, cybernetic mecha aesthetic',
        'Sleek Minimalist: sleek minimalist glossy black glass visor covering eyes, aerodynamic design, sci-fi minimalist',
        'Neon Cyberpunk: translucent orange futuristic visor and industrial headphones, neon light reflections, UI interface graphics on the glass, detailed mechanical textures',
        'Fantasy Cyber: stylized cybernetic kitsune mask on the side of the head, traditional elements fused with high-tech armor, intricate gold micro-chips, artistic cyberpunk'
      ];
      const randomComplexHeadwear = complexHeadwearStyles[Math.floor(Math.random() * complexHeadwearStyles.length)];

      const headwearArchetypes = [
        {
          core: 'bionic filigree implants and cybernetic facial decals',
          material: 'polished silver chrome and matte white ceramic',
          detail: 'ornate engravings and cybernetic face plates',
          style: 'avant-garde fashion, mechanical doll aesthetic',
        },
        {
          core: 'oni/kitsune half-mask with horns and tactical HUD goggles',
          material: 'matte white ceramic with glowing LED filaments',
          detail: 'exoskeleton ribs',
          style: 'cyber-samurai / cyber-ninja vibe',
        },
        {
          core: 'oversized translucent visor',
          material: 'translucent neon acrylic and digital glitch patterns',
          detail: 'integrated antennas',
          style: 'vaporwave / glitchcore style',
        },
        {
          core: 'mechanical chin guard and cybernetic ear-mounted sensors',
          material: 'carbon fiber and tech-mesh',
          detail: 'typography decals and warning labels',
          style: 'techwear aesthetic',
        },
      ];
      const selectedArchetype = headwearArchetypes[Math.floor(Math.random() * headwearArchetypes.length)];

      const retroComplexHeadwearStyles = [
        'Minimalist Noir: wide slightly transparent silk ribbon tied as a blindfold, dramatic shadows, chiaroscuro lighting, stark high contrast, minimalist aesthetic, elegant and cinematic',
        'Deconstructed Architecture: huge architectural pleated conical hat or structural headpiece, neutral and grey tones, deconstructed silhouette, high-fashion runway look, sharp editorial lighting, minimalist yet dramatic',
        'Vintage Glamour: extravagant vintage fashion hat with intricate netting, paired with oversized ornate retro earrings, classic haute couture styling, soft cinematic glamour lighting, elegant retro fashion portrait'
      ];
      const randomRetroComplexHeadwear = retroComplexHeadwearStyles[Math.floor(Math.random() * retroComplexHeadwearStyles.length)];

      const retroHeadwearArchetypes = [
        {
          core: 'silk ribbon blindfold',
          material: 'slightly transparent glossy silk and sheer velvet',
          detail: 'dramatic shadows and chiaroscuro lighting',
          style: 'gothic aesthetic, monochrome photography, elegant and cinematic',
        },
        {
          core: 'architectural wide-brimmed hat or pleated conical headpiece',
          material: 'sheer lace & mesh with exaggerated proportions',
          detail: 'hard studio lighting and sharp silhouettes',
          style: 'editorial photography, deconstructed silhouette, minimalist yet dramatic',
        },
        {
          core: '发簪与高发髻',
          material: 'sleek hair styled in a high bun with ornamental hairpin',
          detail: 'soft vintage glamour lighting',
          style: 'classic haute couture, elegant retro fashion portrait',
        },
      ];
      const selectedRetroArchetype = retroHeadwearArchetypes[Math.floor(Math.random() * retroHeadwearArchetypes.length)];

      let headwearDesc = '';
      if (params.era > 50) {
        if (params.jawline > 70) {
          headwearDesc = `complex headwear (${randomComplexHeadwear})`;
        } else if (params.jawline < 10) {
          headwearDesc = 'bareheaded, clean hair, no head accessories';
        } else if (params.jawline < 30) {
          headwearDesc = `subtle head accessory: ${selectedArchetype.core}`;
        } else if (params.jawline < 50) {
          headwearDesc = `moderate head accessory: ${selectedArchetype.core} made of ${selectedArchetype.material}`;
        } else {
          headwearDesc = `detailed head accessory: ${selectedArchetype.core} made of ${selectedArchetype.material}, featuring ${selectedArchetype.detail}, ${selectedArchetype.style}`;
        }
      } else {
        if (params.jawline > 70) {
          headwearDesc = `complex headwear (${randomRetroComplexHeadwear})`;
        } else if (params.jawline < 10) {
          headwearDesc = 'bareheaded, clean hair, no head accessories';
        } else if (params.jawline < 30) {
          headwearDesc = `subtle head accessory: ${selectedRetroArchetype.core}`;
        } else if (params.jawline < 50) {
          headwearDesc = `moderate head accessory: ${selectedRetroArchetype.core} made of ${selectedRetroArchetype.material}`;
        } else {
          headwearDesc = `detailed head accessory: ${selectedRetroArchetype.core} made of ${selectedRetroArchetype.material}, featuring ${selectedRetroArchetype.detail}, ${selectedRetroArchetype.style}`;
        }
      }
      // Fix for "heavy" causing bare chests: Explicitly state "fully clothed" unless thickness is very low
      const chestCoverage = params.thickness < 30 ? '' : 'fully clothed with chest completely covered';
      const buildDesc = params.heavy < 40 ? `very skinny and slender, ${chestCoverage}` : params.heavy > 80 ? `heavy-set, plus-size, and broad, ${chestCoverage}` : `normal, average build, ${chestCoverage}`;
      const isTanBio = selectedSkinColor === '#E0AC69';

      // Avatar / creature keywords — aligned with `.upgrade12/views/Creator.tsx`
      let creatureTextureDesc = '';
      let creatureSpecialInstructions = '';
      if (creatureTexture === 'Hairless') {
        const hairlessSubStyles = [
          'Bio-mechanical/Cybernetic: Neo-minimalist biomechanical, Cyber-Gothic. Hairless bionic humanoid creature, faceless white ceramic head, sleek aerodynamic exoskeleton. Exposed intricate internal wires, carbon fiber body, sharp aggressive spikes, glowing optic slits. High-fashion techwear, flowing black capes, tactical robes, carrying katana, minimalist aesthetic. Clean gray studio background, cinematic rim lighting, high contrast (Black and White dominance). DO NOT INCLUDE: human skin, human face, eyes, nose, mouth, hair, fur, organic texture, colorful, messy, low-tech, rustic.',
          'Ethereal Divinity: Highly sacred and divine presence. The creature has translucent skin with a gel-like white surface, while the inner color glows with the selected skin tone. Large, expressive, and divine eyes. Majestic horns, gold filigree, surreal fantasy, ethereal atmosphere.',
          'Avant-garde/Fabric: striking hairless feline facial structure, sleek Sphynx cat face shape and skin texture, optional delicate lace veil (non-essential element), textile textures, fashion editorial, high contrast, mysterious cat-like features, cat ears silhouette.',
        ];
        const selectedHairlessStyle = hairlessSubStyles[Math.floor(Math.random() * hairlessSubStyles.length)];
        creatureTextureDesc = `Sleek hairless creature, humanoid monster, avant-garde style, biomechanical or ethereal details, intricate headpiece. Sub-style: ${selectedHairlessStyle}`;
        creatureSpecialInstructions =
          'CRITICAL CREATURE INSTRUCTION: Absolutely NO fur, NO fluffy textures. The overall color palette should be constrained to black, white, and grey, but allow the selected skin tone to act as a vibrant inner glow or accent. Lighting MUST be studio lighting with sharp rim light against a minimalist grey or white background.';
      } else {
        creatureTextureDesc =
          'Covered in high-fashion, meticulously groomed fur or hair. A majestic, beast-like humanoid with a powerful, primal yet elegant runway presence.';
      }

      const poseVal = params.pose ?? 50;
      const poseStyle =
        poseVal < 30
          ? 'The character is in a strictly upright, straight, completely symmetrical, flat-facing, rigid standing passport-like or catalog-style modeling posture, with both arms straight down naturally by their sides, simple, static, and formal standing pose with zero exaggeration'
          : poseVal > 70
            ? 'The character is striking a dramatic full-body editorial runway pose (entire body head-to-toe still fully visible in frame), with dynamic silhouette and off-center posture — never a tight portrait crop'
            : 'The character is standing in a standard elegant, poised, professional fashion model posture, a confident semi-dynamic posture with subtle natural angles and classic lookbook poise';

      let characterDesc =
        gender === 'Creature'
          ? `A unique, otherworldly creature (alien, mutant, or bio-engineered humanoid). Texture/Vibe: ${creatureTextureDesc}. Size/Proportions: ${params.proportions > 70 ? 'Massive and imposing' : params.proportions < 30 ? 'Small and agile' : 'Medium build'}. Build: ${buildDesc}. Headwear: ${headwearDesc}. Pose: ${poseStyle}. ${creatureSpecialInstructions}`
          : `A stylish ${gender.toLowerCase()} fashion model${isTanBio ? ' with East Asian facial features' : ''}. Body type: ${params.muscularity > 70 ? 'muscular' : 'lean'} and ${buildDesc}. Height: ${params.proportions > 70 ? 'Tall stature' : params.proportions < 30 ? 'Short stature' : 'Average height'}. Headwear: ${headwearDesc}. Pose: ${poseStyle}.`;

      if (gender !== 'Creature' && modcardDesc) {
        characterDesc = `THE ABSOLUTE MODEL IDENTITY MANDATE: The model's entire appearance, gender, demographic ethnicity, precise facial features, bone structure, eyes, nose, lips, hair, hairstyle, hair color, age, facial expression, and skin tone MUST PERFECTLY and EXCLUSIVELY replicate the exact person shown in the uploaded modcard and described here: "${modcardDesc}". Keep all biometric details of this real human model perfectly intact and unchanged. You are strictly forbidden from generating any generic or secondary models; this specific model must be the one dressed in the specified clothing.`;
      }

      const aimShoeDesc =
        'black high-top chunky boots with a prominent silver side zipper, thick ridged platform sole, black laces, and a contrasting light grey toe cap';
      const hbaHoodieDesc =
        "black double-layered hoodie with hood up. Outer layer has short sleeves with raw frayed edges over long black sleeves. Features white graphics: 'ANZIMA RACING' outlined text logo on chest, checkered flag graphic, circular logo, and a symmetrical tribal graphic on the front kangaroo pocket. Black drawstrings with silver metal tips and silver metal rivets on the pocket corners";
      const topDesc =
        customDesign.top === 'HBA'
          ? `${hbaHoodieDesc}, exactly matching the reference`
          : customDesign.top === 'Custom'
            ? `${customTopDesc || 'custom top matching the reference image'}, exactly matching the reference`
            : customDesign.top;
      const bottomDesc =
        customDesign.bottom === 'Custom'
          ? `${customBottomDesc || 'custom bottom matching the reference image'}, exactly matching the reference`
          : customDesign.bottom;
      const shoesDesc =
        customDesign.shoes === 'aim'
          ? `${aimShoeDesc}, exactly matching the reference`
          : customDesign.shoes === 'Custom'
            ? `${customShoesDesc || 'custom shoes matching the reference image'}, exactly matching the reference`
            : customDesign.shoes;
      let outfitDesc =
        designMode === 'Custom'
          ? `Outfit consists of: Top - ${topDesc}, Bottom - ${bottomDesc}, Footwear - ${shoesDesc}.`
          : `Outfit: Fashion-forward avant-garde clothing made of ${randomMaterial}.`;

      if (clothingPromptEnglish && aestheticStyle !== 'Workwear') {
        outfitDesc += ` The specific garment designs, styles, cuts, features, graphics, patterns, fabrics, and design details MUST exactly match the user's custom instructions: "${clothingPromptEnglish}". Prioritize this style instruction above all standard randomisations to execute exactly the design specified by the user.`;
      }

      const isSpecial = true;
      let normalCount = parseInt(localStorage.getItem('normalMintCount') || '0', 10);
      let specialCount = parseInt(localStorage.getItem('specialMintCount') || '0', 10);

      let serialNumber = '';
      if (isSpecial) {
        specialCount += 1;
        localStorage.setItem('specialMintCount', specialCount.toString());
        serialNumber = `Sp.${specialCount.toString().padStart(5, '0')}`;
      } else {
        normalCount += 1;
        localStorage.setItem('normalMintCount', normalCount.toString());
        serialNumber = `No.${normalCount.toString().padStart(8, '0')}`;
      }

      const sceneStyleInstruction = `Scene styling: lighting setup "${lightingStyle}", background theme "${backgroundTheme}", camera/grain filter "${grainFilter}", reference image influence weight ${refImageWeight}%.`;

      const backgroundInstruction = isSpecial
        ? `The background MUST be a solid, vibrant color field only (no patterns, no signage, no typography) that contrasts or harmonizes with the clothing. Do not use plain white or grey unless it enhances the outfit. ${sceneStyleInstruction}`
        : `Minimal clean studio backdrop aligned with theme "${backgroundTheme}". Absolutely no typography, posters, signage, or readable text in the environment. ${sceneStyleInstruction}`;

      const fullBodyFramingInstruction =
        'FRAMING (NON-NEGOTIABLE): Single character, full-length full-body photograph — entire person visible from top of head to feet (toes/shoes fully in frame). Camera pulled back for a large heroic full-body editorial shot with modest padding above the head and below the feet. NOT half-body, NOT waist-up, NOT knee-up crop, NOT missing feet, NOT close-up portrait.';

      const noBackgroundTextInstruction =
        'BACKGROUND TEXT BAN (NON-NEGOTIABLE): The background and scene must contain NO readable text, NO typography, NO floating labels, NO captions, NO watermarks, NO QR codes, NO barcodes, NO UI overlays, NO poster words, and NO environmental signage. Garment logos/graphics on clothing are allowed only when required by the outfit or reference garment — never as background elements.';

      const outputPromptGuards =
        '\n\n=== OUTPUT REQUIREMENTS (HIGHEST PRIORITY — OVERRIDES ANY CONFLICTING STYLE ABOVE) ===\n' +
        '1) FULL BODY ONLY: Exactly one person, photographed head-to-toe with BOTH feet/shoes completely visible. Use a wide camera distance (3/4 to full-body fashion distance). NEVER waist-up, NEVER chest-up, NEVER knee-up crop, NEVER portrait close-up, NEVER cropped legs or missing feet.\n' +
        '2) BACKGROUND: Plain studio backdrop (solid color or soft neutral gradient) ONLY. Absolutely NO readable letters, words, signs, posters, magazine layouts, captions, titles, watermarks, QR codes, barcodes, or UI overlays anywhere in the image.\n' +
        '3) NO graphic-design text layouts, editorial typography, or environmental signage — fashion photo only.\n';
      let complexRetroKeywords = '';
      if (params.thickness > 80 && params.era < 50) {
        complexRetroKeywords =
          '\n' +
          'CRITICAL STYLE OVERRIDE (High Complexity Retro):\n' +
          '- Concept & Style: Deconstruction (breaking traditional clothing structures, asymmetrical elegance, flowing overlapping panels, and sophisticated tailoring), Modern Hanbok / Neo-Traditional (blending traditional Eastern classical clothing like cross collars and large skirts with modern streetwear), Wasteland / Cyberpunk (rugged doomsday survival feel with futuristic tech rebellion), Maximalism (rich layers, stacked elements, rejecting minimalism).\n' +
          '- Silhouette & Cut: Oversized / Voluminous (exaggerated fluffiness, extreme spatial presence and aura), Multi-layered (multiple layers of fabric stacked inside and out, adding heaviness, 3D structure, and dynamic beauty when walking), Cinched High Waist (emphasized high waistline with a wide belt, straps, or metal chains to elongate the lower body proportions).';
      }

      // Special Design options (from .upgrade6)
      const usesSpecialDesignPrompts =
        designMode === 'Custom' &&
        (customDesign.top === 'HBA' ||
          customDesign.top === 'Custom' ||
          customDesign.bottom === 'Custom' ||
          customDesign.shoes === 'aim' ||
          customDesign.shoes === 'Custom');

      const colorStyle = usesSpecialDesignPrompts
        ? 'Do NOT recolor or add colored trims/piping/stitching to the referenced garments. Keep the garment colors and graphics exactly as the reference (no extra neon accents).'
        : colorStyleBase;

      const overlayInstruction = '';

      const customFramingInstruction =
        designMode === 'Custom' &&
        (customDesign.top === 'HBA' ||
          customDesign.top === 'Custom' ||
          customDesign.bottom === 'Custom' ||
          customDesign.shoes === 'aim' ||
          customDesign.shoes === 'Custom')
          ? 'Reference try-on: keep the character centered; preserve full head-to-toe visibility with no head or feet cut-off.'
          : '';

      const isEraFuturisticHuman = params.era > 95 && gender !== 'Creature';

      let prompt: string;
      if (isEraFuturisticHuman) {
        // 1. Clothing Branches
        const clothingBranches = [
          'Sleek Bodysuits: Cybernetic bodysuit, sleek tactical skin, paneling details, high-tech compression suit.',
          'Heavy Techwear: Oversized techwear jacket, hakama-style pants, tactical gear, asymmetrical silhouettes, cyber-samurai armor.',
          'Experimental Fabrics: Translucent PVC raincoat, glowing optic fibers, plissé fabric, ethereal flowing drapes.'
        ];
        const selectedClothingBranch = clothingBranches[Math.floor(Math.random() * clothingBranches.length)];

        // 2. Character Identity
        const characterIdentity = 'Artificial Beauty: porcelain-like clean skin, cold and detached expression, sharp or lifeless eyes (inorganic feel). Cyborg/Android: partial precision mechanical embedding, such as mechanical devices on the ears, neck interfaces, or mechanized lower legs. Hairstyle: minimalist silver-white short hair, sleek bob, or completely enclosed by a high-tech helmet.';

        // 3. Material Definition
        const materialDefinition =
          'Materials: Polished enamel, matte carbon fiber, liquid-like PVC, high-density nylon, iridescent fabric.';

        // 4. Composition
        const composition =
          'Composition: High-fashion editorial full-body photography, minimalist clean studio background (no text), sharp rim lighting, cinematic depth of field, single subject centered in frame.';

        // 5. Stylized Keywords
        const stylizedKeywordsOptions = [
          'Ethereal Fashion: Translucent textures, pastel glowing neon, volumetric smoke, airy, delicate but futuristic.',
          'Combat Mecha: Mecha-arms, sleek katana, heavy plating, industrial straps, dark techwear aesthetic.',
          'Minimalist Android: Pure white aesthetic, porcelain skin, sleek exoskeleton, surgical precision, elegant silence.',
        ];
        const selectedStylizedKeywords =
          stylizedKeywordsOptions[Math.floor(Math.random() * stylizedKeywordsOptions.length)];

        // 6. Color Control
        const colorControl = 'Color Palette: [Main: White/Black/Grey] + [Accent: Electric Blue/Neon Green/Cherry Blossom Pink]. NO messy colors. (monochromatic base:1.3), (single neon accent color:1.2).';

        // 7. Detail Density
        const detailDensity =
          '(intricate mechanical joints:1.2), (complex garment construction:1.1), (minimalist overall look:1.1).';

        prompt =
          `A professional high-end luxury fashion NFT.\n` +
          `Theme: Futuristic Techwear Aesthetic and Cyber-Avant-Garde.\n` +
          `${composition}\n` +
          `${fullBodyFramingInstruction}\n` +
          `${noBackgroundTextInstruction}\n` +
          `Character: A highly advanced humanoid model. ${characterIdentity} Skin tone: ${selectedSkinColor}. Pose/Posture: ${poseStyle}.\n` +
          `Style Influences: ${finalStyleInstruction}\n` +
          (customFramingInstruction ? `${customFramingInstruction}\n` : '') +
          `Background: ${backgroundInstruction}\n` +
          `Outfit: ${selectedClothingBranch} ${outfitDesc}\n` +
          `${materialDefinition}\n` +
          `Style Keywords: ${selectedStylizedKeywords}\n` +
          `Colors: ${colorControl}\n` +
          `Details: ${detailDensity}\n` +
          `CRITICAL AESTHETIC INSTRUCTION: The image MUST look like a high-end real photograph. Holographic, iridescent, or reflective materials are allowed, but they MUST look like real physical fabrics photographed in a studio, NOT like a digital illustration, 3D render, or hand-drawn art. Avoid overly dense, messy, or chaotic fabric patterns. Use premium material textures.\n` +
          `CRITICAL LIGHTING AND PRODUCT INSTRUCTION: All clothing items (especially the top and shoes) MUST perfectly blend with the scene's lighting, BUT their core design, graphics, logos, and structure MUST NOT BE ALTERED from the provided reference images. This is a strict virtual try-on: the reference garments must be preserved pixel-for-pixel in terms of design, only adapting to the character's pose and lighting.\n` +
          `The overall vibe is clean high-fashion editorial photography, premium and modern, photoreal studio look.\n` +
          `${complexRetroKeywords}`;
      } else if (gender === 'Female' && params.era >= 0 && params.era <= 20) {
        prompt =
          `A professional ${randomStyle} for a high-end luxury fashion NFT. Avant-garde fashion photography, high-fashion editorial full-body shot of a woman.\n` +
          `Theme: ${randomTheme}.\n` +
          `${fullBodyFramingInstruction}\n` +
          `${noBackgroundTextInstruction}\n` +
          `Style: Maximalist aesthetic, textile art, Japanese avant-garde style. ${finalStyleInstruction}\n` +
          `Character & Headpiece: ${characterDesc} Porcelain skin, bold red lips. Skin tone: ${selectedSkinColor}. Pose & Posture: ${poseStyle}.\n` +
          (customFramingInstruction ? `${customFramingInstruction}\n` : '') +
          `Clothing & Texture: elegant drapery, sophisticated color-blocking, Bold geometric patterns mixed with floral motifs, exaggerated high collar. The clothing layering and amount is ${thicknessStyle}.\n` +
          `${outfitDesc}\n` +
          `Environment & Lighting: ${backgroundInstruction} Studio lighting, sharp focus, high contrast.\n` +
          `${overlayInstruction}` +
          `Color Palette: ${colorStyle}. Core color logic MUST feature highly saturated colors contrasted with black and white.\n` +
          `CRITICAL AESTHETIC INSTRUCTION: The image MUST look like a high-end real photograph. Holographic, iridescent, or reflective materials are allowed, but they MUST look like real physical fabrics photographed in a studio, NOT like a digital illustration, 3D render, or hand-drawn art. Use premium material textures.\n` +
          `CRITICAL LIGHTING AND PRODUCT INSTRUCTION: All clothing items (especially the top and shoes) MUST perfectly blend with the scene's lighting, BUT their core design, graphics, logos, and structure MUST NOT BE ALTERED from the provided reference images. This is a strict virtual try-on: the reference garments must be preserved pixel-for-pixel in terms of design, only adapting to the character's pose and lighting.\n` +
          `The overall vibe is "Avant-garde Maximalism", highly detailed, 8k resolution.\n` +
          `${complexRetroKeywords}`;
      } else {
        prompt =
          `A professional ${randomStyle} for a high-end luxury fashion NFT.\n` +
          `Theme: ${randomTheme}.\n` +
          `The composition is a single, unified full-frame image featuring exactly ONE character. Do NOT generate split screens, collages, multi-panel layouts, or separate detail shots.\n` +
          `${fullBodyFramingInstruction}\n` +
          `${noBackgroundTextInstruction}\n` +
          `Background: ${backgroundInstruction}\n` +
          `Character: ${characterDesc} Pose/Posture: ${poseStyle}.\n` +
          (customFramingInstruction ? `${customFramingInstruction}\n` : '') +
          `${outfitDesc}\n` +
          `${overlayInstruction}` +
          `Colors & Textures: ${colorStyle}. ${finalStyleInstruction} The clothing layering and amount is ${thicknessStyle}.\n` +
          `Skin tone: ${selectedSkinColor}.\n` +
          `Photography & Quality: High-end luxury fashion photography, haute couture, sophisticated tailoring. Studio lighting, soft shadows, photorealistic, 8k uhd, sharp focus, realistic skin texture.\n` +
          `CRITICAL AESTHETIC INSTRUCTION: The image MUST look like a high-end real photograph. Holographic, iridescent, or reflective materials are allowed, but they MUST look like real physical fabrics photographed in a studio, NOT like a digital illustration, 3D render, or hand-drawn art. Avoid overly dense, messy, or chaotic fabric patterns. Use premium material textures.\n` +
          `CRITICAL LIGHTING AND PRODUCT INSTRUCTION: All clothing items (especially the top and shoes) MUST perfectly blend with the scene's lighting, BUT their core design, graphics, logos, and structure MUST NOT BE ALTERED from the provided reference images. This is a strict virtual try-on: the reference garments must be preserved pixel-for-pixel in terms of design, only adapting to the character's pose and lighting.\n` +
          `The overall vibe is clean high-fashion editorial photography, premium and modern, photoreal studio look.\n` +
          `${complexRetroKeywords}`;
      }

      const parts: GeminiPart[] = [];

      const dataUrlToInlinePart = (dataUrl: string) => {
        const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (!m) return null;
        return { inlineData: { mimeType: m[1]!, data: m[2]! } } as GeminiPart;
      };

      if (gender !== 'Creature' && modcardImage && modcardDesc) {
        const inline = dataUrlToInlinePart(modcardImage);
        if (inline && 'inlineData' in inline) {
          parts.push({
            text: 'CRITICAL IDENTITY MANDATE - USE THIS EXACT MODEL: The following image is the EXACT modcard representing the model. You MUST replicate this model\'s exact face, features, hair, skin tone, gender, expression, and ethnic identity. Do not invent a generic avatar.',
          });
          parts.push(inline);
        }
      }

      // Add 'HBA' top reference if selected (user-uploaded image)
      if (designMode === 'Custom' && customDesign.top === 'HBA') {
        if (hbaImageBase64) {
          const inline = dataUrlToInlinePart(hbaImageBase64);
          if (inline && 'inlineData' in inline) {
            parts.push({
              text:
                'VIRTUAL TRY-ON TASK - GARMENT 1 (TOP): The following image shows the EXACT hoodie the character must wear. DO NOT redesign it. DO NOT alter the colors, text, logos, graphics, stitching colors, or cut. Do NOT add colored piping/edges/neon accents. Preserve the hoodie 100% identical to the reference.',
            });
            parts.push(inline);
          } else {
            parts.push({
              text: `CRITICAL INSTRUCTION: The character MUST wear the exact hoodie described: ${hbaHoodieDesc}. The design, shape, graphics, and details of this hoodie must be perfectly replicated on the character.`,
            });
          }
        } else {
          parts.push({
            text: `CRITICAL INSTRUCTION: The character MUST wear the exact hoodie described: ${hbaHoodieDesc}. Do NOT recolor it and do NOT add colored trims/piping/stitching. The design, shape, graphics, and details of this hoodie must be perfectly replicated on the character.`,
          });
        }
      }

      // Add 'Custom' top reference (upload) if selected
      if (designMode === 'Custom' && customDesign.top === 'Custom' && customTopImage) {
        const inline = dataUrlToInlinePart(customTopImage);
        if (inline && 'inlineData' in inline) {
          parts.push({
            text:
              'VIRTUAL TRY-ON TASK - GARMENT 1 (TOP): The following image shows the EXACT top the character must wear. DO NOT redesign it. DO NOT alter the text, logos, graphics, or cut. You MUST preserve the exact graphics, exact cut, exact textures, and exact proportions. If the image shows a mannequin, replace the mannequin with the character described later, but leave the top 100% untouched and identical to this reference.',
          });
          parts.push(inline);
        }
      }

      // Add 'Custom' bottom reference (upload) if selected
      if (designMode === 'Custom' && customDesign.bottom === 'Custom' && customBottomImage) {
        const inline = dataUrlToInlinePart(customBottomImage);
        if (inline && 'inlineData' in inline) {
          parts.push({
            text:
              'VIRTUAL TRY-ON TASK - GARMENT 2 (BOTTOM): The following image shows the EXACT bottom the character must wear. DO NOT redesign it. DO NOT alter the text, logos, graphics, or cut. You MUST preserve the exact graphics, exact cut, exact textures, and exact proportions. If the image shows a mannequin, replace the mannequin with the character described later, but leave the bottom 100% untouched and identical to this reference.',
          });
          parts.push(inline);
        }
      }

      // Add 'aim' shoe reference if selected (fixed reference URL)
      if (designMode === 'Custom' && customDesign.shoes === 'aim') {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 8000);
          const resp = await fetch(
            'https://lh3.googleusercontent.com/aida-public/AB6AXuD--GjfU0623yeRTQGDPufUFR_AcyGbJCkDdfYQhfa33Z6nvca-1TOXhrwFVg2N5RiCHhhy3LLnHiNPE21vAD5DcA2Ybgp58Awi8kx4HgdooY_0bSzEqpbjpS_-iChDaVB9XFOMF0XySUyr9DnLfvAKLRMLpUF0--s_ZQjd6bE-PCd32yRsBhZZlVXDlRTVcQxdS8H7_Soy7rKtHqLCBYjz1d1plDnlgiynjzy3CuJtVjDwjEZDYaBtic2CIRWiQ6BOaehZHTtoXjrT',
            { signal: controller.signal },
          );
          clearTimeout(timeout);
          if (resp.ok) {
            const blob = await resp.blob();
            const dataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(String(reader.result || ''));
              reader.onerror = () => reject(new Error('read fail'));
              reader.readAsDataURL(blob);
            });
            const inline = dataUrlToInlinePart(dataUrl);
            if (inline && 'inlineData' in inline) {
              parts.push({
                text: `VIRTUAL TRY-ON TASK - GARMENT 3 (SHOES): The following image shows the EXACT shoes the character must wear (${aimShoeDesc}). DO NOT change their design. Copy the shoes exactly onto the character's feet.`,
              });
              parts.push(inline);
            }
          }
        } catch (e) {
          console.warn('Failed to fetch aim shoe reference image', e);
        }
      } else if (designMode === 'Custom' && customDesign.shoes === 'Custom' && customShoesImage) {
        const inline = dataUrlToInlinePart(customShoesImage);
        if (inline && 'inlineData' in inline) {
          parts.push({
            text: 'VIRTUAL TRY-ON TASK - GARMENT 3 (SHOES): The following image shows the EXACT shoes the character must wear. DO NOT change their design. Copy the shoes exactly as they appear in the reference image onto the character\'s feet.',
          });
          parts.push(inline);
        }
      }

      const hasReferenceImages = parts.some((p) => 'inlineData' in p);
      if (hasReferenceImages) {
        parts.unshift({
          text:
            'VIRTUAL TRY-ON OUTPUT RULES: Reference images are for GARMENT DESIGN ONLY — do NOT copy their crop, framing, or background. You MUST output a NEW full-body head-to-toe photo (both feet visible) on a plain text-free studio background.',
        });
      }

      // Finally, add the main prompt text (guards at end for recency bias)
      parts.push({ text: prompt + outputPromptGuards });

      const imgData = await generateGeminiImage({
        parts,
        model: usesSpecialDesignPrompts ? 'gemini-3.1-flash-image-preview' : 'gemini-2.5-flash-image',
        aspectRatio: '9:16',
      });

      const compressForStorage = async (dataUrl: string) => {
        try {
          if (!dataUrl.startsWith('data:')) return dataUrl;
          const img = new Image();
          img.src = dataUrl;
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('load failed'));
          });
          const size = 2048;
          const srcW = img.width || 1;
          const srcH = img.height || 1;

          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (!ctx) return dataUrl;

          // Preserve full content using letterbox (no center-crop),
          // so the head/top never gets cut off by post-processing.
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, size, size);

          const scale = Math.min(size / srcW, size / srcH);
          const dw = Math.max(1, Math.round(srcW * scale));
          const dh = Math.max(1, Math.round(srcH * scale));
          const dx = Math.round((size - dw) / 2);
          const dy = Math.round((size - dh) / 2);
          ctx.drawImage(img, dx, dy, dw, dh);

          try {
            const webp = canvas.toDataURL('image/webp', 0.82);
            if (webp) return webp;
          } catch {
            // ignore
          }
          return canvas.toDataURL('image/jpeg', 0.82);
        } catch {
          return dataUrl;
        }
      };

      const storedImg = await compressForStorage(imgData);
      setGeneratedNFT(storedImg);
      localStorage.setItem('generatedNFT', storedImg);

      // IMPORTANT (mobile performance + cross-device safety):
      // - Do NOT block the UI/mint job on network uploads or DB writes.
      // - Do NOT use serialNumber as the COS object key (it collides across devices and causes "other users' images" to appear).
      //   Use a unique filename instead, while keeping serialNumber as metadata in the profile/db.
      void (async () => {
        const pendingKey = 'axon:pending-mint-sync';
        let oneKUrl: string | undefined;
        try {
          // Mobile-friendly: upload a smaller image (1024 max) to avoid request-size limits.
          const uploadImg = await (async () => {
            try {
              const resp = await fetch(storedImg);
              const blob = await resp.blob();
              const bmp = await createImageBitmap(blob);
              const maxDim = 1024;
              const scale = Math.min(1, maxDim / Math.max(bmp.width || 1, bmp.height || 1));
              const w = Math.max(1, Math.round((bmp.width || 1) * scale));
              const h = Math.max(1, Math.round((bmp.height || 1) * scale));
              const canvas = document.createElement('canvas');
              canvas.width = w;
              canvas.height = h;
              const ctx = canvas.getContext('2d');
              if (!ctx) return storedImg;
              ctx.drawImage(bmp, 0, 0, w, h);
              try {
                const webp = canvas.toDataURL('image/webp', 0.82);
                if (webp) return webp;
              } catch {
                // ignore
              }
              return canvas.toDataURL('image/jpeg', 0.82);
            } catch {
              return storedImg;
            }
          })();

          const uniqueSuffix = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
          const fileName = `${serialNumber.replace(/\./g, '_')}_${uniqueSuffix}.webp`;
          oneKUrl = await uploadImageToCloudBase(uploadImg, { prefix: 'MINT/', fileName });
        } catch (e) {
          console.error('Upload 2K image failed', e);
          try {
            localStorage.setItem(pendingKey, JSON.stringify({ serialNumber, createdAt: Date.now(), dataUrl: storedImg }));
          } catch {
            // ignore storage quota errors
          }
          // On mobile, users won't see console; surface a minimal hint.
          alert('上传失败：该 NFT 暂未同步到 Wardrobe。请稍后在 Wardrobe 中重试同步，或检查登录状态/网络。');
          return;
        }

        try {
          await addNftToMyProfile({ cosUrl: oneKUrl, serialNumber, source: 'mint' });
          try {
            localStorage.removeItem(pendingKey);
          } catch {
            // ignore
          }
          window.dispatchEvent(new Event('axon:collection-updated'));
        } catch (e) {
          console.error('Failed to record minted NFT in profile', e);
          try {
            localStorage.setItem(pendingKey, JSON.stringify({ serialNumber, createdAt: Date.now(), cosUrl: oneKUrl }));
          } catch {
            // ignore
          }
          const msg = e instanceof Error ? e.message : String(e);
          if (msg.includes('NOT_SIGNED_IN')) {
            onNavigate?.(View.AUTH);
            alert('请先登录以同步到 Wardrobe。');
          } else if (msg.includes('PROFILE_CREATE_VERIFY_FAILED')) {
            alert(
              '图片已上传，但用户档案读回失败。请确认已登录，并在云开发检查 user_profiles 集合与安全规则（需允许当前用户读写自己的文档）。稍后在衣橱重试同步。',
            );
          } else {
            alert('同步到 Wardrobe 失败，请稍后在 Wardrobe 中重试同步。');
          }
        }

        try {
          const r = await fetch('/api/analyze-outfit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl: oneKUrl }),
          });
          const t = await r.text();
          const data = t ? (JSON.parse(t) as any) : {};
          if (r.ok && data?.info) {
            await upsertImageInfo({ serialNumber, imageUrl: oneKUrl, source: 'mint', info: data.info });
          } else {
            console.warn('Outfit analysis skipped', { status: r.status, error: data?.error });
          }
        } catch (e) {
          console.warn('Outfit analysis failed (non-blocking)', e);
        }
      })();

      // 2K 放大仅在 Wardrobe 内点击“生成 2K”时执行，避免移动端铸造流程被网络/云托管卡住。
      const cosUrl: string | undefined = undefined;

      const nftDataObj: CyberCollectionItem = {
        ownerUid: ((await getCloudbaseAuth().getCurrentUser()) as any)?.uid,
        image: storedImg,
        serialNumber,
        isSpecial,
        theme: randomTheme,
        prompt,
        ...(cosUrl ? { cosUrl } : {}),
      };
      setNftData(nftDataObj);
      localStorage.setItem('generatedNFTData', JSON.stringify(nftDataObj));

      // Notify pages (e.g. Admin "management test") that rely on generatedNFTData / generatedNFT.
      try {
        window.dispatchEvent(new Event('axon:generated-nft-updated'));
      } catch {
        // ignore
      }

      try {
        const collectionStr = localStorage.getItem('myCyberCollection');
        const collection = collectionStr ? (JSON.parse(collectionStr) as CyberCollectionItem[]) : [];
        const MAX_ITEMS = 8;
        const trimmed = collection.slice(0, MAX_ITEMS - 1);
        const next = [nftDataObj, ...trimmed];
        localStorage.setItem('myCyberCollection', JSON.stringify(next));
        setMyCyberCollection(next);
        triggerToast('NEW COUTURE MINTED AND ADDED TO WARDROBE VAULT.');
        window.dispatchEvent(new Event('axon:collection-updated'));
      } catch (e) {
        console.error('Error saving to collection', e);
        try {
          // Still notify Wardrobe/TryOn to re-read generatedNFTData at least
          window.dispatchEvent(new Event('axon:collection-updated'));
        } catch {
          // ignore
        }
      }
      return {
        imageDataUrl: storedImg,
        serialNumber,
        isSpecial,
        theme: randomTheme,
        rarity: randomRarity,
        prompt,
        cosUrl,
      };
    };

    setIsGenerating(true);
    try {
      await startMintJob(run);
    } catch (error) {
      console.error('Error generating NFT:', error);
      setIsGenerating(false);
    }
  };


  return (
    <div className="relative min-h-screen bg-[#FAF9F6] text-black selection:bg-primary selection:text-black">
      <div className="fixed inset-0 pointer-events-none -z-20 overflow-hidden">
        <div className="absolute top-[10%] right-[20%] w-[50%] h-[50%] bg-[#D4FF00]/5 blur-[150px] rounded-full"></div>
      </div>

      <header className="relative z-50 px-8 lg:px-16 pt-10 flex justify-between items-center mb-10 select-none">
        <div className="flex items-baseline gap-6 font-sans">
          <div>
            <span className="text-[10px] font-black uppercase text-[#D4FF00] bg-black px-2.5 py-0.5 rounded tracking-[0.35rem] block leading-none">AXON LABS</span>
            <h1 className="font-future font-black text-2xl leading-none text-black tracking-widest uppercase mt-2 font-display">NFT 铸造</h1>
          </div>
          <div className="h-6 w-px bg-black/15 hidden md:block"></div>
          <p className="text-[9px] tracking-[0.3em] uppercase text-black/45 font-bold leading-none hidden md:block font-sans">COLLECTION VOLUME V.2</p>
        </div>

        <div className="flex items-center gap-6">
          <span className="text-[9px] font-mono text-black/45 tracking-widest hidden lg:block uppercase">[ BLOCKCHAIN NODES ACTIVATED ]</span>
          <button
            type="button"
            onClick={() => onNavigate?.(View.AUTH)}
            className="group flex items-center gap-3 bg-white hover:bg-neutral-100 border border-black/10 rounded-full pl-5 pr-2 py-1.5 transition-all text-[9.5px] uppercase tracking-widest font-black active:scale-95 shadow-sm text-black"
          >
            <span>Network Node</span>
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-black/10 group-hover:border-primary/50 transition-colors">
              <img src={avatarUrl || 'https://picsum.photos/100/100?seed=axon_prime'} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-primary border border-white animate-pulse"></span>
            </div>
          </button>
        </div>
      </header>

      <main className="w-full max-w-7xl mx-auto px-4 lg:px-8 relative z-10 mb-28">
        <div className="bg-white border border-neutral-300 rounded-none overflow-visible grid grid-cols-1 lg:grid-cols-12 shadow-none divide-y lg:divide-y-0 lg:divide-x divide-neutral-200">
          <ConfiguratorPanel
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
            gender={gender}
            setGender={setGender}
            creatureTexture={creatureTexture}
            setCreatureTexture={setCreatureTexture}
            designMode={designMode}
            setDesignMode={setDesignMode}
            customDesign={customDesign}
            setCustomDesign={setCustomDesign}
            aestheticStyle={aestheticStyle}
            setAestheticStyle={setAestheticStyle}
            params={params}
            updateParam={updateParam}
            skinColors={skinColors}
            selectedSkinColor={selectedSkinColor}
            setSelectedSkinColor={setSelectedSkinColor}
            clothingPrompt={clothingPrompt}
            setClothingPrompt={setClothingPrompt}
            expandOccupation={expandOccupation}
            setExpandOccupation={setExpandOccupation}
            expandFeatures={expandFeatures}
            setExpandFeatures={setExpandFeatures}
            isExpanding={isExpanding}
            handleExpandPrompt={handleExpandPrompt}
            refImageWeight={refImageWeight}
            setRefImageWeight={setRefImageWeight}
            refImage={refImage}
            setRefImage={setRefImage}
            customTopImage={customTopImage}
            isAnalyzingTop={isAnalyzingTop}
            customTopDesc={customTopDesc}
            customBottomImage={customBottomImage}
            isAnalyzingBottom={isAnalyzingBottom}
            customBottomDesc={customBottomDesc}
            customShoesImage={customShoesImage}
            isAnalyzingShoes={isAnalyzingShoes}
            customShoesDesc={customShoesDesc}
            handleCustomUpload={handleCustomUpload}
            lightingStyle={lightingStyle}
            setLightingStyle={setLightingStyle}
            backgroundTheme={backgroundTheme}
            setBackgroundTheme={setBackgroundTheme}
            grainFilter={grainFilter}
            setGrainFilter={setGrainFilter}
            modcardImage={modcardImage}
            isAnalyzingModcard={isAnalyzingModcard}
            modcardDesc={modcardDesc}
            handleModcardUpload={handleModcardUpload}
            handleClearModcard={handleClearModcard}
            hbaImageBase64={hbaImageBase64}
            onHbaFileChange={handleHbaFileChange}
            workwearPreviewPrompt={workwearPreviewPrompt}
          />

          <LiveCanvas
            generatedNFT={generatedNFT}
            isGenerating={isGenerating}
            generateNFT={generateNFT}
            nftMetadata={nftMetadata}
            points={points}
            triggerToast={triggerToast}
          />

          <WardrobeVault
            myCyberCollection={myCyberCollection}
            handleSelectSavedItem={handleSelectSavedItem}
            handleRecycle={handleRecycle}
            triggerToast={triggerToast}
          />
        </div>
      </main>

      {toastMessage && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[250] bg-black text-[#D4FF00] text-[9.5px] font-black uppercase tracking-[0.3em] px-8 py-4 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white/10 flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-none">
          <span className="w-1.5 h-1.5 bg-[#D4FF00] rounded-full animate-ping"></span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default Creator;
