import { Song, PlayerState, RepeatMode } from '../types.js';

type Listener = (state: PlayerState) => void;

class GlobalMusikPlayer {
  private audio: HTMLAudioElement;
  private listeners: Set<Listener> = new Set();
  private state: PlayerState = {
    currentSong: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    shuffle: false,
    repeat: 'OFF',
    queue: [],
    queueIndex: -1,
    isLoading: false,
  };

  constructor() {
    this.audio = new Audio();
    this.audio.preload = 'metadata';
    this.restorePreferences();
    this.setupAudioEvents();
    this.setupMediaSession();
  }

  private restorePreferences() {
    try {
      const vol = localStorage.getItem('musik_volume');
      if (vol !== null) {
        const parsedVol = parseFloat(vol);
        if (!isNaN(parsedVol)) {
          this.state.volume = Math.max(0, Math.min(1, parsedVol));
          this.audio.volume = this.state.volume;
        }
      }
      const shuff = localStorage.getItem('musik_shuffle');
      if (shuff !== null) {
        this.state.shuffle = shuff === 'true';
      }
      const rep = localStorage.getItem('musik_repeat') as RepeatMode | null;
      if (rep && (rep === 'OFF' || rep === 'ALL' || rep === 'ONE')) {
        this.state.repeat = rep;
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  private savePreferences() {
    try {
      localStorage.setItem('musik_volume', String(this.state.volume));
      localStorage.setItem('musik_shuffle', String(this.state.shuffle));
      localStorage.setItem('musik_repeat', this.state.repeat);
      if (this.state.currentSong) {
        localStorage.setItem('musik_currentSongId', this.state.currentSong.id);
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  private setupAudioEvents() {
    this.audio.addEventListener('play', () => {
      this.state.isPlaying = true;
      this.state.isLoading = false;
      this.updateMediaSessionPlayback('playing');
      this.emitChange();
    });

    this.audio.addEventListener('pause', () => {
      this.state.isPlaying = false;
      this.updateMediaSessionPlayback('paused');
      this.emitChange();
    });

    this.audio.addEventListener('waiting', () => {
      this.state.isLoading = true;
      this.emitChange();
    });

    this.audio.addEventListener('playing', () => {
      this.state.isLoading = false;
      this.emitChange();
    });

    this.audio.addEventListener('timeupdate', () => {
      this.state.currentTime = this.audio.currentTime;
      this.updateMediaSessionPosition();
      this.emitChange();
    });

    this.audio.addEventListener('durationchange', () => {
      if (this.audio.duration && !isNaN(this.audio.duration)) {
        this.state.duration = this.audio.duration;
        this.emitChange();
      }
    });

    this.audio.addEventListener('ended', () => {
      this.handleSongEnded();
    });

    this.audio.addEventListener('error', (e) => {
      console.error('Audio playback error:', e);
      this.state.isLoading = false;
      this.state.isPlaying = false;
      this.emitChange();
    });
  }

  private handleSongEnded() {
    if (this.state.repeat === 'ONE') {
      this.audio.currentTime = 0;
      this.audio.play().catch(console.error);
    } else {
      this.next();
    }
  }

  private setupMediaSession() {
    if (!('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.setActionHandler('play', () => this.play());
      navigator.mediaSession.setActionHandler('pause', () => this.pause());
      navigator.mediaSession.setActionHandler('previoustrack', () => this.previous());
      navigator.mediaSession.setActionHandler('nexttrack', () => this.next());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined && details.seekTime !== null) {
          this.seek(details.seekTime);
        }
      });
      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        const skip = details.seekOffset || 10;
        this.seek(Math.max(0, this.audio.currentTime - skip));
      });
      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        const skip = details.seekOffset || 10;
        this.seek(Math.min(this.state.duration, this.audio.currentTime + skip));
      });
    } catch (err) {
      console.warn('Error configuring MediaSession action handlers:', err);
    }
  }

