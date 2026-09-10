import React, { useState } from 'react';
import {
  Search,
  Play,
  Pause,
  Heart,
  Trash2,
  Clock,
  Music,
  PlusCircle,
  Filter,
} from 'lucide-react';
import { Song } from '../types.js';
import { usePlayer } from '../hooks/usePlayer.js';

interface LibraryViewProps {
  songs: Song[];
  isLoading: boolean;
  filter: string;
  onFilterChange: (filter: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onToggleFavorite: (song: Song) => void;
  onDeleteSong: (id: string) => void;
  onNavigateAdd: () => void;
  isOwner?: boolean;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  songs,
  isLoading,
  filter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  onToggleFavorite,
  onDeleteSong,
  onNavigateAdd,
  isOwner = false,
}) => {
  const { currentSong, isPlaying, togglePlay, setQueue } = usePlayer();
  const [songToDelete, setSongToDelete] = useState<Song | null>(null);

  const formatDuration = (secs: number) => {
    if (isNaN(secs) || secs <= 0) return '--:--';
    const mins = Math.floor(secs / 60);
    const rem = Math.floor(secs % 60);
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const handlePlaySong = (song: Song, index: number) => {
    if (currentSong?.id === song.id) {
      togglePlay();
    } else {
      setQueue(songs, index);
    }
  };

  const filterTabs = [
    { id: 'all', label: 'Semua' },
    { id: 'recent', label: 'Baru Ditambahkan' },
    { id: 'favorites', label: 'Favorit' },
  ];

  return (
    <div id="library-view" className="w-full max-w-md mx-auto px-4 pt-4 pb-36 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Library
          </h1>
          <p className="text-xs font-semibold text-slate-500">
            Koleksi musik pribadi tersimpan ({songs.length})
          </p>
        </div>
        <button
          id="library-header-add-btn"
          onClick={onNavigateAdd}
          className="p-2.5 rounded-full bg-pink-50 hover:bg-pink-100 text-pink-600 transition active:scale-95"
          aria-label="Tambah Musik"
        >
          <PlusCircle className="w-5 h-5" />
        </button>
      </div>

      {/* Search Input */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          id="library-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cari dalam library..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full w-5 h-5 flex items-center justify-center"
          >
            ✕
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1 scrollbar-none">
        {filterTabs.map((tab) => {
          const isActive = filter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onFilterChange(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition active:scale-95 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Song List */}
      {songs.length === 0 && !isLoading ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/80 shadow-sm my-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <Music className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            Tidak ada musik ditemukan
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            {filter === 'favorites'
              ? 'Belum ada lagu yang ditandai sebagai favorit. Klik ikon hati pada lagu untuk menambahkannya ke sini.'
              : 'Belum ada lagu di filter ini. Tambahkan musik baru sekarang.'}
          </p>
          <button
            onClick={onNavigateAdd}
            className="mt-4 px-4 py-2 bg-gradient-to-r from-pink-500 to-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition active:scale-95"
          >
            ＋ Tambah Musik
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-2 border border-slate-200/80 shadow-sm divide-y divide-slate-100">
          {songs.map((song, idx) => {
            const isCurrent = currentSong?.id === song.id;
            const isThisPlaying = isCurrent && isPlaying;

            return (
              <div
                key={`lib-song-${song.id}`}
                className={`p-2.5 rounded-2xl flex items-center gap-3 transition ${
                  isCurrent ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                }`}
              >
                {/* Cover & Play Indicator */}
                <div
                  onClick={() => handlePlaySong(song, idx)}
                  className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 relative flex-shrink-0 cursor-pointer shadow-sm group"
                >
                  <img
                    src={song.cover_url || '/assets/default-cover.svg'}
                    alt={song.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/default-cover.svg';
                    }}
                  />
                  <div
                    className={`absolute inset-0 flex items-center justify-center transition ${
                      isThisPlaying
                        ? 'bg-black/30 text-white'
                        : 'bg-black/20 opacity-0 group-hover:opacity-100 text-white'
                    }`}
                  >
                    {isThisPlaying ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current translate-x-0.5" />
                    )}
                  </div>
                </div>

                {/* Song Meta */}
                <div
                  onClick={() => handlePlaySong(song, idx)}
                  className="flex-1 min-w-0 cursor-pointer"
                >
                  <h3
                    className={`text-sm font-semibold truncate ${
                      isCurrent ? 'text-blue-600 font-bold' : 'text-slate-900'
                    }`}
                  >
                    {song.title}
                  </h3>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {song.artist} {song.album ? `• ${song.album}` : ''}
                  </p>
                </div>

                {/* Duration */}
                <div className="flex items-center text-xs text-slate-400 font-mono">
                  <Clock className="w-3 h-3 mr-1 inline opacity-60" />
                  <span>{formatDuration(song.duration)}</span>
                </div>

                {/* Actions: Favorite & Delete */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onToggleFavorite(song)}
                    className="p-1.5 text-slate-400 hover:text-pink-500 transition active:scale-90"
                    aria-label="Favorit"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        song.is_favorite === 1
                          ? 'text-pink-500 fill-pink-500'
                          : 'hover:text-slate-600'
                      }`}
                    />
                  </button>
                  {isOwner && (
                    <button
                      onClick={() => setSongToDelete(song)}
                      className="p-1.5 text-slate-300 hover:text-red-500 transition active:scale-90"
                      aria-label="Hapus Musik"
                      title="Hapus Musik (Akses Owner)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal (PRD Section 28) */}
      {songToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full shadow-2xl border border-slate-100 text-center animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 mx-auto flex items-center justify-center mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Hapus Musik?
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Apakah Anda yakin ingin menghapus <strong>"{songToDelete.title}"</strong> dari library Anda? Berkas audio dan sampul akan dihapus permanen.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setSongToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onDeleteSong(songToDelete.id);
                  setSongToDelete(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-md transition"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
