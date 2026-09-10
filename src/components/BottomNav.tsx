import React from 'react';
import { Home, Plus, Library, User, Crown } from 'lucide-react';
import { TabType } from '../types.js';

interface BottomNavProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  isOwner?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  isOwner = false,
}) => {
  return (
    <nav
      id="bottom-navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom,0px)]"
      aria-label="Navigasi Utama"
    >
      <div className="max-w-md mx-auto h-16 px-2 flex items-center justify-around relative">
        {/* Beranda */}
        <button
          id="nav-tab-home"
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            currentTab === 'home'
              ? 'text-pink-600 font-bold'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <Home
            className={`w-5 h-5 mb-1 transition-transform ${
              currentTab === 'home' ? 'scale-110 stroke-[2.5]' : ''
            }`}
          />
          <span className="text-[11px] tracking-tight">Beranda</span>
        </button>

        {/* Library */}
        <button
          id="nav-tab-library"
          onClick={() => onSelectTab('library')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            currentTab === 'library'
              ? 'text-pink-600 font-bold'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <Library
            className={`w-5 h-5 mb-1 transition-transform ${
              currentTab === 'library' ? 'scale-110 stroke-[2.5]' : ''
            }`}
          />
          <span className="text-[11px] tracking-tight">Library</span>
        </button>

        {/* Tambah */}
        <button
          id="nav-tab-add"
          onClick={() => onSelectTab('add')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
            currentTab === 'add'
              ? 'text-pink-600 font-bold'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center mb-0.5 transition-all ${
              currentTab === 'add'
                ? 'bg-gradient-to-tr from-pink-500 to-blue-500 text-white shadow-md shadow-pink-500/25 scale-105'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Plus className="w-4 h-4 stroke-[3]" />
          </div>
          <span className="text-[11px] tracking-tight">Tambah</span>
        </button>

        {/* Profil / Login */}
        <button
          id="nav-tab-profile"
          onClick={() => onSelectTab('profile')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors relative ${
            currentTab === 'profile'
              ? 'text-pink-600 font-bold'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <div className="relative">
            <User
              className={`w-5 h-5 mb-1 transition-transform ${
                currentTab === 'profile' ? 'scale-110 stroke-[2.5]' : ''
              }`}
            />
            {isOwner && (
              <Crown className="w-3 h-3 text-amber-500 fill-amber-400 absolute -top-1 -right-2" />
            )}
          </div>
          <span className="text-[11px] tracking-tight">
            {isOwner ? 'Owner' : 'Profil'}
          </span>
        </button>
      </div>
    </nav>
  );
};
