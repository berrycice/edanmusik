import React from 'react';
import { Play, Pause, SkipForward, Music } from 'lucide-react';
import { usePlayer } from '../hooks/usePlayer.js';

interface MiniPlayerProps {
  onOpenExpanded: () => void;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({ onOpenExpanded }) => {
  const { currentSong, isPlaying, togglePlay, next, currentTime, duration } = usePlayer();

  if (!currentSong) {
    return null;
  }

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div
      id="mini-player-container"
      className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] left-0 right-0 z-30 px-3 pb-1"
    >
      <div
        id="mini-player"
        onClick={onOpenExpanded}
        className="max-w-md mx-auto bg-slate-900/95 text-white rounded-2xl p-2.5 flex items-center shadow-xl backdrop-blur-md cursor-pointer border border-slate-700/60 overflow-hidden relative group active:scale-[0.99] transition-transform"
      >
        {/* Slim progress bar on top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-pink-500 to-blue-500 transition-all duration-200"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Cover artwork */}
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0 relative mr-3 shadow">
          {currentSong.cover_url ? (
            <img
              src={currentSong.cover_url}
              alt={currentSong.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/assets/default-cover.svg';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-800 text-pink-400">
              <Music className="w-6 h-6" />
            </div>
          )}
          {isPlaying && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
            </div>
          )}
        </div>

        {/* Title and Artist */}
        <div className="flex-1 min-w-0 pr-2">
          <h4 className="text-sm font-semibold text-white truncate leading-snug">
            {currentSong.title}
          </h4>
          <p className="text-xs text-slate-400 truncate mt-0.5">
            {currentSong.artist}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <button
            id="mini-player-play-pause"
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-slate-800 transition active:scale-95"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current translate-x-0.5" />
            )}
          </button>

          <button
            id="mini-player-next"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition active:scale-95"
            aria-label="Lagu Berikutnya"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
