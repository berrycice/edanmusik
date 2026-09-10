import React, { useState } from 'react';
import {
  Search,
  Play,
  Pause,
  Heart,
  MoreVertical,
  Music,
  PlusCircle,
  Clock,
  Sparkles,
  Trash2,
  User,
  Crown,
} from 'lucide-react';
import { Song } from '../types.js';
import { usePlayer } from '../hooks/usePlayer.js';
import { PWAInstallButton } from './PWAInstallButton.js';

interface HomeViewProps {
  songs: Song[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onNavigateAdd: () => void;
  onToggleFavorite: (song: Song) => void;
  onDeleteSong: (id: string) => void;
  onNavigateProfile?: () => void;
  isOwner?: boolean;
}

export const HomeView: React.FC<HomeViewProps> = ({
  songs,
  isLoading,
  searchQuery,
  onSearchChange,
  onNavigateAdd,
  onToggleFavorite,
  onDeleteSong,
  onNavigateProfile,
  isOwner = false,
}) => {
  const { currentSong, isPlaying, togglePlay, loadSong, setQueue } = usePlayer();
  const [activeMenuSongId, setActiveMenuSongId] = useState<string | null>(null);

  // Dynamic greeting based on local device time
  const getDynamicGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return 'Selamat pagi';
    if (hour >= 11 && hour < 15) return 'Selamat siang';
    if (hour >= 15 && hour < 18) return 'Selamat sore';
    return 'Selamat malam';
  };

  const formatDuration = (secs: number) => {
    if (isNaN(secs) || secs <= 0) return '--:--';
    const mins = Math.floor(secs / 60);
    const rem = Math.floor(secs % 60);
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  // Play a song and populate queue
  const handlePlaySong = (song: Song, index: number, list: Song[]) => {
    if (currentSong?.id === song.id) {
      togglePlay();
    } else {
      setQueue(list, index);
    }
  };

  // Sections
  const favoriteSongs = songs.filter((s) => s.is_favorite === 1);
  const recentlyAddedSongs = [...songs].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ).slice(0, 8);

  const heroSong = currentSong || (songs.length > 0 ? songs[0] : null);

