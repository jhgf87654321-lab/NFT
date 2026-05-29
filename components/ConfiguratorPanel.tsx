import React from 'react';

interface ConfiguratorPanelProps {
  activeCategory: 'Body' | 'Skin' | 'Style' | 'Design';
  setActiveCategory: (cat: 'Body' | 'Skin' | 'Style' | 'Design') => void;
  gender: 'Male' | 'Female' | 'Creature';
  setGender: (g: 'Male' | 'Female' | 'Creature') => void;
  creatureTexture: 'Hairy' | 'Hairless';
  setCreatureTexture: (t: 'Hairy' | 'Hairless') => void;
  designMode: 'Random' | 'Custom';
  setDesignMode: (m: 'Random' | 'Custom') => void;
  customDesign: { top: string; bottom: string; shoes: string };
  setCustomDesign: React.Dispatch<React.SetStateAction<{ top: string; bottom: string; shoes: string }>>;
  aestheticStyle: string;
  setAestheticStyle: (s: string) => void;
  params: Record<string, number>;
  updateParam: (key: string, value: number) => void;
  skinColors: Array<{ name: string; hex: string }>;
  selectedSkinColor: string;
  setSelectedSkinColor: (hex: string) => void;
  clothingPrompt: string;
  setClothingPrompt: (p: string) => void;
  expandOccupation: string;
  setExpandOccupation: (o: string) => void;
  expandFeatures: string;
  setExpandFeatures: (f: string) => void;
  isExpanding: boolean;
  handleExpandPrompt: () => Promise<void>;
  refImageWeight: number;
  setRefImageWeight: (w: number) => void;
  refImage: string | null;
  setRefImage: (img: string | null) => void;
  customTopImage: string | null;
  isAnalyzingTop: boolean;
  customTopDesc: string | null;
  customBottomImage: string | null;
  isAnalyzingBottom: boolean;
  customBottomDesc: string | null;
  customShoesImage: string | null;
  isAnalyzingShoes: boolean;
  customShoesDesc: string | null;
  handleCustomUpload: (e: React.ChangeEvent<HTMLInputElement>, type: 'top' | 'bottom' | 'shoes') => Promise<void>;
  lightingStyle: string;
  setLightingStyle: (l: string) => void;
  backgroundTheme: string;
  setBackgroundTheme: (bg: string) => void;
  grainFilter: string;
  setGrainFilter: (g: string) => void;
  modcardImage: string | null;
  isAnalyzingModcard: boolean;
  modcardDesc: string | null;
  handleModcardUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleClearModcard: () => void;
  hbaImageBase64: string | null;
  onHbaFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  workwearPreviewPrompt?: string;
}

