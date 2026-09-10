import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  Lock,
  LogIn,
  LogOut,
  Crown,
  Music,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  HardDrive,
  Database,
  ArrowLeft,
} from 'lucide-react';
import { Song } from '../types.js';

interface ProfileViewProps {
  songs: Song[];
  isOwner: boolean;
  ownerUsername?: string;
  onLogin: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  onLogout: () => Promise<void>;
  onNavigateHome: () => void;
  onNavigateLibrary: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  songs,
  isOwner,
  ownerUsername = 'fajarkeren',
  onLogin,
  onLogout,
  onNavigateHome,
  onNavigateLibrary,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const totalDurationMinutes = Math.round(
    songs.reduce((acc, song) => acc + (song.duration || 0), 0) / 60
  );

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    const res = await onLogin(username.trim(), password.trim());
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg('Berhasil masuk sebagai Owner!');
      setPassword('');
      setUsername('');
    } else {
      setErrorMsg(res.error || 'Username atau password salah.');
    }
  };

  const handleLogoutClick = async () => {
    if (confirm('Yakin ingin keluar dari akun Owner?')) {
      await onLogout();
      setSuccessMsg('Anda telah keluar dari akun Owner.');
    }
  };

  return (
    <div id="profile-view" className="w-full max-w-md mx-auto px-4 pt-4 pb-36 min-h-screen">
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
            Profil Akun
          </h1>
          <p className="text-xs font-semibold text-slate-500">
            {isOwner ? 'Panel Manajemen Owner' : 'Status Pengunjung & Akses Owner'}
          </p>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs font-semibold text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2.5 text-xs font-semibold text-red-800 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Logged in as Owner */}
      {isOwner ? (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Owner Profile Banner Card */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
            {/* Decorative background glow */}
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-4 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-pink-500 p-0.5 shadow-lg shadow-amber-500/20">
                <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-amber-400">
                  <Crown className="w-8 h-8 stroke-[2.5]" />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-lg font-black tracking-tight">{ownerUsername}</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-950 uppercase tracking-wider">
                    Owner
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">Pemilik Penuh Aplikasi & Perpustakaan</p>
                <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-400 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Akses Penuh (Hapus & Kelola Lagu Aktif)</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400">Hak Istimewa:</span>
              <span className="font-semibold text-pink-300">Menghapus & Mengubah Koleksi</span>
            </div>
          </div>

          {/* Library Overview Stats */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-pink-500" />
              <span>Ringkasan Perpustakaan</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">
                  Total Koleksi
                </span>
                <span className="text-xl font-black text-slate-900">
                  {songs.length}{' '}
                  <span className="text-xs font-normal text-slate-500">lagu</span>
                </span>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">
                  Total Durasi
                </span>
                <span className="text-xl font-black text-slate-900">
                  ~{totalDurationMinutes}{' '}
                  <span className="text-xs font-normal text-slate-500">menit</span>
                </span>
              </div>
            </div>

            <div className="mt-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 text-slate-700">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-500" />
                  <span>Database</span>
                </div>
                <span className="font-bold text-emerald-600">SQLite (Aktif)</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 text-slate-700">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-purple-500" />
                  <span>Penyimpanan Berkas</span>
                </div>
                <span className="font-bold text-emerald-600">Cloudflare R2 (fara-media)</span>
              </div>
            </div>
          </div>

          {/* Quick Nav Actions */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-2.5">
            <button
              onClick={onNavigateLibrary}
              className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-between transition active:scale-[0.99]"
            >
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-pink-500" />
                <span>Buka Library & Kelola Lagu</span>
              </div>
              <span className="text-slate-400 font-mono">→</span>
            </button>

            <button
              id="logout-owner-btn"
              onClick={handleLogoutClick}
              className="w-full py-3 px-4 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-[0.99]"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar dari Akun Owner</span>
            </button>
          </div>
        </div>
      ) : (
        /* Guest Mode & Login Form */
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Guest Status Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-3.5 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Mode Pengunjung</h2>
                <span className="text-xs text-slate-500">Akses Terbuka untuk Memutar & Menambah</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              Sebagai pengunjung, Anda dapat memutar seluruh lagu di library tanpa batas dan menambahkan lagu baru.
              Fitur <strong>penghapusan musik</strong> hanya dapat dilakukan oleh <strong>Owner</strong>.
            </p>
          </div>

          {/* Owner Login Form */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Lock className="w-4 h-4 text-pink-600" />
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Login Khusus Owner
              </h2>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Masuk sebagai Owner untuk mengaktifkan izin penghapusan dan pengelolaan penuh lagu.
            </p>

            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label
                  htmlFor="login-username"
                  className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="login-username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="username"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                id="submit-owner-login-btn"
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-600 hover:to-blue-600 disabled:opacity-50 text-white font-bold text-xs rounded-2xl shadow-md shadow-pink-500/20 active:scale-[0.99] transition flex items-center justify-center gap-2 mt-2"
              >
                <LogIn className="w-4 h-4" />
                <span>{isSubmitting ? 'Memverifikasi...' : 'Masuk sebagai Owner'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
