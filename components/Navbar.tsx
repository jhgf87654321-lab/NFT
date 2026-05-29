
import React from 'react';
import { View } from '../types';

interface NavbarProps {
  activeView: View;
  onViewChange: (view: View) => void;
}

const Navbar: React.FC<NavbarProps> = ({ activeView, onViewChange }) => {
  return (
    <>
      {/* 
        1. Desktop Side Navigation Layout 
        Sitting on the left side of the screen, echoing Nike & modcard.asia.
      */}
      <aside className="hidden md:flex flex-col w-16 h-full bg-white border-r border-[#E5E5E5] shrink-0 select-none z-[130] py-6 justify-between items-center relative gap-6">
        {/* Top Branding Block */}
        <div className="flex flex-col items-center">
          <div 
            onClick={() => onViewChange(View.HOME)}
            className="w-10 h-10 bg-black rounded flex items-center justify-center cursor-pointer hover:rotate-90 transition-transform duration-500 shadow-sm"
          >
            {/* White diamond outline */}
            <div className="w-5.5 h-5.5 border-[1.5px] border-white rotate-45 flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-white"></div>
            </div>
          </div>
        </div>

        {/* Middle Pages Navigation Index */}
        <nav className="flex flex-col items-center gap-6 w-full">
          {/* PORTAL (OH) */}
          <button 
            onClick={() => onViewChange(View.HOME)}
            className={`group w-full flex flex-col items-center gap-0.5 transition-all relative py-1 focus:outline-none ${activeView === View.HOME ? 'text-black font-black' : 'text-neutral-400 hover:text-black'}`}
          >
            <span className="material-icons-round text-[19px]">home</span>
            <span className="text-[7px] font-mono tracking-widest font-black leading-none mt-1">OH</span>
          </button>

          {/* TRY_ON (3D) */}
          <button 
            onClick={() => onViewChange(View.TRY_ON)}
            className={`group w-full flex flex-col items-center gap-0.5 transition-all relative py-1 focus:outline-none ${activeView === View.TRY_ON ? 'text-black font-black' : 'text-neutral-400 hover:text-black'}`}
          >
            <span className="material-icons-round text-[19px]">layers</span>
            <span className="text-[7px] font-mono tracking-widest font-black leading-none mt-1">3D</span>
          </button>

          {/* CREATOR (VI) */}
          <button 
            onClick={() => onViewChange(View.CREATOR)}
            className={`group w-full flex flex-col items-center gap-0.5 transition-all relative py-1 focus:outline-none ${activeView === View.CREATOR ? 'text-black font-black' : 'text-neutral-400 hover:text-black'}`}
          >
            <span className="material-icons-round text-[19px]">videocam</span>
            <span className="text-[7px] font-mono tracking-widest font-black leading-none mt-1">VI</span>
          </button>

          {/* STORE/SE (SE) */}
          <button 
            onClick={() => onViewChange(View.STORE)}
            className={`group w-full flex flex-col items-center gap-0.5 transition-all relative py-1 focus:outline-none ${activeView === View.STORE ? 'text-black font-black' : 'text-neutral-400 hover:text-black'}`}
          >
            <span className="material-icons-round text-[19px]">settings</span>
            <span className="text-[7px] font-mono tracking-widest font-black leading-none mt-1">SE</span>
          </button>
        </nav>

        {/* Bottom BGM & Profile Block */}
        <div className="flex flex-col items-center gap-4 w-full">
          {/* BGM Trigger */}
          <button 
            onClick={() => alert('BGM system active. Playing procedural runway ambient drone...')}
            className="group flex flex-col items-center gap-0.5 text-neutral-450 hover:text-red-500 transition-all focus:outline-none"
          >
            <span className="material-icons-round text-sm">play_arrow</span>
            <span className="text-[7px] font-mono tracking-widest font-black leading-none mt-0.5">BGM</span>
          </button>

          {/* System status / 00 */}
          <div className="flex flex-col items-center gap-0.5 text-neutral-450 transition-all select-none">
            <span className="material-icons-round text-[14px]">pause</span>
            <span className="text-[7px] font-mono tracking-widest font-black leading-none mt-0.5">00</span>
          </div>

          {/* Custom Avatar "J" Block */}
          <div className="w-10 h-10 bg-black rounded flex items-center justify-center text-white text-[15px] font-serif font-black select-none border border-black shadow-sm">
            J
          </div>
        </div>
      </aside>

      {/* 
        2. Mobile Bottom Pill Bar Layout 
        Styled as a beautiful float floating capsule.
      */}
      <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-sm z-[150] shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-black/5 rounded-full bg-white/95 backdrop-blur-2xl px-2 py-1.5 flex items-center justify-around h-15">
        <button 
          onClick={() => onViewChange(View.HOME)}
          className={`flex flex-col items-center gap-0.5 transition-all ${activeView === View.HOME ? 'text-black scale-105 font-black' : 'text-black/35 hover:text-black/70'}`}
        >
          <span className="material-icons-round text-[18px]">home</span>
          <span className="text-[6.5px] font-black uppercase tracking-wider font-space leading-none">PORTAL</span>
        </button>

        <button 
          onClick={() => onViewChange(View.STORE)}
          className={`flex flex-col items-center gap-0.5 transition-all ${activeView === View.STORE ? 'text-black scale-105 font-black' : 'text-black/35 hover:text-black/70'}`}
        >
          <span className="material-icons-round text-[18px]">shopping_bag</span>
          <span className="text-[6.5px] font-black uppercase tracking-wider font-space leading-none">STORE</span>
        </button>

        <button 
          onClick={() => onViewChange(View.TRY_ON)}
          className="w-11 h-11 rounded-full bg-black text-white shadow-[0_8px_16px_rgba(0,0,0,0.15)] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform relative group"
        >
          <span className="material-icons-round text-[20px] text-[#D4FF00]">view_in_ar</span>
        </button>

        <button 
          onClick={() => onViewChange(View.WARDROBE)}
          className={`flex flex-col items-center gap-0.5 transition-all ${activeView === View.WARDROBE ? 'text-black scale-105 font-black' : 'text-black/35 hover:text-black/70'}`}
        >
          <span className="material-icons-round text-[18px]">checkroom</span>
          <span className="text-[6.5px] font-black uppercase tracking-wider font-space leading-none">VAULT</span>
        </button>

        <button 
          onClick={() => onViewChange(View.CREATOR)}
          className={`flex flex-col items-center gap-0.5 transition-all ${activeView === View.CREATOR ? 'text-black scale-105 font-black' : 'text-black/35 hover:text-black/70'}`}
        >
          <span className="material-icons-round text-[18px]">person_outline</span>
          <span className="text-[6.5px] font-black uppercase tracking-wider font-space leading-none">STUDIO</span>
        </button>
      </nav>
    </>
  );
};

export default Navbar;
