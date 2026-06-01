import React from 'react';

interface LiveCanvasProps {
  generatedNFT: string | null;
  isGenerating: boolean;
  generateNFT: () => Promise<void>;
  nftMetadata: { theme: string; rarity: string } | null;
  points: number;
  triggerToast: (msg: string) => void;
}

export const LiveCanvas: React.FC<LiveCanvasProps> = ({
  generatedNFT,
  isGenerating,
  generateNFT,
  nftMetadata,
  points,
  triggerToast,
}) => {
  return (
    <div className="lg:col-span-4 w-full h-full max-h-[85vh] flex flex-col bg-white overflow-hidden relative border-b lg:border-b-0 border-r border-[#E5E5E5] p-5 rounded-none">
      {/* Top Details Panel */}
      <div className="shrink-0 flex items-center justify-between pb-3 border-b border-[#E5E5E5] mb-4">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[#5F3D94] border border-black"></span>
          <span className="text-[10px] font-bold tracking-wider uppercase font-mono text-neutral-800">PREVIEW RENDERER</span>
        </div>
        <div className="flex items-center gap-1.5 bg-neutral-100 border border-neutral-300 py-0.5 px-3 rounded-none">
          <span className="text-[8.5px] font-mono font-black uppercase text-black">SCORE_VAL:</span>
          <span className="text-[8.5px] font-mono font-bold text-black">{points}</span>
        </div>
      </div>

      {/* Main interactive center stage canvas */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-start pt-1 pb-3 overflow-hidden">
        <div className="w-full max-w-[340px] mx-auto aspect-[3/4] bg-[#FAF9F6] border border-neutral-300 rounded-none relative overflow-hidden shadow-none flex items-center justify-center group">
          {/* Subtle design helper grid resembling physical fashion blueprint cards */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-neutral-400"></div>
            <div className="absolute left-0 right-0 top-1/2 h-px bg-neutral-400"></div>
            <div className="absolute inset-4 border border-dashed border-neutral-450"></div>
          </div>

          {generatedNFT ? (
            <div className="relative w-full h-full animate-in fade-in zoom-in duration-500">
              <img 
                src={generatedNFT} 
                alt="Generated NFT Model" 
                className="w-full h-full object-cover relative z-10 rounded-none"
                referrerPolicy="no-referrer"
              />
              {/* Dynamic fashion specs overlay on hover */}
              <div className="absolute inset-x-0 bottom-0 bg-black/85 backdrop-blur-sm p-4 text-white z-20 translate-y-full group-hover:translate-y-0 transition-all duration-300 rounded-none">
                <div className="flex justify-between items-center text-[7.5px] font-black uppercase tracking-wider text-[#5F3D94] mb-1">
                  <span>MINT ENGINE // ACTIVE</span>
                  <span>{nftMetadata?.rarity || 'COMMON'}</span>
                </div>
                <h4 className="text-[11px] font-bold uppercase tracking-wide leading-tight line-clamp-1 mb-2 font-mono">
                  {nftMetadata?.theme || 'Couture Concept'}
                </h4>
                <div className="flex gap-1.5">
                  <button 
                    onClick={() => triggerToast('COUTURE DESIGN SPEC DOWNLOAD ARCHIVAL INITIATED.')}
                    className="flex-1 py-1.5 bg-white hover:bg-neutral-100 text-black font-extrabold text-[7.5px] uppercase tracking-widest transition-all flex items-center justify-center gap-0.5 rounded-none"
                    title="Export Specs"
                  >
                    <span className="material-icons-round text-[9px]">download</span>
                    Download Spec
                  </button>
                  <button 
                    onClick={() => triggerToast('COUTURE SPECS SYNCED WITH BLOCKCHAIN.')}
                    className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white font-extrabold text-[7.5px] uppercase tracking-widest transition-all rounded-none"
                  >
                    <span className="material-icons-round text-[9px]">share</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center p-6 relative z-10">
              {isGenerating ? (
                <div className="space-y-4">
                  {/* Customized couture loading spin */}
                  <div className="relative w-12 h-12 mx-auto flex items-center justify-center rounded-none">
                    <div className="absolute inset-0 rounded-none border border-black/10"></div>
                    <div className="absolute inset-0 rounded-none border border-t-black border-l-black animate-spin"></div>
                    <span className="material-icons-round text-lg text-black anim-pulse balance-pulse">change_history</span>
                  </div>
                  <div>
                    <span className="text-[9.5px] font-mono font-black uppercase tracking-[0.3em] text-neutral-800 block">GENERATING SYSTEM</span>
                    <span className="text-[7.5px] font-mono text-neutral-400 uppercase tracking-widest block mt-1.5">[ MINTING ON-THE-FLY MODEL ]</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 max-w-[200px] select-none">
                  <div className="w-10 h-10 bg-black/5 rounded-none border border-neutral-300 flex items-center justify-center mx-auto text-neutral-500">
                    <span className="material-icons-round text-lg">psychology</span>
                  </div>
                  <div>
                    <span className="text-[9.5px] font-mono font-black uppercase tracking-[0.25em] text-neutral-800 block">AI GENERATOR</span>
                    <span className="text-[7.5px] font-sans text-neutral-400 uppercase tracking-widest block leading-relaxed mt-1.5">
                      CHOOSE PERSONAL TRAITS ON THE LEFT PANEL, THEN PRESS BELOW TO GENERATE MODELS.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action bottom button */}
      <div className="shrink-0 pt-3 border-t border-[#E5E5E5]">
        <button
          onClick={generateNFT}
          disabled={isGenerating}
          className={`w-full py-4 rounded-none font-black uppercase text-[10.5px] tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-none relative overflow-hidden active:scale-95 disabled:opacity-50 ${
            isGenerating
              ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
              : 'bg-black text-[#5F3D94] hover:bg-neutral-900'
          }`}
        >
          {isGenerating ? (
            <>
              <span className="material-icons-round animate-spin text-sm">autorenew</span>
              <span>SYNCHRONIZING SPECS...</span>
            </>
          ) : (
            <>
              <span className="material-icons-round text-sm">auto_awesome</span>
              <span>GENERATE MODEL SPEC</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
