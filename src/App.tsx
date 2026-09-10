import React, { useState } from 'react';
import { TabType, Song } from './types.js';
import { useSongs } from './hooks/useSongs.js';
import { usePlayer } from './hooks/usePlayer.js';
import { useAuth } from './hooks/useAuth.js';
import { BottomNav } from './components/BottomNav.js';
import { MiniPlayer } from './components/MiniPlayer.js';
import { ExpandedPlayer } from './components/ExpandedPlayer.js';
import { HomeView } from './components/HomeView.js';
import { AddView } from './components/AddView.js';
import { LibraryView } from './components/LibraryView.js';
import { ProfileView } from './components/ProfileView.js';
import { ToastContainer } from './components/Toast.js';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('home');
  const [isExpandedPlayerOpen, setIsExpandedPlayerOpen] = useState(false);

  const { isOwner, user, login, logout } = useAuth();

  const {
    songs,
    isLoading,
    searchQuery,
    filter,
    toasts,
    removeToast,
    refetch,
    handleSearchChange,
    handleFilterChange,
    toggleFavorite,
    deleteSong,
  } = useSongs();

  const { currentSong } = usePlayer();

  const handleSongAdded = (newSong: Song) => {
    refetch();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-pink-500 selection:text-white relative">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Main Content Areas */}
      <main className="w-full">
        {currentTab === 'home' && (
          <HomeView
            songs={songs}
            isLoading={isLoading}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            onNavigateAdd={() => setCurrentTab('add')}
            onNavigateProfile={() => setCurrentTab('profile')}
            onToggleFavorite={toggleFavorite}
            onDeleteSong={deleteSong}
            isOwner={isOwner}
          />
        )}

        {currentTab === 'add' && (
          <AddView
            onSongAdded={handleSongAdded}
            onNavigateHome={() => setCurrentTab('home')}
          />
        )}

        {currentTab === 'library' && (
          <LibraryView
            songs={songs}
            isLoading={isLoading}
            filter={filter}
            onFilterChange={handleFilterChange}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            onToggleFavorite={toggleFavorite}
            onDeleteSong={deleteSong}
            onNavigateAdd={() => setCurrentTab('add')}
            isOwner={isOwner}
          />
        )}

        {currentTab === 'profile' && (
          <ProfileView
            songs={songs}
            isOwner={isOwner}
            ownerUsername={user?.username || 'fajarkeren'}
            onLogin={login}
            onLogout={logout}
            onNavigateHome={() => setCurrentTab('home')}
            onNavigateLibrary={() => setCurrentTab('library')}
          />
        )}
      </main>

      {/* Persistent Mini Player (Docked right above bottom navigation bar) */}
      <MiniPlayer onOpenExpanded={() => setIsExpandedPlayerOpen(true)} />

      {/* Fullscreen Expanded Player Modal */}
      <ExpandedPlayer
        isOpen={isExpandedPlayerOpen}
        onClose={() => setIsExpandedPlayerOpen(false)}
        onToggleFavorite={toggleFavorite}
      />

      {/* Persistent Bottom Navigation Bar */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isOwner={isOwner}
      />
    </div>
  );
}
