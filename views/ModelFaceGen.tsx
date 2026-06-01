import React, { useState, useEffect, useRef } from 'react';
import { generateGeminiImage } from '../lib/geminiClient';

interface FaceParams {
  gender: string;
  age: number;
  ethnicity: string;
  faceShape: string;
  faceShapeWeight: number;
  eyeColor: string;
  eyeShape: string;
  noseShape: string;
  lipsShape: string;
  hairStyle: string;
  hairColor: string;
  skinTone: string;
  skinDetail: number;
  lighting: string;
}

const defaultParams: FaceParams = {
  gender: 'woman',
  age: 25,
  ethnicity: 'caucasian',
  faceShape: 'default',
  faceShapeWeight: 1.0,
  eyeColor: 'default',
  eyeShape: 'default',
  noseShape: 'default',
  lipsShape: 'default',
  hairStyle: 'default',
  hairColor: 'default',
  skinTone: 'default',
  skinDetail: 0.5,
  lighting: 'studio lighting',
};

function generatePrompt(p: FaceParams): string {
  const parts: string[] = [];
  parts.push(`RAW photo, close-up portrait of a ${p.age} year old ${p.ethnicity} ${p.gender}`);
  if (p.faceShape !== 'default') parts.push(`(${p.faceShape} face:${p.faceShapeWeight.toFixed(1)})`);

  const eyeDesc = [p.eyeColor !== 'default' ? p.eyeColor : '', p.eyeShape !== 'default' ? p.eyeShape : '', 'eyes']
    .filter(Boolean)
    .join(' ');
  if (eyeDesc !== 'eyes') parts.push(eyeDesc);

  if (p.noseShape !== 'default') parts.push(`${p.noseShape} nose`);
  if (p.lipsShape !== 'default') parts.push(`${p.lipsShape} lips`);

  const hairDesc = [p.hairColor !== 'default' ? p.hairColor : '', p.hairStyle !== 'default' ? p.hairStyle : 'hair']
    .filter(Boolean)
    .join(' ');
  if (hairDesc !== 'hair') parts.push(hairDesc);

  if (p.skinTone !== 'default') parts.push(`${p.skinTone} skin`);
  if (p.skinDetail > 0) {
    parts.push(`(detailed skin texture, pores, slight imperfections:${(1 + p.skinDetail * 0.5).toFixed(1)})`);
  }
  if (p.lighting !== 'default') parts.push(p.lighting);

  parts.push('8k uhd, dslr, high quality, film grain, Fujifilm XT4, neutral background');
  return parts.join(', ');
}

