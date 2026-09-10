import React, { useState, useRef } from 'react';
import {
  Link as LinkIcon,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Music,
  ArrowLeft,
  UploadCloud,
  FileAudio,
  Share2,
} from 'lucide-react';
import { Song, ProcessingStage } from '../types.js';
import { usePlayer } from '../hooks/usePlayer.js';
import { apiFetch } from '../utils/api.js';

interface AddViewProps {
  onSongAdded: (song: Song) => void;
  onNavigateHome: () => void;
}

export const AddView: React.FC<AddViewProps> = ({ onSongAdded, onNavigateHome }) => {
  const { loadSong } = usePlayer();
  const [activeTab, setActiveTab] = useState<'link' | 'upload'>('link');
  const [sourceUrl, setSourceUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [customArtist, setCustomArtist] = useState('');
  const [stage, setStage] = useState<ProcessingStage>('idle');
  const [progressPercent, setProgressPercent] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [addedSong, setAddedSong] = useState<Song | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stageDescriptions: Record<ProcessingStage, { label: string; desc: string }> = {
    idle: { label: '', desc: '' },
    preparing: { label: 'Menyiapkan Media...', desc: 'Memvalidasi link & mengekstrak data audio' },
    processing: { label: 'Memproses Audio...', desc: 'Mengekstrak metadata judul, artis, dan sampul' },
    converting: { label: 'Mengonversi Audio...', desc: 'Standardisasi encoding MP3 resolusi tinggi dengan FFmpeg' },
    uploading: { label: 'Mengunggah ke Cloudflare R2...', desc: 'Menyimpan berkas audio & cover ke bucket fara-media' },
    saving: { label: 'Menyimpan Metadata...', desc: 'Mendaftarkan informasi lagu ke database SQLite' },
    complete: { label: 'Selesai!', desc: 'Musik siap didengarkan' },
    error: { label: 'Gagal Memproses', desc: 'Terjadi kendala saat memproses media' },
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      // Auto-populate title if empty
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      if (!customTitle) setCustomTitle(nameWithoutExt);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      if (!customTitle) setCustomTitle(nameWithoutExt);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (activeTab === 'link' && !sourceUrl.trim()) return;
    if (activeTab === 'upload' && !selectedFile) return;

    setErrorMsg(null);
    setAddedSong(null);
    setStage('preparing');
    setProgressPercent(15);

    const pTimer1 = setTimeout(() => {
      setStage('processing');
      setProgressPercent(35);
    }, 800);

    const pTimer2 = setTimeout(() => {
      setStage('converting');
      setProgressPercent(60);
    }, 1800);

    const pTimer3 = setTimeout(() => {
      setStage('uploading');
      setProgressPercent(82);
    }, 2800);

    try {
      let payload: any = {
        title: customTitle.trim() || undefined,
        artist: customArtist.trim() || undefined,
      };

      if (activeTab === 'link') {
        payload.sourceUrl = sourceUrl.trim();
      } else if (activeTab === 'upload' && selectedFile) {
        // Read file as base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const res = reader.result as string;
            const base64Data = res.split(',')[1];
            resolve(base64Data);
          };
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });

        payload.fileBase64 = base64;
        payload.filename = selectedFile.name;
      }

      const res = await apiFetch('/api/music/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      clearTimeout(pTimer1);
      clearTimeout(pTimer2);
      clearTimeout(pTimer3);

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menambahkan musik');
      }

      setStage('saving');
      setProgressPercent(95);

      setTimeout(() => {
        setStage('complete');
        setProgressPercent(100);
        setAddedSong(data.song);
        onSongAdded(data.song);
      }, 400);
    } catch (err: any) {
      clearTimeout(pTimer1);
      clearTimeout(pTimer2);
      clearTimeout(pTimer3);
      setStage('error');
      setErrorMsg(err.message || 'Gagal memproses musik');
    }
  };

  const handlePlayNow = () => {
    if (addedSong) {
      loadSong(addedSong, true);
      onNavigateHome();
    }
  };

  const formatDuration = (secs: number) => {
    if (!secs || isNaN(secs)) return '3:15';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div id="add-view" className="w-full max-w-md mx-auto px-4 pt-4 pb-36 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={onNavigateHome}
          className="p-2 -ml-2 rounded-full hover:bg-slate-200/60 transition text-slate-700"
          aria-label="Kembali ke Beranda"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Tambah Musik
          </h1>
          <p className="text-xs font-semibold text-slate-500">
            Tempel link video YouTube atau unggah file audio ke library Anda.
          </p>
        </div>
      </div>

      {/* Success State View */}
      {stage === 'complete' && addedSong && (
        <div
          id="add-success-panel"
          className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-xl shadow-emerald-500/5 text-center animate-in zoom-in-95 duration-300"
        >
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-500 mx-auto flex items-center justify-center mb-3">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">
            ✓ Musik berhasil ditambahkan
          </h2>
          <p className="text-xs text-slate-500 mb-5">
            Lagu telah tersimpan di Cloudflare R2 dan siap dimainkan kapan saja.
          </p>

          {/* Song Card Info */}
          <div className="flex items-center gap-3.5 bg-slate-50 p-3 rounded-2xl border border-slate-100 mb-6 text-left">
            <img
              src={addedSong.cover_url || '/assets/default-cover.svg'}
              alt={addedSong.title}
              className="w-16 h-16 rounded-xl object-cover bg-slate-200 flex-shrink-0 shadow"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/assets/default-cover.svg';
              }}
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-slate-900 truncate">
                {addedSong.title}
              </h3>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {addedSong.artist} • {addedSong.album || 'Single'}
              </p>
              <span className="text-[11px] font-mono text-slate-400 mt-1 block">
                {formatDuration(addedSong.duration)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2.5">
            <button
              id="add-play-now-btn"
              onClick={handlePlayNow}
              className="w-full py-3 bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-600 hover:to-blue-600 text-white font-bold text-sm rounded-2xl shadow-lg shadow-pink-500/25 active:scale-95 transition"
            >
              ▶ Putar Sekarang
            </button>
            <button
              id="add-back-home-btn"
              onClick={onNavigateHome}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-2xl transition active:scale-95"
            >
              ← Kembali ke Beranda
            </button>
            <button
              onClick={() => {
                setStage('idle');
                setSourceUrl('');
                setSelectedFile(null);
                setCustomTitle('');
                setCustomArtist('');
                setAddedSong(null);
              }}
              className="text-xs text-slate-400 hover:text-slate-600 pt-2 underline"
            >
              Tambah musik lain
            </button>
          </div>
        </div>
      )}

      {/* Processing State Panel */}
      {stage !== 'idle' && stage !== 'complete' && (
        <div
          id="add-processing-panel"
          className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xl text-center my-4 animate-in fade-in"
        >
          <h2 className="text-base font-bold text-slate-900 mb-1">
            Menambahkan Musik
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            Mohon tunggu, kami sedang memproses dan mengunggah audio Anda ke library.
          </p>

          <div className="relative w-16 h-16 mx-auto mb-5 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-pink-500 border-r-blue-500 animate-spin" />
            <Music className="w-6 h-6 text-slate-700 absolute" />
          </div>

          <div className="mb-4">
            <span className="text-xs font-bold text-pink-600 uppercase tracking-wider block mb-1">
              {stageDescriptions[stage]?.label}
            </span>
            <p className="text-xs text-slate-500">
              {stageDescriptions[stage]?.desc}
            </p>
          </div>

          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-2">
            <div
              className="bg-gradient-to-r from-pink-500 to-blue-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-slate-400">
            {progressPercent}%
          </span>

          {stage === 'error' && (
            <div className="mt-5 p-4 bg-red-50 text-red-700 rounded-2xl text-xs border border-red-200 text-left">
              <div className="flex items-center gap-2 mb-2 font-bold text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                <span>Gagal Memproses</span>
              </div>
              <p className="leading-relaxed text-red-800">{errorMsg}</p>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setStage('idle')}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  Coba Lagi
                </button>
                <button
                  onClick={() => {
                    setStage('idle');
                    setActiveTab('upload');
                  }}
                  className="px-4 py-2 bg-white border border-red-300 text-red-700 hover:bg-red-50 rounded-xl text-xs font-bold transition"
                >
                  Unggah File Audio Saja
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input Form Tabs */}
      {stage === 'idle' && (
        <div className="space-y-4">
          {/* Tab Switcher */}
          <div className="flex bg-slate-200/80 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveTab('link')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeTab === 'link'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Tempel Link</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeTab === 'upload'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Unggah File Audio</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
              {/* Tab 1: Link URL */}
              {activeTab === 'link' ? (
                <div>
                  <label
                    htmlFor="media-url-input"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2"
                  >
                    Link Media / Video YouTube
                  </label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="media-url-input"
                      type="url"
                      required
                      value={sourceUrl}
                      onChange={(e) => setSourceUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=... atau https://youtu.be/..."
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition"
                    />
                  </div>

                  {/* Panduan Langkah Menyalin Link YouTube */}
                  <div className="mt-4 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-slate-700">
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center flex-shrink-0 text-[9px] font-black">
                        ▶
                      </div>
                      <span className="text-xs font-bold text-slate-900">
                        Langkah Menyalin Link Video YouTube:
                      </span>
                    </div>
                    <ol className="space-y-2 text-[11px] text-slate-600 list-decimal list-inside pl-0.5 leading-relaxed">
                      <li>
                        Buka aplikasi <strong>YouTube</strong> di smartphone atau buka situs <strong>youtube.com</strong> di browser.
                      </li>
                      <li>
                        Cari lagu atau video musik yang ingin Anda simpan ke perpustakaan.
                      </li>
                      <li>
                        Tekan tombol <span className="inline-flex items-center gap-1 font-semibold text-slate-800"><Share2 className="w-3 h-3 inline" /> Bagikan</span> (<em>Share</em>) di bawah video.
                      </li>
                      <li>
                        Pilih opsi <strong>Salin Tautan</strong> (<em>Copy Link</em>).
                      </li>
                      <li>
                        Kembali ke sini, lalu <strong>Tempelkan (Paste)</strong> link pada kotak input di atas dan tekan <strong>Tambah dari Link</strong>.
                      </li>
                    </ol>
                  </div>
                </div>
              ) : (
                /* Tab 2: File Upload */
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Pilih File Audio
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*,.mp3,.m4a,.wav,.flac,.aac,.ogg"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
                      isDragging
                        ? 'border-pink-500 bg-pink-50/50'
                        : selectedFile
                        ? 'border-blue-300 bg-blue-50/30'
                        : 'border-slate-200 hover:border-pink-300 hover:bg-slate-50'
                    }`}
                  >
                    {selectedFile ? (
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                          <FileAudio className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold text-slate-900 truncate max-w-xs block">
                          {selectedFile.name}
                        </span>
                        <span className="text-[11px] text-slate-400 mt-0.5">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Klik untuk ganti
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mb-2">
                          <UploadCloud className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold text-slate-800">
                          Klik untuk memilih file atau drag & drop ke sini
                        </span>
                        <span className="text-[11px] text-slate-400 mt-1">
                          Mendukung MP3, M4A, WAV, FLAC, AAC (Maks. 60 MB)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Optional Custom Metadata */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs font-semibold text-pink-600 hover:text-pink-700 flex items-center gap-1"
                >
                  <span>{showAdvanced ? 'Sembunyikan' : 'Sesuaikan'} Judul & Artis (Opsional)</span>
                </button>

                {showAdvanced && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-3 animate-in fade-in">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Judul Lagu (Kustom)
                      </label>
                      <input
                        type="text"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        placeholder="Biarkan kosong untuk deteksi otomatis"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-pink-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Nama Artis (Kustom)
                      </label>
                      <input
                        type="text"
                        value={customArtist}
                        onChange={(e) => setCustomArtist(e.target.value)}
                        placeholder="Biarkan kosong untuk deteksi otomatis"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-pink-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                id="submit-add-music-btn"
                type="submit"
                disabled={activeTab === 'link' ? !sourceUrl.trim() : !selectedFile}
                className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-2xl shadow-lg shadow-pink-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-5 h-5 stroke-[2.5]" />
                <span>
                  {activeTab === 'link' ? 'Tambah dari Link' : 'Unggah & Konversi Audio'}
                </span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