  return (
    <div id="home-view" className="w-full max-w-md mx-auto px-4 pt-4 pb-36 min-h-screen">
      {/* App Header & Greeting */}
      <header className="flex items-center justify-between mb-4 pt-1">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-pink-500 to-blue-500 flex items-center justify-center shadow-md">
              <Music className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              MUSIK
            </h1>
          </div>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            {getDynamicGreeting()}, siap mendengarkan musik?
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onNavigateProfile && (
            <button
              id="home-header-profile-btn"
              onClick={onNavigateProfile}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition active:scale-95 border ${
                isOwner
                  ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              title={isOwner ? 'Masuk sebagai Owner' : 'Profil & Login Owner'}
            >
              {isOwner ? (
                <>
                  <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                  <span>Owner</span>
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Profil</span>
                </>
              )}
            </button>
          )}
          <PWAInstallButton />
        </div>
      </header>

      {/* Realtime Search Bar with Debounce */}
      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          id="home-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cari musik, artis, atau album..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-sm placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 shadow-sm transition"
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

      {/* Empty State */}
      {songs.length === 0 && !isLoading && (
        <div
          id="home-empty-state"
          className="bg-white rounded-3xl p-8 text-center border border-slate-200/80 shadow-sm my-6"
        >
          <div className="w-16 h-16 rounded-2xl bg-pink-50 text-pink-500 mx-auto flex items-center justify-center mb-4 shadow-inner">
            <Music className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Belum ada musik</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Tambahkan musik pertama kamu ke library untuk mulai mendengarkan kapan saja.
          </p>
          <button
            id="home-empty-add-btn"
            onClick={onNavigateAdd}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-600 hover:to-blue-600 text-white text-xs font-bold rounded-xl shadow-md shadow-pink-500/20 transition active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>＋ Tambah Musik</span>
          </button>
        </div>
      )}

      {/* Hero / Current Music Card */}
      {heroSong && (
        <section id="hero-current-music" className="mb-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4 shadow-xl border border-slate-800">
            {/* Ambient background glow */}
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-pink-500/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex items-center gap-3.5">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-800 flex-shrink-0 relative shadow-md">
                <img
                  src={heroSong.cover_url || '/assets/default-cover.svg'}
                  alt={heroSong.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/default-cover.svg';
                  }}
                />
                {currentSong?.id === heroSong.id && isPlaying && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="flex gap-0.5 items-end h-4">
                      <span className="w-1 bg-pink-400 animate-bounce h-3 rounded-full" />
                      <span className="w-1 bg-blue-400 animate-bounce delay-100 h-4 rounded-full" />
                      <span className="w-1 bg-pink-400 animate-bounce delay-200 h-2 rounded-full" />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-pink-400 uppercase tracking-widest bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/20 mb-1">
                  <Sparkles className="w-3 h-3" />
                  {currentSong?.id === heroSong.id ? 'Sedang Diputar' : 'Dipilih Untukmu'}
                </span>
                <h2 className="text-base font-bold truncate text-white">
                  {heroSong.title}
                </h2>
                <p className="text-xs text-slate-300 truncate">
                  {heroSong.artist} • {heroSong.album || 'Single'}
                </p>
              </div>

              <button
                id="hero-play-pause-btn"
                onClick={() => handlePlaySong(heroSong, 0, songs)}
                className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-blue-500 hover:from-pink-600 hover:to-blue-600 text-white flex items-center justify-center shadow-lg shadow-pink-500/30 flex-shrink-0 active:scale-95 transition"
                aria-label={currentSong?.id === heroSong.id && isPlaying ? 'Pause' : 'Play'}
              >
                {currentSong?.id === heroSong.id && isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current translate-x-0.5" />
                )}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Section: Baru Ditambahkan (Horizontal Scroll Cards) */}
      {recentlyAddedSongs.length > 0 && (
        <section id="recently-added-section" className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Baru Ditambahkan
            </h2>
            <span className="text-xs font-semibold text-slate-400">
              {recentlyAddedSongs.length} lagu
            </span>
          </div>

          <div
            id="recently-added-scroll"
            className="flex gap-3.5 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory -mx-4 px-4"
          >
            {recentlyAddedSongs.map((song, idx) => {
              const isThisPlaying = currentSong?.id === song.id && isPlaying;
              return (
                <div
                  key={`recent-${song.id}`}
                  onClick={() => handlePlaySong(song, idx, recentlyAddedSongs)}
                  className="flex-shrink-0 w-36 snap-start bg-white rounded-2xl p-2.5 border border-slate-200/80 shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 active:scale-[0.98] group"
                >
                  <div className="w-full aspect-square rounded-xl overflow-hidden bg-slate-100 relative mb-2 shadow-inner">
                    <img
                      src={song.cover_url || '/assets/default-cover.svg'}
                      alt={song.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/default-cover.svg';
                      }}
                    />
                    <div
                      className={`absolute bottom-2 right-2 w-9 h-9 rounded-xl flex items-center justify-center transition shadow-md ${
                        isThisPlaying
                          ? 'bg-pink-600 text-white'
                          : 'bg-white/90 text-slate-900 backdrop-blur-sm opacity-90 group-hover:opacity-100'
                      }`}
                    >
                      {isThisPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current translate-x-0.5" />
                      )}
                    </div>
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 truncate leading-snug">
                    {song.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {song.artist}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Section: Favorites (Only displayed if favorites exist, per Section 39) */}
      {favoriteSongs.length > 0 && (
        <section id="favorites-section" className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Lagu Favorit
              </h2>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              {favoriteSongs.length} lagu
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {favoriteSongs.slice(0, 4).map((song, idx) => {
              const isThisPlaying = currentSong?.id === song.id && isPlaying;
              return (
                <div
                  key={`fav-${song.id}`}
                  onClick={() => handlePlaySong(song, idx, favoriteSongs)}
                  className="bg-white rounded-2xl p-2.5 flex items-center gap-2.5 border border-slate-200/80 shadow-sm hover:shadow cursor-pointer transition active:scale-[0.98]"
                >
                  <img
                    src={song.cover_url || '/assets/default-cover.svg'}
                    alt={song.title}
                    className="w-12 h-12 rounded-xl object-cover bg-slate-100 flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/default-cover.svg';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-bold text-slate-900 truncate">
                      {song.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {song.artist}
                    </p>
                  </div>
                  {isThisPlaying && (
                    <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse mr-1" />
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Section: Semua Musik (All Music List) */}
      {songs.length > 0 && (
        <section id="all-music-section" className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Semua Musik
            </h2>
            <span className="text-xs font-semibold text-slate-400">
              {songs.length} total
            </span>
          </div>

          <div className="bg-white rounded-3xl p-2 border border-slate-200/80 shadow-sm divide-y divide-slate-100">
            {songs.map((song, idx) => {
              const isCurrent = currentSong?.id === song.id;
              const isThisPlaying = isCurrent && isPlaying;
              const isMenuOpen = activeMenuSongId === song.id;

              return (
                <div
                  key={`all-${song.id}`}
                  className={`p-2.5 rounded-2xl flex items-center gap-3 transition relative ${
                    isCurrent ? 'bg-pink-50/70' : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Cover Artwork & Play Icon */}
                  <div
                    onClick={() => handlePlaySong(song, idx, songs)}
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

                  {/* Title & Artist */}
                  <div
                    onClick={() => handlePlaySong(song, idx, songs)}
                    className="flex-1 min-w-0 cursor-pointer"
                  >
                    <h3
                      className={`text-sm font-semibold truncate ${
                        isCurrent ? 'text-pink-600 font-bold' : 'text-slate-900'
                      }`}
                    >
                      {song.title}
                    </h3>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {song.artist}
                    </p>
                  </div>

                  {/* Duration */}
                  <div className="flex items-center text-xs text-slate-400 font-mono pr-1">
                    <Clock className="w-3 h-3 mr-1 inline opacity-60" />
                    <span>{formatDuration(song.duration)}</span>
                  </div>

                  {/* Favorite Toggle */}
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

                  {/* More Menu Toggle */}
                  <div className="relative">
                    <button
                      onClick={() => setActiveMenuSongId(isMenuOpen ? null : song.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 transition"
                      aria-label="Menu Opsi"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {isMenuOpen && (
                      <div
                        className="absolute right-0 top-8 z-30 w-36 bg-white rounded-2xl shadow-xl border border-slate-100 p-1.5 animate-in fade-in"
                        onMouseLeave={() => setActiveMenuSongId(null)}
                      >
                        <button
                          onClick={() => {
                            handlePlaySong(song, idx, songs);
                            setActiveMenuSongId(null);
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2"
                        >
                          <Play className="w-3.5 h-3.5" />
                          Putar
                        </button>
                        <button
                          onClick={() => {
                            onToggleFavorite(song);
                            setActiveMenuSongId(null);
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2"
                        >
                          <Heart className="w-3.5 h-3.5 text-pink-500" />
                          {song.is_favorite === 1 ? 'Hapus Favorit' : 'Jadikan Favorit'}
                        </button>
                        {isOwner && (
                          <button
                            onClick={() => {
                              onDeleteSong(song.id);
                              setActiveMenuSongId(null);
                            }}
                            className="w-full text-left px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Hapus
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
