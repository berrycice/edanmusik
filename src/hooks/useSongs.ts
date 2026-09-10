import { useState, useEffect, useCallback, useRef } from 'react';
import { Song, ToastMessage } from '../types.js';
import { musikPlayer } from '../services/player.js';
import { apiFetch, initAuth } from '../utils/api.js';

export function useSongs(initialFilter = 'all') {
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filter, setFilter] = useState<string>(initialFilter);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const fetchSongs = useCallback(async (search = searchQuery, currentFilter = filter) => {
    setIsLoading(true);
    setError(null);
    try {
      // Ensure auth is initialized
      await initAuth();

      const params = new URLSearchParams();
      if (search && search.trim()) params.append('q', search.trim());
      if (currentFilter && currentFilter !== 'all') params.append('filter', currentFilter);

      const res = await apiFetch(`/api/music?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.songs)) {
        setSongs(data.songs);
      }
    } catch (err: any) {
      console.error('Failed to load songs:', err);
      setError(err.message || 'Gagal memuat musik');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, filter]);

  // Debounced search
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchSongs(q, filter);
    }, 300);
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    fetchSongs(searchQuery, newFilter);
  };

  useEffect(() => {
    fetchSongs();
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  const toggleFavorite = async (song: Song) => {
    const newStatus = song.is_favorite === 1 ? 0 : 1;
    // Optimistic update
    setSongs((prev) =>
      prev.map((s) => (s.id === song.id ? { ...s, is_favorite: newStatus } : s))
    );

    try {
      const res = await apiFetch(`/api/music/${song.id}/favorite`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_favorite: Boolean(newStatus) }),
      });

      if (!res.ok) throw new Error('Gagal memperbarui favorit');

      if (newStatus === 1) {
        addToast('Ditambahkan ke favorit.', 'success');
      } else {
        addToast('Dihapus dari favorit.', 'info');
      }
    } catch (err: any) {
      // Revert optimistic update
      setSongs((prev) =>
        prev.map((s) => (s.id === song.id ? { ...s, is_favorite: song.is_favorite } : s))
      );
      addToast('Gagal mengubah status favorit', 'error');
    }
  };

  const deleteSong = async (id: string) => {
    try {
      // PRD Section 28: Jika lagu sedang dimainkan: stop.
      musikPlayer.stopIfPlaying(id);

      const res = await apiFetch(`/api/music/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Gagal menghapus musik');

      setSongs((prev) => prev.filter((s) => s.id !== id));
      addToast('Musik dihapus.', 'info');
      return true;
    } catch (err: any) {
      addToast('Gagal menghapus musik: ' + err.message, 'error');
      return false;
    }
  };

  return {
    songs,
    isLoading,
    error,
    searchQuery,
    filter,
    toasts,
    addToast,
    removeToast,
    refetch: fetchSongs,
    handleSearchChange,
    handleFilterChange,
    toggleFavorite,
    deleteSong,
  };
}
