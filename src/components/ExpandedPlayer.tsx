import React, { useState } from 'react';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  Volume2,
  VolumeX,
  ListMusic,
  Music,
} from 'lucide-react';
import { usePlayer } from '../hooks/usePlayer.js';
import { Song } from '../types.js';

interface ExpandedPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  onToggleFavorite?: (song: Song) => void;
}

export const ExpandedPlayer: React.FC<ExpandedPlayerProps> = ({
  isOpen,
  onClose,
  onToggleFavorite,
}) => {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    shuffle,
    repeat,
    queue,
    togglePlay,
    next,
    previous,
    seek,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    loadSong,
  } = usePlayer();

  const [showQueue, setShowQueue] = useState(false);

  if (!isOpen || !currentSong) {
    return null;
  }

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    seek(val);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
  };

  return (
    <div
      id="expanded-player-modal"
      className="fixed inset-0 z-50 bg-slate-950/95 text-white backdrop-blur-xl flex flex-col justify-between overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="max-w-md w-full mx-auto flex-1 flex flex-col justify-between p-6 pb-12">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pt-2">
          <button
            id="expanded-player-back-btn"
            onClick={onClose}
            className="p-2 -ml-2 rounded-full hover:bg-white/10 transition active:scale-95 text-slate-300 hover:text-white"
            aria-label="Tutup Player"
          >
            <ChevronDown className="w-7 h-7" />
          </button>

          <div className="text-center">
            <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">
              Memutar dari Library
            </span>
            <p className="text-xs font-medium text-pink-400 truncate max-w-[200px]">
              {currentSong.album || 'MUSIK'}
            </p>
          </div>

          <button
            id="expanded-player-queue-toggle"
            onClick={() => setShowQueue(!showQueue)}
            className={`p-2 -mr-2 rounded-full transition active:scale-95 ${
              showQueue ? 'text-pink-400 bg-white/10' : 'text-slate-300 hover:text-white'
            }`}
            aria-label="Daftar Putar"
          >
            <ListMusic className="w-6 h-6" />
          </button>
        </div>

        {showQueue ? (
          /* Queue View */
          <div className="flex-1 my-6 overflow-y-auto max-h-[50vh] bg-slate-900/60 rounded-3xl p-4 border border-slate-800">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">
              Antrean Putar ({queue.length})
            </h3>
            <div className="space-y-2">
              {queue.map((item, idx) => {
                const isCurrent = item.id === currentSong.id;
                return (
                  <div
                    key={`${item.id}-${idx}`}
                    onClick={() => {
                      loadSong(item, true);
                      setShowQueue(false);
                    }}
                    className={`flex items-center p-2.5 rounded-2xl cursor-pointer transition ${
                      isCurrent ? 'bg-pink-600/20 text-pink-300 border border-pink-500/30' : 'hover:bg-white/5 text-slate-300'
                    }`}
                  >
                    <img
                      src={item.cover_url || '/assets/default-cover.svg'}
                      alt={item.title}
                      className="w-10 h-10 rounded-lg object-cover mr-3 bg-slate-800 flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/default-cover.svg';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isCurrent ? 'text-pink-400' : 'text-white'}`}>
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{item.artist}</p>
                    </div>
                    {isCurrent && isPlaying && (
                      <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse ml-2" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Large Cover Artwork */
          <div className="my-auto py-6 flex flex-col items-center justify-center">
            <div className="w-72 h-72 sm:w-80 sm:h-80 rounded-3xl overflow-hidden shadow-2xl shadow-pink-500/10 border border-slate-800 relative group transition-transform duration-300">
              {currentSong.cover_url ? (
                <img
                  src={currentSong.cover_url}
                  alt={currentSong.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/default-cover.svg';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-900 text-pink-400">
                  <Music className="w-20 h-20" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Title, Artist, and Favorite button */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-2xl font-bold text-white tracking-tight truncate leading-tight">
              {currentSong.title}
            </h2>
            <p className="text-base text-slate-400 font-medium truncate mt-1">
              {currentSong.artist}
            </p>
          </div>

          <button
            id="expanded-player-fav-btn"
            onClick={() => onToggleFavorite && onToggleFavorite(currentSong)}
            className="p-3 rounded-full hover:bg-white/10 transition active:scale-90"
            aria-label="Favorit"
          >
            <Heart
              className={`w-7 h-7 transition-colors ${
                currentSong.is_favorite === 1
                  ? 'text-pink-500 fill-pink-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            />
          </button>
        </div>

        {/* Scrubable Seek Bar and Timestamps */}
        <div className="mb-6">
          <div className="relative group flex items-center">
            <input
              id="player-seek-slider"
              type="range"
              min={0}
              max={duration || currentSong.duration || 100}
              step={0.5}
              value={currentTime}
              onChange={handleSeekChange}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-pink-500 hover:accent-pink-400 transition-all focus:outline-none"
            />
          </div>
          <div className="flex justify-between text-xs font-mono text-slate-400 mt-2">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration || currentSong.duration || 0)}</span>
          </div>
        </div>

        {/* Main Playback Controls: Repeat, Previous, Play/Pause, Next, Shuffle */}
        <div className="flex items-center justify-between px-2 mb-6">
          {/* Repeat Button */}
          <button
            id="expanded-player-repeat-btn"
            onClick={cycleRepeat}
            className={`p-2.5 rounded-full transition active:scale-95 relative ${
              repeat !== 'OFF' ? 'text-pink-400' : 'text-slate-500 hover:text-slate-300'
            }`}
            title={`Mode Ulangi: ${repeat}`}
          >
            {repeat === 'ONE' ? (
              <Repeat1 className="w-6 h-6" />
            ) : (
              <Repeat className="w-6 h-6" />
            )}
            {repeat === 'ALL' && (
              <span className="absolute bottom-1 right-2 w-1.5 h-1.5 rounded-full bg-pink-500" />
            )}
          </button>

          {/* Previous Button */}
          <button
            id="expanded-player-prev-btn"
            onClick={previous}
            className="p-3 text-slate-200 hover:text-white transition active:scale-90"
            aria-label="Sebelumnya"
          >
            <SkipBack className="w-8 h-8 fill-current" />
          </button>

          {/* Large Play/Pause Button */}
          <button
            id="expanded-player-play-btn"
            onClick={togglePlay}
            className="w-20 h-20 rounded-full bg-gradient-to-tr from-pink-500 to-blue-500 hover:from-pink-600 hover:to-blue-600 text-white flex items-center justify-center shadow-xl shadow-pink-500/25 active:scale-95 transition-all"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 fill-current" />
            ) : (
              <Play className="w-8 h-8 fill-current translate-x-0.5" />
            )}
          </button>

          {/* Next Button */}
          <button
            id="expanded-player-next-btn"
            onClick={next}
            className="p-3 text-slate-200 hover:text-white transition active:scale-90"
            aria-label="Berikutnya"
          >
            <SkipForward className="w-8 h-8 fill-current" />
          </button>

          {/* Shuffle Button */}
          <button
            id="expanded-player-shuffle-btn"
            onClick={toggleShuffle}
            className={`p-2.5 rounded-full transition active:scale-95 relative ${
              shuffle ? 'text-dodger-blue text-blue-400' : 'text-slate-500 hover:text-slate-300'
            }`}
            title={shuffle ? 'Acak Aktif' : 'Acak Mati'}
          >
            <Shuffle className="w-6 h-6" />
            {shuffle && (
              <span className="absolute bottom-1 right-2 w-1.5 h-1.5 rounded-full bg-blue-400" />
            )}
          </button>
        </div>

        {/* Volume Slider */}
        <div className="flex items-center gap-3 px-4 pt-2 text-slate-400">
          <button
            id="expanded-player-mute-btn"
            onClick={toggleMute}
            className="hover:text-white transition"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-5 h-5 text-red-400" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>
          <input
            id="player-volume-slider"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
          />
        </div>
      </div>
    </div>
  );
};
