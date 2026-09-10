export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  cover_key?: string;
  cover_url: string;
  audio_key: string;
  stream_url: string;
  source_url?: string;
  file_size?: number;
  mime_type?: string;
  is_favorite: number; // 0 or 1
  created_at: string;
  updated_at: string;
}

export type RepeatMode = 'OFF' | 'ALL' | 'ONE';

export interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  queue: Song[];
  queueIndex: number;
  isLoading: boolean;
}

export type TabType = 'home' | 'add' | 'library' | 'profile';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

export type ProcessingStage =
  | 'idle'
  | 'preparing'
  | 'processing'
  | 'converting'
  | 'uploading'
  | 'saving'
  | 'complete'
  | 'error';