export const ConfiguratorPanel: React.FC<ConfiguratorPanelProps> = ({
  activeCategory,
  setActiveCategory,
  gender,
  setGender,
  creatureTexture,
  setCreatureTexture,
  designMode,
  setDesignMode,
  customDesign,
  setCustomDesign,
  aestheticStyle,
  setAestheticStyle,
  params,
  updateParam,
  skinColors,
  selectedSkinColor,
  setSelectedSkinColor,
  clothingPrompt,
  setClothingPrompt,
  expandOccupation,
  setExpandOccupation,
  expandFeatures,
  setExpandFeatures,
  isExpanding,
  handleExpandPrompt,
  refImageWeight,
  setRefImageWeight,
  customTopImage,
  isAnalyzingTop,
  customBottomImage,
  isAnalyzingBottom,
  customShoesImage,
  isAnalyzingShoes,
  handleCustomUpload,
  lightingStyle,
  setLightingStyle,
  backgroundTheme,
  setBackgroundTheme,
  grainFilter,
  setGrainFilter,
  modcardImage,
  isAnalyzingModcard,
  modcardDesc,
  handleModcardUpload,
  handleClearModcard,
  hbaImageBase64,
  onHbaFileChange,
  workwearPreviewPrompt,
}) => {
  return (
    <div className="lg:col-span-4 w-full h-full max-h-[85vh] flex bg-[#FAF9F6] text-black overflow-y-auto no-scrollbar relative flex-col border-b lg:border-b-0 border-r border-[#E5E5E5] p-5 rounded-none">
      {/* Mini Brand header resembling modcard.asia model record card style */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E1E1E1]">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-none bg-black"></div>
          <span className="text-[10px] font-bold tracking-wider uppercase font-mono text-neutral-800">CONFIGURATOR</span>
        </div>
        <span className="text-[8px] font-mono text-neutral-400">MD.V2.0_SPEC</span>
      </div>

      {/* Model Spec Selection Tab Header: Rounded-none sharp edges */}
      <div className="flex border border-neutral-300 p-0.5 mb-5 gap-0.5 bg-neutral-100 rounded-none">
        {(['Body', 'Skin', 'Style', 'Design'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex-1 py-1.5 text-[9px] font-extrabold uppercase tracking-widest rounded-none transition-all ${
              activeCategory === cat
                ? 'bg-black text-white'
                : 'text-neutral-500 hover:text-black hover:bg-neutral-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* RENDER DYNAMIC CONFIG SECTIONS */}
      <div className="space-y-5 flex-1 select-none">
        
        {/* TAB 1: BODY SETUP */}
        {activeCategory === 'Body' && (
          <div className="space-y-4">
            {/* Gender/Archetype Selection */}
            <div className="space-y-2">
              <label className="text-[9px] uppercase font-bold tracking-widest text-neutral-400 font-mono">Model Genus</label>
              <div className="grid grid-cols-3 gap-1">
                {(['Male', 'Female', 'Creature'] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    className={`py-2 text-[9px] font-black uppercase tracking-wider rounded-none border transition-all ${
                      gender === g
                        ? 'border-black bg-black text-white'
                        : 'border-neutral-300 bg-white text-neutral-850 hover:border-black'
                    } ${gender !== g && modcardDesc && g !== 'Creature' ? 'opacity-30 cursor-not-allowed' : ''}`}
                    disabled={!!modcardDesc && g !== 'Creature' && gender !== g}
                  >
                    {g}
                  </button>
                ))}
              </div>
              {modcardDesc && (
                <div className="mt-2 p-2.5 bg-[#D4FF00]/20 border border-neutral-305 text-[8px] font-mono text-neutral-800 uppercase tracking-wider leading-relaxed">
                  ⚠️ ACTIVE MODCARD DETECTED: THE SYSTEM IS MANDATING AND ENFORCING THE DETAILED MODCARD IDENTITY OVER STANDARD TRAITS.
                </div>
              )}
            </div>

            {/* Creature Surface Specs */}
            {gender === 'Creature' && (
              <div className="space-y-2">
                <label className="text-[9px] uppercase font-bold tracking-widest text-[#D4FF00] bg-black px-2 py-0.5 rounded-none font-mono">Creatures Surface Specs</label>
                <div className="grid grid-cols-2 gap-1 mt-1">
                  {(['Hairy', 'Hairless'] as const).map((texture) => (
                    <button
                      key={texture}
                      onClick={() => setCreatureTexture(texture)}
                      className={`py-2 text-[9.5px] font-black uppercase tracking-wider rounded-none border transition-all ${
                        creatureTexture === texture
                          ? 'border-black bg-black text-white'
                          : 'border-neutral-300 bg-white text-neutral-800 hover:border-black'
                      }`}
                    >
                      {texture}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sub sliders */}
            <div className="space-y-4 pt-3 border-t border-[#E5E5E5]">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[9px] uppercase font-bold tracking-widest text-neutral-400 font-mono">
                  <span>Muscularity</span>
                  <span className="text-black font-mono font-bold">{params.muscularity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={params.muscularity}
                  onChange={(e) => updateParam('muscularity', parseInt(e.target.value))}
                  className="w-full h-1 bg-neutral-200 rounded-none appearance-none cursor-pointer accent-black"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-[9px] uppercase font-bold tracking-widest text-neutral-400 font-mono">
                  <span>Build (Thin / Heavy)</span>
                  <span className="text-black font-mono font-bold">{params.heavy}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={params.heavy}
                  onChange={(e) => updateParam('heavy', parseInt(e.target.value))}
                  className="w-full h-1 bg-neutral-200 rounded-none appearance-none cursor-pointer accent-black"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-[9px] uppercase font-bold tracking-widest text-neutral-400 font-mono">
                  <span>Height Proportion</span>
                  <span className="text-black font-mono font-bold">{params.proportions}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={params.proportions}
                  onChange={(e) => updateParam('proportions', parseInt(e.target.value))}
                  className="w-full h-1 bg-neutral-200 rounded-none appearance-none cursor-pointer accent-black"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SKIN SELECTION */}
        {activeCategory === 'Skin' && (
          <div className="space-y-4">
            {/* Skin Tones Panel */}
            <div className="space-y-2">
              <label className="text-[9px] uppercase font-bold tracking-widest text-neutral-400 font-mono">Dermal Bios Melanin</label>
              <div className="grid grid-cols-4 gap-2">
                {skinColors.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedSkinColor(color.hex)}
                    className={`w-full aspect-square rounded-none border flex items-center justify-center transition-all relative ${
                      selectedSkinColor === color.hex ? 'border-black scale-105 shadow-sm' : 'border-neutral-200 hover:border-black'
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  >
                    {selectedSkinColor === color.hex && (
                      <div className="w-2 h-2 bg-white mix-blend-difference"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Modcard Recognition Module */}
            <div className="space-y-3 pt-4 border-t border-neutral-200">
              <div className="flex justify-between items-center">
                <label className="text-[9px] uppercase font-bold tracking-widest text-black bg-[#D4FF00] px-2 py-0.5 rounded-none font-mono">
                  MODCARD IDENTIFY
                </label>
                <span className="text-[8px] font-mono text-neutral-400">MD.REC_AI</span>
              </div>
              
              <div className="border border-neutral-300 bg-white p-3 rounded-none relative">
                {modcardImage ? (
                  <div className="space-y-3">
                    <div className="relative aspect-[3/2] w-full border border-neutral-200 rounded-none overflow-hidden bg-neutral-150 flex items-center justify-center">
                      <img
                        src={modcardImage}
                        alt="Uploaded Modcard"
                        className="h-full w-auto object-contain"
                      />
                      <button
                        type="button"
                        onClick={handleClearModcard}
                        className="absolute top-2 right-2 p-1.5 bg-black hover:bg-neutral-900 text-white rounded-none border border-black transition-all text-[8px] uppercase tracking-widest font-mono flex items-center gap-1"
                      >
                        <span className="material-icons-round text-xs">close</span>
                        <span>CLEAR</span>
                      </button>
                    </div>

                    {isAnalyzingModcard ? (
                      <div className="p-3 bg-neutral-100 border border-neutral-300 rounded-none flex items-center justify-center gap-2">
                        <div className="w-3.5 h-3.5 border border-t-black border-l-black animate-spin rounded-none"></div>
                        <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-neutral-600">DECODING BIOLOGICAL NODE...</span>
                      </div>
                    ) : modcardDesc ? (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-[7.5px] font-black text-neutral-400 font-mono tracking-wider border-b border-neutral-200 pb-1">
                          <span>EXTRACTED MODEL SPECS</span>
                          <span className="text-black font-black">AI_COUTURE SYNCED</span>
                        </div>
                        <div className="p-2.5 bg-neutral-50 text-[9px] text-neutral-700 leading-relaxed font-mono whitespace-pre-wrap uppercase tracking-wider border border-neutral-200 max-h-[140px] overflow-y-auto no-scrollbar">
                          {modcardDesc}
                        </div>
                        <p className="text-[7.5px] font-mono text-neutral-400 uppercase tracking-widest leading-relaxed">
                          * EXTREMELY HIGH FIDELITY CHARACTERISTICS HAVE BEEN SYNCED. GENERATION WILL DIRECTLY PRESERVE THESE DISTINCT MODEL TRAITS.
                        </p>
                      </div>
                    ) : (
                      <div className="text-center p-2.5 text-[8.5px] font-mono text-red-600 uppercase tracking-widest bg-red-50 border border-red-200">
                        DECODING ERROR. RESET MODCARD FILE.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border border-dashed border-neutral-300 rounded-none bg-neutral-50 px-4 py-6 text-center relative flex flex-col items-center justify-center min-h-[140px]">
                    <input
                      type="file"
                      accept="image/*"
                      id="modcard-upload"
                      onChange={handleModcardUpload}
                      className="hidden"
                    />
                    <span className="material-icons-round text-2xl text-neutral-400 mb-2 font-light">contact_page</span>
                    <label
                      htmlFor="modcard-upload"
                      className="cursor-pointer text-[9px] uppercase tracking-widest text-[#D4FF00] bg-black hover:bg-neutral-900 border border-black font-black py-2 px-4 rounded-none transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
                    >
                      <span className="material-icons-round text-xs">add_photo_alternate</span>
                      <span>INJECT MODCARD NODE</span>
                    </label>
                    <p className="text-[7.5px] font-mono text-neutral-400 uppercase tracking-widest leading-relaxed mt-3 max-w-[200px] mx-auto select-none">
                      SCAN AND EXTRACT DISTINCT MODEL PROFILE TRAITS DIRECTLY FROM MODCARD.ASIA TO CLONE FACES & ETHNIC PORTFOLIOS
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="text-center py-6 border-t border-neutral-200 mt-5">
              <span className="material-icons-round text-2xl text-neutral-300 mb-1">fingerprint</span>
              <p className="text-[9px] uppercase tracking-widest text-neutral-500 font-bold font-mono">DERMAL NODE REGISTRY</p>
              <p className="text-[7.5px] uppercase tracking-widest text-neutral-400 mt-1 max-w-[240px] mx-auto leading-relaxed font-mono">
                MELANIN PROFILE AND SKIN ACCENT CONTRAST ARE SERVER-INTEGRATED DYNAMICALLY FOR OPTIMAL LIGHTING RATIOS IN MINT PREVIEWS.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: STYLE SCHEME (Newly added options are beautifully preserved) */}
        {activeCategory === 'Style' && (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[9px] uppercase font-bold tracking-widest text-neutral-400 font-mono">Couture Brand Vibe</label>
                <select
                  value={aestheticStyle}
                  onChange={(e) => setAestheticStyle(e.target.value)}
                  className="w-full bg-white border border-neutral-350 rounded-none px-3 py-2 text-[10px] font-bold text-neutral-800 uppercase tracking-wider focus:outline-none focus:border-black"
                >
                  <option value="Default">Default Tech-Fashion Vibe</option>
                  <option value="90s Haute Couture Runway">90&apos;s Haute Couture Runway</option>
                  <option value="Workwear">Avant-Garde Workwear / 工装</option>
                  <option value="Nike Techwear Runway">Nike ACG Runway Vibe</option>
                  <option value="Balenciaga Post-Apocalypse">Balenciaga Post-Apocalypse</option>
                  <option value="Stone Island Tactility shadow">Stone Island Shadow Vibe</option>
                  <option value="Epitome Cyber Gothic">Futuristic Gothic / Dark</option>
                </select>
              </div>

              {aestheticStyle === 'Workwear' && workwearPreviewPrompt ? (
                <div className="p-2.5 bg-[#D4FF00]/15 border border-neutral-300 text-[7.5px] font-mono text-neutral-800 uppercase tracking-wider leading-relaxed max-h-24 overflow-y-auto no-scrollbar">
                  {workwearPreviewPrompt}
                </div>
              ) : null}

              <div className="space-y-1.5">
                <label className="text-[9px] uppercase font-bold tracking-widest text-neutral-400 font-mono">Lighting setup</label>
                <select
                  value={lightingStyle}
                  onChange={(e) => setLightingStyle(e.target.value)}
                  className="w-full bg-white border border-neutral-350 rounded-none px-3 py-2 text-[10px] font-bold text-neutral-800 uppercase tracking-wider focus:outline-none focus:border-black"
                >
                  {['杂志封面', '强对比侧光', '高级柔和环形灯', '暗黑废土剪影', '霓虹眩光光影'].map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] uppercase font-bold tracking-widest text-neutral-400 font-mono">Runway backdrops</label>
                <select
                  value={backgroundTheme}
                  onChange={(e) => setBackgroundTheme(e.target.value)}
                  className="w-full bg-white border border-neutral-350 rounded-none px-3 py-2 text-[10px] font-bold text-neutral-800 uppercase tracking-wider focus:outline-none focus:border-black"
                >
                  {['赛博实验室', '高端摄影棚', '户外山系岩石', '废土都市沙砾', '美术馆简约展厅'].map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] uppercase font-bold tracking-widest text-neutral-400 font-mono">Creative Lens Noise</label>
                <select
                  value={grainFilter}
                  onChange={(e) => setGrainFilter(e.target.value)}
                  className="w-full bg-white border border-neutral-350 rounded-none px-3 py-2 text-[10px] font-bold text-neutral-800 uppercase tracking-wider focus:outline-none focus:border-black"
                >
                  {['无噪点', '细微复古颗粒', '复古重度灰尘感', '漏光暖调滤镜', '暗黑冷调质感'].map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E5E5E5] space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[9px] uppercase font-bold tracking-widest text-neutral-400 font-mono">
                  <span>Model Chromatic Palette</span>
                  <span className="text-black font-mono font-bold">{params.chromaticity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={params.chromaticity}
                  onChange={(e) => updateParam('chromaticity', parseInt(e.target.value))}
                  className="w-full h-1 bg-neutral-200 rounded-none appearance-none cursor-pointer accent-black"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-[9px] uppercase font-bold tracking-widest text-neutral-400 font-mono">
                  <span>Couture Layering weight</span>
                  <span className="text-black font-mono font-bold">{params.thickness}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={params.thickness}
                  onChange={(e) => updateParam('thickness', parseInt(e.target.value))}
                  className="w-full h-1 bg-neutral-200 rounded-none appearance-none cursor-pointer accent-black"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-[9px] uppercase font-bold tracking-widest text-neutral-400 font-mono">
                  <span>Aesthetics Timeline</span>
                  <span className="text-black font-mono font-bold">Era: {params.era}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={params.era}
                  onChange={(e) => updateParam('era', parseInt(e.target.value))}
                  className="w-full h-1 bg-neutral-200 rounded-none appearance-none cursor-pointer accent-black"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-[9px] uppercase font-bold tracking-widest text-neutral-400 font-mono">
                  <span>Headwear Complexity</span>
                  <span className="text-black font-mono font-bold">{params.jawline ?? 50}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={params.jawline ?? 50}
                  onChange={(e) => updateParam('jawline', parseInt(e.target.value))}
                  className="w-full h-1 bg-neutral-200 rounded-none appearance-none cursor-pointer accent-black"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-[9px] uppercase font-bold tracking-widest text-neutral-400 font-mono">
                  <span>Pose Expression</span>
                  <span className="text-black font-mono font-bold font-mono">Pose: {params.pose}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={params.pose}
                  onChange={(e) => updateParam('pose', parseInt(e.target.value))}
                  className="w-full h-1 bg-neutral-200 rounded-none appearance-none cursor-pointer accent-black"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ADVANCED CUSTOM DESIGN */}
        {activeCategory === 'Design' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[9px] uppercase font-bold tracking-widest text-neutral-400 font-mono">Virtual Try-On Module</label>
              <div className="grid grid-cols-2 gap-2">
                {(['Random', 'Custom'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setDesignMode(mode)}
                    className={`py-2 text-[9px] font-black uppercase tracking-wider rounded-none border transition-all ${
                      designMode === mode
                        ? 'border-black bg-black text-white'
                        : 'border-neutral-200 bg-white text-neutral-800 hover:border-black'
                    }`}
                  >
                    {mode === 'Random' ? 'Full Spec AI' : 'Hologram Try-On'}
                  </button>
                ))}
              </div>
            </div>

            {designMode === 'Custom' ? (
              <div className="space-y-3.5 p-3.5 bg-neutral-100 border border-neutral-300 rounded-none">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[8.5px] uppercase font-mono font-bold text-neutral-500">Upper/Top Layer</span>
                    <select
                      value={customDesign.top}
                      onChange={(e) => setCustomDesign(p => ({ ...p, top: e.target.value }))}
                      className="bg-white border border-neutral-300 rounded-none px-2 py-0.5 text-[8.5px] font-bold text-neutral-700"
                    >
                      <option value="Coat">Cyber Trenchcoat</option>
                      <option value="HBA">HBA Checkered Racer</option>
                      <option value="Custom">Custom Reference</option>
                    </select>
                  </div>
                  {customDesign.top === 'HBA' && (
                    <div className="relative border border-dashed border-neutral-300 rounded-none p-2.5 bg-white text-center flex flex-col items-center justify-center gap-2">
                      <input type="file" accept="image/*" id="hba-upload" onChange={onHbaFileChange} className="hidden" />
                      <label htmlFor="hba-upload" className="cursor-pointer text-[8px] uppercase tracking-wider text-neutral-600 font-bold py-1 px-3 bg-neutral-100 rounded-none border border-neutral-300 hover:bg-neutral-200 transition-all">
                        Upload HBA Reference
                      </label>
                      {hbaImageBase64 && (
                        <img src={hbaImageBase64} alt="HBA Reference" className="w-12 h-12 object-cover rounded-none border border-neutral-300" />
                      )}
                    </div>
                  )}
                  {customDesign.top === 'Custom' && (
                    <div className="relative border border-dashed border-neutral-300 rounded-none p-2.5 bg-white text-center flex flex-col items-center justify-center">
                      <input
                        type="file"
                        accept="image/*"
                        id="top-upload"
                        onChange={(e) => handleCustomUpload(e, 'top')}
                        className="hidden"
                      />
                      {customTopImage ? (
                        <div className="relative w-12 h-12 rounded-none overflow-hidden">
                          <img src={customTopImage} alt="top reference" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <label htmlFor="top-upload" className="cursor-pointer text-[8px] uppercase tracking-wider text-neutral-400 font-bold py-1 px-3 bg-neutral-100 rounded-none border border-neutral-300 hover:bg-neutral-200 transition-all">
                          Upload Custom Top
                        </label>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2 border-t border-[#E5E5E5] pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[8.5px] uppercase font-mono font-bold text-neutral-500">Lower/Pants Layer</span>
                    <select
                      value={customDesign.bottom}
                      onChange={(e) => setCustomDesign(p => ({ ...p, bottom: e.target.value }))}
                      className="bg-white border border-neutral-300 rounded-none px-2 py-0.5 text-[8.5px] font-bold text-neutral-700"
                    >
                      <option value="Pants">Cargo Hakama</option>
                      <option value="Shorts">Layered Utility Shorts</option>
                      <option value="Custom">Custom Reference</option>
                    </select>
                  </div>
                  {customDesign.bottom === 'Custom' && (
                    <div className="relative border border-dashed border-neutral-300 rounded-none p-2.5 bg-white text-center flex flex-col items-center justify-center">
                      <input
                        type="file"
                        accept="image/*"
                        id="bottom-upload"
                        onChange={(e) => handleCustomUpload(e, 'bottom')}
                        className="hidden"
                      />
                      {customBottomImage ? (
                        <div className="relative w-12 h-12 rounded-none overflow-hidden">
                          <img src={customBottomImage} alt="bottom reference" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <label htmlFor="bottom-upload" className="cursor-pointer text-[8px] uppercase tracking-wider text-neutral-400 font-bold py-1 px-3 bg-neutral-100 rounded-none border border-neutral-300 hover:bg-neutral-200 transition-all">
                          Upload Custom Bottom
                        </label>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2 border-t border-[#E5E5E5] pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[8.5px] uppercase font-mono font-bold text-neutral-500">Footwear Spec</span>
                    <select
                      value={customDesign.shoes}
                      onChange={(e) => setCustomDesign(p => ({ ...p, shoes: e.target.value }))}
                      className="bg-white border border-neutral-300 rounded-none px-2 py-0.5 text-[8.5px] font-bold text-neutral-700"
                    >
                      <option value="Sneakers">Chunky Sock-Sneaker</option>
                      <option value="aim">AIM platform Boots</option>
                      <option value="Custom">Custom Reference</option>
                    </select>
                  </div>
                  {customDesign.shoes === 'Custom' && (
                    <div className="relative border border-dashed border-neutral-300 rounded-none p-2.5 bg-white text-center flex flex-col items-center justify-center">
                      <input
                        type="file"
                        accept="image/*"
                        id="shoes-upload"
                        onChange={(e) => handleCustomUpload(e, 'shoes')}
                        className="hidden"
                      />
                      {customShoesImage ? (
                        <div className="relative w-12 h-12 rounded-none overflow-hidden">
                          <img src={customShoesImage} alt="shoes reference" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <label htmlFor="shoes-upload" className="cursor-pointer text-[8px] uppercase tracking-wider text-neutral-400 font-bold py-1 px-3 bg-neutral-100 rounded-none border border-neutral-300 hover:bg-neutral-200 transition-all">
                          Upload Custom Shoes
                        </label>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-black text-white rounded-none space-y-1">
                <p className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#D4FF00]">Full Generative Engine</p>
                <p className="text-[7.5px] uppercase tracking-widest leading-relaxed text-neutral-450 font-mono">
                  GENERATING VIA FULL SPEC INSTRUCTIONS UTILISES ALL HUMAN BASE CHARACTERISTICS AND SCENE AMBIENT VALUES FOR THE ABSOLUTE BEST CHIC LOOKS.
                </p>
              </div>
            )}

            {/* Custom Description Textarea with expander */}
            <div className="space-y-2 pt-3 border-t border-[#E5E5E5]">
              <label className="text-[9px] font-bold tracking-wide text-neutral-500">自定义服装描述</label>
              <textarea
                value={clothingPrompt}
                onChange={(e) => setClothingPrompt(e.target.value)}
                placeholder="在此输入服装款式、剪裁、面料、图案等细节（中文）；生成图片时将自动译为英文 prompt。"
                className="w-full bg-white border border-neutral-300 rounded-none p-3 text-[10px] font-medium text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-black min-h-[90px] leading-relaxed resize-none font-sans"
              />
              
              {/* Expander form inside container */}
              <div className="p-3 bg-[#FAF9F6] border border-neutral-300 flex flex-col gap-2 mt-1 rounded-none">
                <div className="flex justify-between items-center text-[7.5px] text-neutral-500">
                  <span className="font-bold">AI 提示词扩写</span>
                  <span className="text-black font-mono text-[7px]">GEN-V2</span>
                </div>
                <input
                  type="text"
                  value={expandOccupation}
                  onChange={(e) => setExpandOccupation(e.target.value)}
                  placeholder="职业 / 角色（如：咖啡师、飞行员）"
                  className="w-full bg-white border border-neutral-300 rounded-none px-2.5 py-1.5 text-[9px] font-medium text-neutral-800 focus:outline-none focus:border-black"
                />
                <input
                  type="text"
                  value={expandFeatures}
                  onChange={(e) => setExpandFeatures(e.target.value)}
                  placeholder="附加特征（可选，如：宽松剪裁、金属扣件）"
                  className="w-full bg-white border border-neutral-300 rounded-none px-2.5 py-1.5 text-[9px] font-medium text-neutral-800 focus:outline-none focus:border-black"
                />
                <button
                  type="button"
                  onClick={handleExpandPrompt}
                  disabled={isExpanding}
                  className="w-full bg-black hover:bg-neutral-900 text-[#D4FF00] py-1.5 rounded-none text-[8px] font-bold tracking-wide transition-all flex items-center justify-center gap-1 active:scale-95 disabled:opacity-50"
                >
                  <span className="material-icons-round text-[9px]">{isExpanding ? 'sync' : 'auto_awesome'}</span>
                    {isExpanding ? '扩写中…' : '智能扩写'}
                  </button>
                  <p className="text-[7px] text-neutral-450 leading-snug font-mono">
                    默认写实扩写；需科技感请在输入框写「科技」「未来感」「赛博」等。
                  </p>
                </div>

              {/* Weight selection slider */}
              <div className="space-y-2 pt-3">
                <div className="flex justify-between items-center text-[9px] uppercase font-bold tracking-widest text-neutral-400 font-mono">
                  <span>Reference Weight</span>
                  <span className="text-black font-mono font-bold">{refImageWeight}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={refImageWeight}
                  onChange={(e) => setRefImageWeight(parseInt(e.target.value))}
                  className="w-full h-1 bg-neutral-200 rounded-none appearance-none cursor-pointer accent-black"
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