const ModelFaceGen: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [params, setParams] = useState<FaceParams>(defaultParams);
  const [lastRenderedParams, setLastRenderedParams] = useState<FaceParams | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('base');
  const [liveSync, setLiveSync] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const generateImage = async (currentParams: FaceParams) => {
    setIsGenerating(true);
    try {
      const prompt = generatePrompt(currentParams);
      const image = await generateGeminiImage({
        prompt,
        model: 'gemini-2.5-flash-image',
      });
      setImageUrl(image);
      setLastRenderedParams(currentParams);
    } catch (error) {
      console.error('Error generating image:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (!liveSync) return;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      generateImage(params);
    }, 1200);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [params, liveSync]);

  const handleManualRender = () => {
    generateImage(params);
  };

  const hasChanges =
    lastRenderedParams === null || JSON.stringify(params) !== JSON.stringify(lastRenderedParams);

  const updateParam = <K extends keyof FaceParams>(key: K, value: FaceParams[K]) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const tabs = [
    { id: 'base', label: '基础', icon: 'face' },
    { id: 'eyes', label: '眼睛', icon: 'visibility' },
    { id: 'nose_mouth', label: '口鼻', icon: 'sentiment_satisfied' },
    { id: 'hair', label: '毛发', icon: 'face_retouching_natural' },
    { id: 'skin', label: '皮肤', icon: 'water_drop' },
  ];

  return (
    <div className="flex flex-col h-full bg-background-dark text-white font-future pt-12 pb-24">
      <div className="px-6 mb-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors"
          >
            <span className="material-icons-round text-sm">arrow_back</span>
          </button>
          <h2 className="text-xl font-black uppercase tracking-tighter">模特捏脸</h2>
        </div>

        <button
          onClick={() => setLiveSync(!liveSync)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-colors ${
            liveSync
              ? 'bg-primary/20 border-primary text-primary shadow-[0_0_10px_rgba(95,61,148,0.2)]'
              : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
          }`}
        >
          <span className="material-icons-round text-[14px]">{liveSync ? 'sync' : 'sync_disabled'}</span>
          <span>实时同步</span>
        </button>
      </div>

      <div className="px-6 mb-6">
        <div className="relative w-full aspect-[3/4] bg-white/5 rounded-3xl border border-white/10 overflow-hidden flex items-center justify-center">
          {imageUrl ? (
            <img src={imageUrl} alt="生成模特" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="text-white/30 flex flex-col items-center">
              <span className="material-icons-round text-4xl mb-2">face</span>
              <span className="text-xs uppercase tracking-widest">调整参数后渲染</span>
            </div>
          )}

          {isGenerating && imageUrl && (
            <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col px-6 overflow-hidden">
        {!liveSync && (
          <button
            onClick={handleManualRender}
            disabled={isGenerating || !hasChanges}
            className={`w-full mb-4 py-3 rounded-2xl flex items-center justify-center gap-2 font-bold uppercase tracking-widest text-xs transition-all ${
              isGenerating
                ? 'bg-white/10 text-white/50 cursor-not-allowed'
                : hasChanges
                  ? 'bg-primary text-white shadow-[0_0_15px_rgba(95,61,148,0.3)] hover:scale-[1.02]'
                  : 'bg-white/5 text-white/30 cursor-not-allowed'
            }`}
          >
            {isGenerating ? (
              <>
                <span className="material-icons-round text-sm animate-spin">autorenew</span> 渲染中...
              </>
            ) : hasChanges ? (
              <>
                <span className="material-icons-round text-sm">play_arrow</span> 渲染更改
              </>
            ) : (
              <>
                <span className="material-icons-round text-sm">check</span> 已是最新
              </>
            )}
          </button>
        )}

        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                activeTab === tab.id ? 'bg-primary text-white' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <span className="material-icons-round text-sm">{tab.icon}</span>
              <span className="text-xs font-bold uppercase tracking-wider">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 pb-10">
          {activeTab === 'base' && (
            <>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-white/50 tracking-widest">性别</label>
                <select
                  value={params.gender}
                  onChange={(e) => updateParam('gender', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
                >
                  <option value="woman">女性</option>
                  <option value="man">男性</option>
                  <option value="androgynous">中性</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-white/50 tracking-widest flex justify-between">
                  <span>年龄</span>
                  <span className="text-primary">{params.age}</span>
                </label>
                <input
                  type="range"
                  min={18}
                  max={80}
                  value={params.age}
                  onChange={(e) => updateParam('age', parseInt(e.target.value, 10))}
                  className="w-full accent-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-white/50 tracking-widest">族裔</label>
                <select
                  value={params.ethnicity}
                  onChange={(e) => updateParam('ethnicity', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
                >
                  <option value="caucasian">高加索人 (白人)</option>
                  <option value="asian">亚洲人</option>
                  <option value="black">黑人</option>
                  <option value="hispanic">拉美裔</option>
                  <option value="middle eastern">中东人</option>
                  <option value="mixed race">混血</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-white/50 tracking-widest">脸型</label>
                <select
                  value={params.faceShape}
                  onChange={(e) => updateParam('faceShape', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
                >
                  <option value="default">默认</option>
                  <option value="round">圆脸</option>
                  <option value="oval">鹅蛋脸</option>
                  <option value="square">方脸</option>
                  <option value="heart">心形脸</option>
                  <option value="diamond">菱形脸</option>
                </select>
              </div>
              {params.faceShape !== 'default' && (
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-white/50 tracking-widest flex justify-between">
                    <span>脸型权重</span>
                    <span className="text-primary">{params.faceShapeWeight.toFixed(2)}</span>
                  </label>
                  <input
                    type="range"
                    min={0.5}
                    max={1.5}
                    step={0.1}
                    value={params.faceShapeWeight}
                    onChange={(e) => updateParam('faceShapeWeight', parseFloat(e.target.value))}
                    className="w-full accent-primary"
                  />
                </div>
              )}
            </>
          )}

          {activeTab === 'eyes' && (
            <>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-white/50 tracking-widest">瞳色</label>
                <select
                  value={params.eyeColor}
                  onChange={(e) => updateParam('eyeColor', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
                >
                  <option value="default">默认</option>
                  <option value="blue">蓝色</option>
                  <option value="green">绿色</option>
                  <option value="brown">棕色</option>
                  <option value="hazel">淡褐色</option>
                  <option value="grey">灰色</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-white/50 tracking-widest">眼型</label>
                <select
                  value={params.eyeShape}
                  onChange={(e) => updateParam('eyeShape', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
                >
                  <option value="default">默认</option>
                  <option value="almond">杏仁眼</option>
                  <option value="round">圆眼</option>
                  <option value="monolid">单眼皮</option>
                  <option value="hooded">内双/垂睑</option>
                  <option value="downturned">下垂眼</option>
                  <option value="upturned">上扬眼</option>
                </select>
              </div>
            </>
          )}

          {activeTab === 'nose_mouth' && (
            <>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-white/50 tracking-widest">鼻型</label>
                <select
                  value={params.noseShape}
                  onChange={(e) => updateParam('noseShape', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
                >
                  <option value="default">默认</option>
                  <option value="straight">直鼻</option>
                  <option value="button">小翘鼻</option>
                  <option value="aquiline">鹰钩鼻</option>
                  <option value="snub">朝天鼻</option>
                  <option value="wide">宽鼻</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-white/50 tracking-widest">唇型</label>
                <select
                  value={params.lipsShape}
                  onChange={(e) => updateParam('lipsShape', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
                >
                  <option value="default">默认</option>
                  <option value="full">厚唇</option>
                  <option value="thin">薄唇</option>
                  <option value="wide">宽唇</option>
                  <option value="bow-shaped">M型唇</option>
                  <option value="pouty">嘟嘟唇</option>
                </select>
              </div>
            </>
          )}

          {activeTab === 'hair' && (
            <>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-white/50 tracking-widest">发色</label>
                <select
                  value={params.hairColor}
                  onChange={(e) => updateParam('hairColor', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
                >
                  <option value="default">默认</option>
                  <option value="black">黑色</option>
                  <option value="brown">棕色</option>
                  <option value="blonde">金发</option>
                  <option value="red">红发</option>
                  <option value="grey">灰发</option>
                  <option value="white">白发</option>
                  <option value="pink">粉色</option>
                  <option value="blue">蓝色</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-white/50 tracking-widest">发型</label>
                <select
                  value={params.hairStyle}
                  onChange={(e) => updateParam('hairStyle', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
                >
                  <option value="default">默认</option>
                  <option value="short">短发</option>
                  <option value="long">长发</option>
                  <option value="curly">卷发</option>
                  <option value="wavy">波浪发</option>
                  <option value="straight">直发</option>
                  <option value="buzz cut">寸头</option>
                  <option value="bald">光头</option>
                  <option value="ponytail">马尾</option>
                  <option value="messy">凌乱</option>
                </select>
              </div>
            </>
          )}

          {activeTab === 'skin' && (
            <>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-white/50 tracking-widest">肤色</label>
                <select
                  value={params.skinTone}
                  onChange={(e) => updateParam('skinTone', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
                >
                  <option value="default">默认</option>
                  <option value="pale">苍白</option>
                  <option value="fair">白皙</option>
                  <option value="medium">中等</option>
                  <option value="olive">橄榄色</option>
                  <option value="brown">棕色</option>
                  <option value="dark">深色</option>
                  <option value="ebony">乌木色</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-white/50 tracking-widest flex justify-between">
                  <span>皮肤细节 (毛孔/雀斑)</span>
                  <span className="text-primary">{Math.round(params.skinDetail * 100)}%</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={params.skinDetail}
                  onChange={(e) => updateParam('skinDetail', parseFloat(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-white/50 tracking-widest">光影</label>
                <select
                  value={params.lighting}
                  onChange={(e) => updateParam('lighting', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
                >
                  <option value="default">默认</option>
                  <option value="studio lighting">影棚光</option>
                  <option value="cinematic lighting">电影感光效</option>
                  <option value="natural sunlight">自然阳光</option>
                  <option value="neon lighting">霓虹光</option>
                  <option value="moody lighting">氛围光</option>
                </select>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModelFaceGen;
