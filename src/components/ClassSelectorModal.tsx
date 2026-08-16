import React, { useState, useEffect } from 'react';
import { GraduationCap, CheckCircle, AlertCircle, Info, UserCheck, X } from 'lucide-react';

interface ClassSelectorModalProps {
  isOpen: boolean;
  currentName?: string;
  currentClass: string;
  classList?: string[];
  onSelectClass: (selectedClass: string, realName?: string) => Promise<void>;
  onClose?: () => void;
  isMandatory?: boolean;
}

const DEFAULT_FALLBACK_CLASSES = ['X-1', 'X-2', 'X-3', 'XI-1', 'XI-2', 'XI-3', 'XII-1', 'XII-2', 'XII-3'];

export const ClassSelectorModal: React.FC<ClassSelectorModalProps> = ({
  isOpen,
  currentName = '',
  currentClass,
  classList = [],
  onSelectClass,
  onClose,
  isMandatory = false,
}) => {
  const activeClassList = classList && classList.length > 0 ? classList : DEFAULT_FALLBACK_CLASSES;

  const [fullName, setFullName] = useState<string>(currentName);
  const [selectedClass, setSelectedClass] = useState<string>(currentClass || (activeClassList[0] || ''));
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (currentName) {
      setFullName(currentName);
    }
    if (currentClass) {
      setSelectedClass(currentClass);
    } else if (activeClassList.length > 0 && !selectedClass) {
      setSelectedClass(activeClassList[0]);
    }
  }, [currentName, currentClass, classList]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = fullName.trim();
    if (!cleanName) {
      setError('Silakan isi Nama Lengkap Anda sesuai dengan daftar hadir/absen sekolah.');
      return;
    }
    if (!selectedClass) {
      setError('Silakan pilih kelas Anda terlebih dahulu.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onSelectClass(selectedClass, cleanName);
    } catch (err: any) {
      setError(err?.message || 'Gagal menyimpan data profil. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-[28px] shadow-2xl border border-[#E2E8F8] overflow-hidden relative">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#005AC1] via-blue-700 to-indigo-700 p-6 text-white text-center relative">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-all cursor-pointer"
              title="Tutup Formulir"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-md">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-black">Formulir Lengkapi Profil Siswa</h2>
          <p className="text-blue-100 text-xs mt-1 leading-relaxed">
            {isMandatory 
              ? 'Selamat datang! Silakan isi nama asli sesuai absen dan pilih kelas aktif Anda.'
              : 'Perbarui data nama lengkap dan kelas Anda di perpustakaan sekolah.'}
          </p>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center gap-2.5 font-medium">
              <AlertCircle className="w-4.5 h-4.5 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Input Nama Lengkap */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-[#005AC1]" />
              <span>Nama Lengkap Siswa (Sesuai Absen)</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Ahmad Rizky Pratama"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                setError('');
              }}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs sm:text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#005AC1] focus:bg-white transition-all"
            />
            <p className="text-[11px] text-slate-500 font-medium">
              *Tuliskan nama asli Anda sesuai yang tercantum di daftar hadir/absen kelas di sekolah.
            </p>
          </div>

          {/* Pilih Kelas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Pilih Kelas Anda
              </label>
              <span className="text-[10px] font-bold text-slate-500">
                {activeClassList.length} Kelas Tersedia
              </span>
            </div>

            <div className="max-h-52 overflow-y-auto pr-1 grid grid-cols-3 gap-2 scrollbar-thin">
              {activeClassList.map((cls) => {
                const isSelected = selectedClass === cls;
                return (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => {
                      setSelectedClass(cls);
                      setError('');
                    }}
                    className={`py-2.5 px-3 rounded-2xl text-xs font-bold text-center transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      isSelected
                        ? 'bg-[#005AC1] text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-[#005AC1]'
                    }`}
                  >
                    <span>{cls}</span>
                    {isSelected && <CheckCircle className="w-3.5 h-3.5 text-white shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !fullName.trim() || !selectedClass}
              className="w-full py-3.5 px-4 bg-[#005AC1] hover:bg-[#00479A] text-white font-black text-xs sm:text-sm rounded-full transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Simpan Profil & Masuk Perpustakaan'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