  private updateMediaSessionMetadata(song: Song) {
    if (!('mediaSession' in navigator)) return;

    try {
      const origin = window.location.origin;
      const artworkSrc = song.cover_url
        ? (song.cover_url.startsWith('http') ? song.cover_url : `${origin}${song.cover_url}`)
        : `${origin}/assets/icon-512.png`;

      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.title,
        artist: song.artist,
        album: song.album || 'MUSIK',
        artwork: [
          { src: artworkSrc, sizes: '96x96', type: 'image/jpeg' },
          { src: artworkSrc, sizes: '128x128', type: 'image/jpeg' },
          { src: artworkSrc, sizes: '192x192', type: 'image/jpeg' },
          { src: artworkSrc, sizes: '256x256', type: 'image/jpeg' },
          { src: artworkSrc, sizes: '384x384', type: 'image/jpeg' },
          { src: artworkSrc, sizes: '512x512', type: 'image/jpeg' },
        ],
      });
    } catch (err) {
      console.warn('Error updating MediaSession metadata:', err);
    }
  }

  private updateMediaSessionPlayback(state: 'playing' | 'paused' | 'none') {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.playbackState = state;
    } catch (err) {
      console.warn('Error setting playback state:', err);
    }
  }

  private updateMediaSessionPosition() {
    if (!('mediaSession' in navigator) || !('setPositionState' in navigator.mediaSession)) return;
    try {
      if (this.state.duration > 0 && !isNaN(this.state.currentTime)) {
        navigator.mediaSession.setPositionState({
          duration: this.state.duration,
          playbackRate: this.audio.playbackRate || 1,
          position: Math.min(this.state.currentTime, this.state.duration),
        });
      }
    } catch {
      // Silently ignore position state errors
    }
  }

  public init() {
    // Already initialized in constructor
    return this.getState();
  }

  public setQueue(queue: Song[], startIndex = 0) {
    this.state.queue = [...queue];
    this.state.queueIndex = startIndex;
    if (queue[startIndex]) {
      this.loadSong(queue[startIndex], true);
    }
  }

  public async loadSong(song: Song, autoPlay = true) {
    if (this.state.currentSong?.id === song.id && !this.audio.paused) {
      return;
    }

    this.state.currentSong = song;
    this.state.isLoading = true;
    this.state.currentTime = 0;
    this.state.duration = song.duration || 0;

    // Update queue index if present
    const idx = this.state.queue.findIndex((s) => s.id === song.id);
    if (idx !== -1) {
      this.state.queueIndex = idx;
    } else {
      this.state.queue = [song, ...this.state.queue];
      this.state.queueIndex = 0;
    }

    this.savePreferences();
    this.updateMediaSessionMetadata(song);

    // Audio stream URL
    this.audio.src = song.stream_url;
    this.audio.load();

    this.emitChange();

    if (autoPlay) {
      try {
        await this.audio.play();
      } catch (err) {
        console.warn('Autoplay prevented or interrupted:', err);
      }
    }
  }

  public async play() {
    if (!this.state.currentSong && this.state.queue.length > 0) {
      await this.loadSong(this.state.queue[0], true);
      return;
    }
    if (this.audio.src) {
      try {
        await this.audio.play();
      } catch (err) {
        console.warn('Play request failed:', err);
      }
    }
  }

  public pause() {
    this.audio.pause();
  }

  public togglePlay() {
    if (this.state.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public next() {
    if (this.state.queue.length === 0) return;

    if (this.state.shuffle) {
      let randomIndex = Math.floor(Math.random() * this.state.queue.length);
      if (this.state.queue.length > 1 && randomIndex === this.state.queueIndex) {
        randomIndex = (randomIndex + 1) % this.state.queue.length;
      }
      this.state.queueIndex = randomIndex;
      this.loadSong(this.state.queue[randomIndex], true);
      return;
    }

    const nextIndex = this.state.queueIndex + 1;
    if (nextIndex < this.state.queue.length) {
      this.state.queueIndex = nextIndex;
      this.loadSong(this.state.queue[nextIndex], true);
    } else if (this.state.repeat === 'ALL') {
      this.state.queueIndex = 0;
      this.loadSong(this.state.queue[0], true);
    } else {
      // Stopped at end of queue
      this.pause();
      this.seek(0);
    }
  }

  public previous() {
    // Section 37: Jika currentTime > 3 detik: restart current song. Jika <= 3 detik: previous song.
    if (this.audio.currentTime > 3) {
      this.seek(0);
      return;
    }

    if (this.state.queue.length === 0) return;

    const prevIndex = this.state.queueIndex - 1;
    if (prevIndex >= 0) {
      this.state.queueIndex = prevIndex;
      this.loadSong(this.state.queue[prevIndex], true);
    } else if (this.state.repeat === 'ALL') {
      const lastIndex = this.state.queue.length - 1;
      this.state.queueIndex = lastIndex;
      this.loadSong(this.state.queue[lastIndex], true);
    } else {
      this.seek(0);
    }
  }

  public seek(timeInSeconds: number) {
    const target = Math.max(0, Math.min(timeInSeconds, this.state.duration || this.audio.duration || 0));
    this.audio.currentTime = target;
    this.state.currentTime = target;
    this.updateMediaSessionPosition();
    this.emitChange();
  }

  public setVolume(volume: number) {
    const clamped = Math.max(0, Math.min(1, volume));
    this.state.volume = clamped;
    this.audio.volume = clamped;
    this.state.isMuted = clamped === 0;
    this.savePreferences();
    this.emitChange();
  }

  public toggleMute() {
    if (this.state.isMuted) {
      this.audio.volume = this.state.volume || 0.5;
      this.state.isMuted = false;
    } else {
      this.audio.volume = 0;
      this.state.isMuted = true;
    }
    this.emitChange();
  }

  public setShuffle(enabled: boolean) {
    this.state.shuffle = enabled;
    this.savePreferences();
    this.emitChange();
  }

  public toggleShuffle() {
    this.setShuffle(!this.state.shuffle);
  }

  public setRepeat(mode: RepeatMode) {
    this.state.repeat = mode;
    this.savePreferences();
    this.emitChange();
  }

  public cycleRepeat() {
    // OFF -> ALL -> ONE -> OFF
    const modes: RepeatMode[] = ['OFF', 'ALL', 'ONE'];
    const currentIdx = modes.indexOf(this.state.repeat);
    const nextMode = modes[(currentIdx + 1) % modes.length];
    this.setRepeat(nextMode);
  }

  public stopIfPlaying(songId: string) {
    if (this.state.currentSong?.id === songId) {
      this.pause();
      this.state.currentSong = null;
      this.state.currentTime = 0;
      this.state.duration = 0;
      this.updateMediaSessionPlayback('none');
      // Remove from queue
      this.state.queue = this.state.queue.filter((s) => s.id !== songId);
      this.emitChange();
    } else {
      this.state.queue = this.state.queue.filter((s) => s.id !== songId);
    }
  }

  public getState(): PlayerState {
    return { ...this.state };
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emitChange() {
    const s = this.getState();
    this.listeners.forEach((l) => l(s));
  }
}

// Global Singleton
export const musikPlayer = new GlobalMusikPlayer();

// Expose to window as requested in Section 35
if (typeof window !== 'undefined') {
  (window as any).MusikPlayer = musikPlayer;
}
