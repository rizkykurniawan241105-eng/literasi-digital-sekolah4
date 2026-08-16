import React, { useState } from 'react';
import { 
  Settings, 
  Mail, 
  GraduationCap, 
  Plus, 
  Trash2, 
  Edit2,
  Edit3,
  ShieldCheck, 
  CheckCircle2, 
  Save, 
  AlertCircle,
  AlertTriangle,
  User,
  UserCog,
  LogOut,
  X,
  Check,
  Clock,
  Calendar,
  ToggleLeft,
  ToggleRight,
  Lock,
  Unlock,
  Info
} from 'lucide-react';
import { AppSettings, UserProfile } from '../../types';

interface SettingsTabProps {
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => Promise<void>;
  loading: boolean;
  currentUser?: UserProfile | null;
  onLogout?: () => void;
  onUpdateProfile?: (updated: Partial<UserProfile>) => void;
}

const ALL_DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

const AVATAR_PRESETS = [
  { id: '1', name: 'Guru Pria', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200' },
  { id: '2', name: 'Guru Wanita', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200' },
  { id: '3', name: 'Petugas Perpustakaan', url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200' },
  { id: '4', name: 'Koordinator Literasi', url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200' },
];

export const SettingsTab: React.FC<SettingsTabProps> = ({ 
  settings, 
  onSaveSettings, 
  loading,
  currentUser,
  onLogout,
  onUpdateProfile
}) => {
  const [adminEmails, setAdminEmails] = useState<string[]>(settings.adminEmails || []);
  const [classList, setClassList] = useState<string[]>(settings.classes || []);

  // Schedule & Access Control States
  const [scheduleMode, setScheduleMode] = useState<'manual' | 'schedule'>(settings.scheduleMode || 'schedule');
  const [isAccessOpenManual, setIsAccessOpenManual] = useState<boolean>(settings.isAccessOpenManual ?? true);
  const [activeDays, setActiveDays] = useState<string[]>(settings.activeDays || ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']);
  const [activeStartTime, setActiveStartTime] = useState<string>(settings.activeStartTime || '07:00');
  const [activeEndTime, setActiveEndTime] = useState<string>(settings.activeEndTime || '08:00');

  const [newEmail, setNewEmail] = useState('');
  const [newClass, setNewClass] = useState('');

  // Class Edit & Delete Confirmation States
  const [editingClassOriginal, setEditingClassOriginal] = useState<string | null>(null);
  const [editingClassName, setEditingClassName] = useState<string>('');
  const [classToDelete, setClassToDelete] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [scheduleMsg, setScheduleMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [classMsg, setClassMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync with Firestore settings whenever prop updates
  React.useEffect(() => {
    if (settings) {
      if (settings.adminEmails) setAdminEmails(settings.adminEmails);
      if (settings.classes !== undefined) setClassList(settings.classes);
      if (settings.scheduleMode) setScheduleMode(settings.scheduleMode);
      if (settings.isAccessOpenManual !== undefined) setIsAccessOpenManual(settings.isAccessOpenManual);
      if (settings.activeDays) setActiveDays(settings.activeDays);
      if (settings.activeStartTime) setActiveStartTime(settings.activeStartTime);
      if (settings.activeEndTime) setActiveEndTime(settings.activeEndTime);
    }
  }, [settings]);

  // Edit Profile Modal State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editJabatan, setEditJabatan] = useState(currentUser?.kelas || 'Pengelola Literasi / Guru');
  const [editPhotoURL, setEditPhotoURL] = useState(currentUser?.photoURL || '');
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateProfile) {
      onUpdateProfile({
        name: editName.trim() || 'Admin Literasi',
        kelas: editJabatan.trim() || 'Pengelola Literasi / Guru',
        photoURL: editPhotoURL || undefined,
      });
      setProfileSaveSuccess(true);
      setTimeout(() => {
        setProfileSaveSuccess(false);
        setIsEditProfileOpen(false);
      }, 1200);
    }
  };

  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes('@')) {
      setMsg({ type: 'error', text: 'Masukkan format email admin yang valid!' });
      return;
    }
    const clean = newEmail.trim().toLowerCase();
    if (adminEmails.includes(clean)) {
      setMsg({ type: 'error', text: 'Email tersebut sudah ada dalam daftar admin.' });
      return;
    }
    setAdminEmails([...adminEmails, clean]);
    setNewEmail('');
    setMsg(null);
  };

  const handleRemoveEmail = (email: string) => {
    if (adminEmails.length <= 1) {
      setMsg({ type: 'error', text: 'Minimal harus ada 1 email admin terdaftar.' });
      return;
    }
    setAdminEmails(adminEmails.filter((e) => e !== email));
    setMsg(null);
  };

  // Class Management Handlers
  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClass.trim()) return;
    const clean = newClass.trim().toUpperCase();
    if (classList.includes(clean)) {
      setClassMsg({ type: 'error', text: `Kelas "${clean}" sudah ada dalam daftar!` });
      return;
    }
    const updated = [...classList, clean];
    setClassList(updated);
    setNewClass('');
    setClassMsg(null);

    // Persist immediately to Firestore
    try {
      setSaving(true);
      await onSaveSettings({
        adminEmails,
        classes: updated,
        scheduleMode,
        isAccessOpenManual,
        activeDays,
        activeStartTime,
        activeEndTime,
      });
      setClassMsg({ type: 'success', text: `Kelas "${clean}" berhasil ditambahkan dan disimpan ke database!` });
      setTimeout(() => setClassMsg(null), 4000);
    } catch (err: any) {
      setClassMsg({ type: 'error', text: err?.message || 'Gagal menyimpan kelas ke database.' });
    } finally {
      setSaving(false);
    }
  };

  const handleStartEditClass = (cls: string) => {
    setEditingClassOriginal(cls);
    setEditingClassName(cls);
    setClassMsg(null);
  };

  const handleSaveEditClass = async () => {
    if (!editingClassOriginal) return;
    const cleanNew = editingClassName.trim().toUpperCase();
    if (!cleanNew) {
      setClassMsg({ type: 'error', text: 'Nama kelas tidak boleh kosong!' });
      return;
    }
    if (cleanNew !== editingClassOriginal && classList.includes(cleanNew)) {
      setClassMsg({ type: 'error', text: `Kelas "${cleanNew}" sudah ada!` });
      return;
    }

    const updated = classList.map((c) => (c === editingClassOriginal ? cleanNew : c));
    setClassList(updated);
    setEditingClassOriginal(null);
    setEditingClassName('');

    // Persist immediately to Firestore
    try {
      setSaving(true);
      await onSaveSettings({
        adminEmails,
        classes: updated,
        scheduleMode,
        isAccessOpenManual,
        activeDays,
        activeStartTime,
        activeEndTime,
      });
      setClassMsg({ type: 'success', text: `Nama kelas berhasil diubah menjadi "${cleanNew}" dan disimpan!` });
      setTimeout(() => setClassMsg(null), 4000);
    } catch (err: any) {
      setClassMsg({ type: 'error', text: err?.message || 'Gagal memperbarui nama kelas.' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEditClass = () => {
    setEditingClassOriginal(null);
    setEditingClassName('');
  };

  const handleConfirmDeleteClass = async () => {
    if (!classToDelete) return;
    const deletedName = classToDelete;
    const updated = classList.filter((c) => c !== deletedName);
    setClassList(updated);
    setClassToDelete(null);

    // Persist immediately to Firestore
    try {
      setSaving(true);
      await onSaveSettings({
        adminEmails,
        classes: updated,
        scheduleMode,
        isAccessOpenManual,
        activeDays,
        activeStartTime,
        activeEndTime,
      });
      setClassMsg({ type: 'success', text: `Kelas "${deletedName}" berhasil dihapus secara permanen dari database!` });
      setTimeout(() => setClassMsg(null), 4000);
    } catch (err: any) {
      setClassMsg({ type: 'error', text: err?.message || 'Gagal menghapus kelas dari database.' });
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day: string) => {
    if (activeDays.includes(day)) {
      if (activeDays.length <= 1) {
        setMsg({ type: 'error', text: 'Pilih minimal 1 hari aktif literasi!' });
        return;
      }
      setActiveDays(activeDays.filter((d) => d !== day));
    } else {
      setActiveDays([...activeDays, day]);
    }
    setMsg(null);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setMsg(null);
    setScheduleMsg(null);
    setClassMsg(null);
    try {
      await onSaveSettings({
        adminEmails,
        classes: classList,
        scheduleMode,
        isAccessOpenManual,
        activeDays,
        activeStartTime,
        activeEndTime,
      });
      setMsg({ type: 'success', text: 'Pengaturan Jadwal, Hak Akses & Daftar Kelas berhasil diperbarui dan disimpan!' });
      setScheduleMsg({ type: 'success', text: 'Jadwal Waktu Literasi Berhasil Diperbarui!' });
      setClassMsg({ type: 'success', text: 'Daftar Kelas berhasil disimpan ke database Firestore!' });
      setTimeout(() => {
        setScheduleMsg(null);
        setClassMsg(null);
      }, 4000);
    } catch (err: any) {
      setMsg({ type: 'error', text: err?.message || 'Gagal menyimpan pengaturan.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveScheduleOnly = async () => {
    setSaving(true);
    setScheduleMsg(null);
    setMsg(null);
    try {
      await onSaveSettings({
        adminEmails,
        classes: classList,
        scheduleMode,
        isAccessOpenManual,
        activeDays,
        activeStartTime,
        activeEndTime,
      });
      setScheduleMsg({ type: 'success', text: 'Jadwal Waktu Literasi Berhasil Diperbarui!' });
      setTimeout(() => setScheduleMsg(null), 5000);
    } catch (err: any) {
      setScheduleMsg({ type: 'error', text: err?.message || 'Gagal memperbarui jadwal.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6 animate-fade-in max-w-5xl mx-auto">
      {/* ================= 1. PROFIL ADMIN CARD ================= */}
      <div className="bg-white rounded-[28px] border border-[#E2E8F8] shadow-xs overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-[#005AC1] via-blue-700 to-indigo-800 relative flex items-center justify-between px-6">
          <div className="flex items-center gap-2 text-white/90 font-bold text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>Portal Otentikasi Admin / Pengelola Sekolah</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1 rounded-full text-white text-[11px] font-bold border border-white/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Sistem Otentikasi Aktif</span>
          </div>
        </div>

        <div className="p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            {/* Avatar Photo */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-full bg-slate-100 border-2 border-[#005AC1] p-0.5 shadow-md overflow-hidden">
                {currentUser?.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#005AC1] to-blue-800 text-white font-black text-2xl flex items-center justify-center rounded-full">
                    {(currentUser?.name || 'A').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-[#006399] text-white text-[9px] font-bold px-2 py-0.5 rounded-full border border-white shadow-xs">
                GURU
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  {currentUser?.name || 'Drs. Kenzo Kurniawan'}
                </h2>
                <span className="px-3 py-0.5 bg-[#C2E8FF] text-[#001E30] text-[10px] font-bold rounded-full">
                  Admin Utama
                </span>
              </div>

              <p className="text-xs text-slate-500 font-medium flex items-center justify-center sm:justify-start gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Email/Username: <strong className="text-slate-800">{currentUser?.email || 'admin@sekolah.sch.id'}</strong></span>
              </p>

              <p className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3.5 py-1 rounded-full inline-block mt-1">
                Jabatan: {currentUser?.kelas || 'Pengelola Literasi / Guru Bahasa'}
              </p>
            </div>
          </div>

          {/* Actions: Edit Profil & Logout */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
            <button
              onClick={() => {
                setEditName(currentUser?.name || '');
                setEditJabatan(currentUser?.kelas || 'Pengelola Literasi / Guru');
                setEditPhotoURL(currentUser?.photoURL || '');
                setIsEditProfileOpen(true);
              }}
              className="flex-1 md:flex-initial py-2.5 px-4 bg-[#EEF3FF] hover:bg-[#D8E2FF] text-[#001A41] rounded-full text-xs font-bold transition-all border border-[#D8E2FF] flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <UserCog className="w-4 h-4 text-[#005AC1]" />
              <span>Edit Profil Admin</span>
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                className="py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span>Keluar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-sky-100 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-sky-600" />
            <span>Pengaturan Sistem & Hak Akses Admin</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kelola daftar email berhak akses Admin / Guru serta daftar kelas siswa sekolah
          </p>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="py-2.5 px-5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-sky-600/20 flex items-center gap-2"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Simpan Pengaturan</span>
            </>
          )}
        </button>
      </div>

      {msg && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center gap-2 ${
            msg.type === 'success'
              ? 'bg-sky-50 border-sky-200 text-sky-900'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {msg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      {/* ================= PENGATURAN JADWAL LITERASI & KONTROL AKSES ================= */}
      <div className="bg-white p-6 rounded-[28px] border border-[#E2E8F8] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#EEF3FF] text-[#005AC1] flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Pengaturan Jadwal Literasi & Kontrol Akses</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Atur hari & jam aktif pengiriman laporan literasi siswa atau sakelar manual akses
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
              (scheduleMode === 'manual' ? isAccessOpenManual : true)
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              {(scheduleMode === 'manual' ? isAccessOpenManual : true) ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Akses Terbuka</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-rose-600" />
                  <span>Akses Ditutup</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* 1. Mode Kontrol Akses */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
            Mode Kontrol Pengiriman Laporan:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setScheduleMode('schedule')}
              className={`p-4 rounded-[20px] border text-left transition-all cursor-pointer flex items-start gap-3 ${
                scheduleMode === 'schedule'
                  ? 'bg-[#EEF3FF] border-[#005AC1] text-[#001A41] shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Calendar className="w-5 h-5 text-[#005AC1] shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-slate-900">1. Mode Jadwal Otomatis</div>
                <div className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Akses dibuka otomatis hanya pada <strong>Hari Aktif</strong> & <strong>Jam Aktif</strong> yang telah ditentukan di bawah.
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setScheduleMode('manual')}
              className={`p-4 rounded-[20px] border text-left transition-all cursor-pointer flex items-start gap-3 ${
                scheduleMode === 'manual'
                  ? 'bg-[#EEF3FF] border-[#005AC1] text-[#001A41] shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ToggleLeft className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-slate-900">2. Mode Kontrol Manual (Override)</div>
                <div className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  Kontrol penuh lewat <strong>Sakelar Buka/Tutup</strong> langsung tanpa terikat jam/hari.
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* 2. Sakelar Utama (Toggle Switch Buka/Tutup) */}
        <div className="p-4 bg-[#F8FAFF] rounded-[20px] border border-[#E2E8F8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <span>Sakelar Utama Access Override</span>
              {isAccessOpenManual ? (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full">BUKA</span>
              ) : (
                <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-extrabold rounded-full">TUTUP</span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Gunakan sakelar ini untuk langsung membuka atau menutup akses pengiriman laporan literasi siswa.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAccessOpenManual(!isAccessOpenManual)}
            className={`py-2.5 px-5 rounded-full text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer shadow-xs ${
              isAccessOpenManual
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-rose-600 hover:bg-rose-700 text-white'
            }`}
          >
            {isAccessOpenManual ? (
              <>
                <ToggleRight className="w-5 h-5" />
                <span>Akses Sedang DIBUKA</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-5 h-5" />
                <span>Akses Sedang DITUTUP</span>
              </>
            )}
          </button>
        </div>

        {/* 3. Pilihan Hari Aktif & Jam Aktif */}
        <div className={`space-y-4 pt-2 transition-opacity ${scheduleMode === 'manual' ? 'opacity-60' : 'opacity-100'}`}>
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              Hari Aktif Literasi Sekolah:
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_DAYS.map((day) => {
                const isSelected = activeDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`py-2 px-4 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[#005AC1] text-white border-[#005AC1] shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {day} {isSelected ? '✓' : ''}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Jam Mulai Aktif:
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="time"
                  value={activeStartTime}
                  onChange={(e) => setActiveStartTime(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-[#005AC1] outline-hidden"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Jam Selesai Aktif:
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="time"
                  value={activeEndTime}
                  onChange={(e) => setActiveEndTime(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-[#005AC1] outline-hidden"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Button: Simpan Perubahan Jadwal */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          {scheduleMsg ? (
            <div
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
                scheduleMsg.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              {scheduleMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{scheduleMsg.text}</span>
            </div>
          ) : (
            <p className="text-[11px] text-slate-500 font-medium">
              *Klik tombol di samping untuk menyimpan pengaturan jadwal ke database secara langsung.
            </p>
          )}

          <button
            type="button"
            onClick={handleSaveScheduleOnly}
            disabled={saving}
            className="w-full sm:w-auto py-3 px-6 bg-[#005AC1] hover:bg-[#00479A] active:bg-[#003878] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-900/15 flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan Jadwal</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Admin Email Manager & Firestore Whitelist */}
        <div className="bg-white p-6 rounded-2xl border border-sky-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Whitelist Email Admin & Guru</h2>
                <p className="text-[11px] text-slate-500">Tersinkronisasi dengan Firestore ('admin_whitelists')</p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-200 hidden sm:inline-block">
              ✓ RBAC Ketat Aktif
            </span>
          </div>

          <p className="text-[11px] text-slate-600 bg-sky-50/70 p-2.5 rounded-xl border border-sky-200/80 leading-relaxed font-medium">
            🔒 <strong>Keamanan Hak Akses:</strong> Hanya email yang terdaftar di daftar whitelist ini yang dapat mengakses dasbor admin dan fitur manajemen. Pengguna non-whitelist otomatis dikunci sebagai Siswa.
          </p>

          <form onSubmit={handleAddEmail} className="flex gap-2">
            <input
              type="email"
              placeholder="Masukkan email guru (e.g. guru@sekolah.sch.id)"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-hidden"
            />
            <button
              type="submit"
              className="py-2 px-3.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah</span>
            </button>
          </form>

          <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
            {adminEmails.map((email) => (
              <div
                key={email}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs"
              >
                <div className="flex items-center gap-2 text-slate-800 font-medium truncate">
                  <Mail className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                  <span className="truncate">{email}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveEmail(email)}
                  className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Hapus Admin"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="w-full py-2.5 px-4 bg-[#005AC1] hover:bg-[#00479A] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Simpan Perubahan Whitelist ke Database</span>
          </button>
        </div>

        {/* Card 2: Class List Manager */}
        <div className="bg-white p-6 rounded-2xl border border-sky-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Daftar Kelas Sekolah</h2>
                <p className="text-[11px] text-slate-500">Tersinkronisasi langsung dengan database Firestore</p>
              </div>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
              {classList.length} Kelas
            </span>
          </div>

          {classMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                classMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {classMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{classMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleAddClass} className="flex gap-2">
            <input
              type="text"
              placeholder="Ketik nama kelas baru (contoh: XII-4)"
              value={newClass}
              onChange={(e) => setNewClass(e.target.value)}
              className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-hidden uppercase placeholder:normal-case font-medium"
            />
            <button
              type="submit"
              disabled={saving || !newClass.trim()}
              className="py-2 px-4 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kelas</span>
            </button>
          </form>

          {classList.length === 0 ? (
            <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center space-y-2">
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                <Info className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-700">Belum Ada Daftar Kelas di Database</p>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Daftar kelas bawaan telah dikosongkan. Silakan tambahkan nama kelas sekolah Anda (misal: X-1, XI-IPA-1, XII-4).
              </p>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2 pr-1">
              {classList.map((cls) => {
                const isEditing = editingClassOriginal === cls;

                if (isEditing) {
                  return (
                    <div
                      key={cls}
                      className="p-1.5 bg-blue-50/90 rounded-xl border border-blue-300 flex items-center gap-1"
                    >
                      <input
                        type="text"
                        value={editingClassName}
                        onChange={(e) => setEditingClassName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEditClass();
                          if (e.key === 'Escape') handleCancelEditClass();
                        }}
                        autoFocus
                        className="w-full px-2 py-1 text-xs font-bold bg-white border border-blue-300 rounded-lg uppercase outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={handleSaveEditClass}
                        disabled={saving}
                        className="p-1.5 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer shrink-0"
                        title="Simpan Nama Kelas"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEditClass}
                        className="p-1.5 text-slate-500 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer shrink-0"
                        title="Batal Edit"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={cls}
                    className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100/80 transition-colors rounded-xl border border-slate-200 text-xs group"
                  >
                    <span className="font-bold text-slate-800">{cls}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEditClass(cls)}
                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Nama Kelas"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setClassToDelete(cls)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Kelas"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="w-full py-2.5 px-4 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Menyimpan ke Firestore...' : 'Simpan Seluruh Daftar Kelas ke Database'}</span>
          </button>
        </div>
      </div>

      {/* ================= MODAL KONFIRMASI HAPUS KELAS ================= */}
      {classToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <AlertTriangle className="w-7 h-7" />
              </div>
              
              <div>
                <h3 className="text-base font-bold text-slate-900">Konfirmasi Hapus Kelas</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Apakah Anda yakin ingin menghapus kelas <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">{classToDelete}</span> ini?
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Kelas akan dihapus secara permanen dari database Firestore dan siswa tidak dapat lagi memilih kelas ini.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setClassToDelete(null)}
                  disabled={saving}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteClass}
                  disabled={saving}
                  className="py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-red-600/30 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{saving ? 'Menghapus...' : 'Ya, Hapus Kelas'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL EDIT PROFIL ADMIN ================= */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-[#1E40AF] text-white p-5 flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <UserCog className="w-5 h-5 text-amber-300" />
                <span>Edit Profil Admin / Guru</span>
              </h3>
              <button
                onClick={() => setIsEditProfileOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              {profileSaveSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Profil Admin berhasil diperbarui!</span>
                </div>
              )}

              {/* Nama Admin */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Nama Lengkap Admin / Guru:
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Contoh: Drs. Kenzo Kurniawan"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-[#1E40AF] focus:ring-2 focus:ring-blue-500/20 outline-hidden"
                />
              </div>

              {/* Jabatan / Peran */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Jabatan / Peran Pengelola:
                </label>
                <input
                  type="text"
                  value={editJabatan}
                  onChange={(e) => setEditJabatan(e.target.value)}
                  placeholder="Contoh: Pengelola Literasi / Guru Bahasa"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-[#1E40AF] focus:ring-2 focus:ring-blue-500/20 outline-hidden"
                />
              </div>

              {/* Avatar Preset Options */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Pilih Avatar Profil Preset:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {AVATAR_PRESETS.map((avatar) => (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => setEditPhotoURL(avatar.url)}
                      className={`p-1 rounded-xl border-2 transition-all cursor-pointer ${
                        editPhotoURL === avatar.url ? 'border-[#1E40AF] bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <img src={avatar.url} alt={avatar.name} className="w-full h-12 object-cover rounded-lg" />
                      <div className="text-[9px] font-bold text-slate-600 text-center mt-1 truncate">{avatar.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Image URL */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Atau URL Foto Kustom:
                </label>
                <input
                  type="url"
                  value={editPhotoURL}
                  onChange={(e) => setEditPhotoURL(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-[#1E40AF] outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#1E40AF] hover:bg-blue-800 text-white rounded-xl text-xs font-extrabold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
