import { useState, useEffect } from 'react';
import { musikPlayer } from '../services/player.js';
import { PlayerState, Song } from '../types.js';

export function usePlayer() {
  const [playerState, setPlayerState] = useState<PlayerState>(() => musikPlayer.getState());

  useEffect(() => {
    const unsubscribe = musikPlayer.subscribe((state) => {
      setPlayerState(state);
    });
    return unsubscribe;
  }, []);

  return {
    ...playerState,
    loadSong: (song: Song, autoPlay = true) => musikPlayer.loadSong(song, autoPlay),
    setQueue: (queue: Song[], startIndex = 0) => musikPlayer.setQueue(queue, startIndex),
    play: () => musikPlayer.play(),
    pause: () => musikPlayer.pause(),
    togglePlay: () => musikPlayer.togglePlay(),
    next: () => musikPlayer.next(),
    previous: () => musikPlayer.previous(),
    seek: (time: number) => musikPlayer.seek(time),
    setVolume: (vol: number) => musikPlayer.setVolume(vol),
    toggleMute: () => musikPlayer.toggleMute(),
    toggleShuffle: () => musikPlayer.toggleShuffle(),
    cycleRepeat: () => musikPlayer.cycleRepeat(),
    stopIfPlaying: (id: string) => musikPlayer.stopIfPlaying(id),
  };
}
