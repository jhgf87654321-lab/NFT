import React, { useState } from 'react';

interface WardrobeVaultProps {
  myCyberCollection: any[];
  handleSelectSavedItem: (nft: any) => void;
  handleRecycle: (index: number) => void;
  triggerToast: (msg: string) => void;
}

export const WardrobeVault: React.FC<WardrobeVaultProps> = ({
  myCyberCollection,
  handleSelectSavedItem,
  handleRecycle,
  triggerToast,
}) => {
  const [activeTab, setActiveTab] = useState<'All' | 'Liked'>('All');
  const [searchFilter, setSearchFilter] = useState('');

  // Sift collections by query and segment tab
  const filteredCollection = myCyberCollection.filter((nft) => {
    const matchesSearch = nft.theme?.toLowerCase().includes(searchFilter.toLowerCase()) || 
                          nft.serialNumber?.toLowerCase().includes(searchFilter.toLowerCase());
    
    if (activeTab === 'Liked') {
      return matchesSearch && nft.isSpecial; // Treat Special/Legendary as liked or featured
    }
    return matchesSearch;
  });

  return (
    <div className="lg:col-span-4 w-full h-full max-h-[85vh] flex flex-col bg-[#FAF9F6] text-black overflow-y-auto no-scrollbar relative p-5 border-t lg:border-t-0 rounded-none">
      <div>
        {/* Title specs mimicking modcard.asia design record registry */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E5E5E5] mb-4">
          <div className="flex items-center gap-2">
            <span className="material-icons-round text-sm">favorite_border</span>
            <span className="text-[10px] font-bold tracking-wider uppercase font-mono text-neutral-800 font-bold">WARDROBE ARCHIVE</span>
          </div>
          <span className="bg-primary text-white text-[8px] font-mono font-bold px-2 py-0.5 rounded-none">{myCyberCollection.length} SPEC-CARDS</span>
        </div>

        {/* Filter Tab & Search Specs Bar */}
        <div className="flex border border-neutral-300 p-0.5 mb-4 gap-0.5 bg-neutral-100 rounded-none">
          <button
            onClick={() => setActiveTab('All')}
            className={`flex-1 py-1 text-[8.5px] font-extrabold uppercase tracking-widest rounded-none transition-all ${
              activeTab === 'All' ? 'bg-primary text-white' : 'text-neutral-550 hover:text-black hover:bg-neutral-200'
            }`}
          >
            All SPEC
          </button>
          <button
            onClick={() => setActiveTab('Liked')}
            className={`flex-1 py-1 text-[8.5px] font-extrabold uppercase tracking-widest rounded-none transition-all ${
              activeTab === 'Liked' ? 'bg-primary text-white' : 'text-neutral-550 hover:text-black hover:bg-neutral-200'
            }`}
          >
            LEGENDARY
          </button>
        </div>

        {/* Search Input bar */}
        <div className="relative mb-4">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-icons-round text-sm text-neutral-400">search</span>
          <input
            type="text"
            placeholder="SEARCH REGISTRY..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full bg-white border border-neutral-300 rounded-none pl-9 pr-4 py-2 text-[9px] font-bold text-neutral-800 uppercase tracking-widest placeholder:text-neutral-300 focus:outline-none focus:border-primary font-mono"
          />
        </div>

        {/* Live Wardrobe grid cards */}
        <div className="grid grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-0.5 no-scrollbar">
          {filteredCollection.length > 0 ? (
            filteredCollection.map((nft, index) => (
              <div 
                key={nft.serialNumber || index}
                className="group bg-white border border-neutral-205 rounded-none p-2 shadow-none hover:border-primary transition-all relative flex flex-col justify-between"
              >
                {/* Visual Image container */}
                <div className="relative aspect-[3/4] bg-neutral-100 rounded-none overflow-hidden mb-2">
                  <img
                    src={nft.image}
                    alt={nft.theme}
                    className="w-full h-full object-contain object-center bg-neutral-50 transition-transform duration-300 group-hover:scale-[1.02]"
                    referrerPolicy="no-referrer"
                  />
                  {/* Select button Overlay on hover */}
                  <div className="absolute inset-0 bg-primary/60 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-1 z-20">
                    <button
                      onClick={() => handleSelectSavedItem(nft)}
                      className="px-2.5 py-1.5 bg-[#5F3D94] hover:bg-white hover:text-black text-white rounded-none text-[8px] font-black uppercase tracking-widest transition-all scale-95 group-hover:scale-100"
                    >
                      Retrieve
                    </button>
                    <button
                      onClick={() => handleRecycle(index)}
                      className="p-1 px-[8px] bg-red-600 hover:bg-red-700 text-white rounded-none text-[9px] font-bold transition-all"
                      title="Recycle Spec"
                    >
                      <span className="material-icons-round text-xs">delete</span>
                    </button>
                  </div>

                  {/* Serial Spec tag */}
                  <div className="absolute top-2 right-2 bg-primary/85 text-white text-[6px] font-mono font-bold px-1.5 py-0.5 rounded-none uppercase">
                    {nft.serialNumber || '#GEN-01'}
                  </div>
                </div>

                <div className="flex flex-col select-none pt-1">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-tight text-neutral-900 leading-none truncate mb-1">
                    {nft.theme ? (nft.theme.length > 15 ? nft.theme.substring(0, 15) + '...' : nft.theme) : 'Couture Design'}
                  </span>
                  <span className="text-[6.5px] font-mono text-neutral-400 uppercase tracking-widest font-black leading-none">
                    {nft.isSpecial ? 'LEGENDARY' : 'COMMON'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 border border-dashed border-neutral-300 rounded-none p-6 flex flex-col items-center justify-center text-center py-24 select-none">
              <span className="material-icons-round text-3xl text-neutral-300 mb-2 font-light">grid_view</span>
              <span className="text-[9px] font-black uppercase tracking-widest text-neutral-800 block mb-0.5">VAULT EMPTY</span>
              <span className="text-[7.5px] text-neutral-450 uppercase tracking-widest font-mono leading-relaxed max-w-[150px]">
                GENERATE MODEL CARD TO STORE COUTURE PRESETS.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Sync Footer Utilities */}
      <div className="mt-5 pt-3.5 border-t border-[#E5E5E5] flex flex-col gap-2 select-none">
        <div className="flex justify-between items-center text-[7.5px] font-black uppercase text-neutral-400 tracking-wider font-mono">
          <span>COUTURE SPECTRA SYNCHRONY</span>
          <span className="text-black font-semibold">MOD.NODE // KEY</span>
        </div>
        <div className="flex gap-1.5">
          <button 
            onClick={() => triggerToast('WARDROBE VAULT SHIELD SYNCHRONIZED.')}
            className="flex-1 py-2 rounded-none bg-primary hover:bg-primary/90 text-white font-extrabold text-[7.5px] uppercase tracking-widest transition-all flex items-center justify-center gap-1 active:scale-95"
          >
            <span className="material-icons-round text-[9px]">sync</span>
            Sync Node
          </button>
          <button 
            onClick={() => triggerToast('EXPORTING ARCHIVES SECURELY.')}
            className="px-3 py-2 rounded-none bg-white border border-neutral-300 hover:bg-neutral-105 text-black font-extrabold text-[7.5px] uppercase tracking-widest transition-all flex items-center justify-center active:scale-95"
            title="Export Spec Archive"
          >
            <span className="material-icons-round text-[10px]">share</span>
          </button>
        </div>
      </div>
    </div>
  );
};
