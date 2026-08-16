import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  BookCheck, 
  User, 
  Mail, 
  GraduationCap, 
  BookOpen, 
  FileText, 
  Bookmark, 
  Lock, 
  Sparkles, 
  ThumbsUp, 
  ThumbsDown, 
  Lightbulb, 
  Info,
  Calendar,
  Building2,
  PenTool,
  CheckCircle2,
  AlertCircle,
  Award
} from 'lucide-react';
import { Book, UserProfile, AppSettings } from '../types';
import { checkLiteracyAccess, countWords } from '../utils/pointsAndSchedule';

interface ReportFormModalProps {
  isOpen: boolean;
  user: UserProfile;
  book: Book | null;
  appSettings?: AppSettings;
  onClose: () => void;
  onSubmitReport: (data: {
    bookId: string;
    bookTitle: string;
    bookAuthor?: string;
    bookPublisher?: string;
    bookPublishYear?: string;
    pagesRead: string;
    identitasBuku?: {
      judul?: string;
      penulis?: string;
      penerbit?: string;
      tahunTerbit?: string;
      halamanDibaca?: string;
    };
    ringkasanIsi: string;
    kelebihanBuku: string;
    kekuranganBuku: string;
    saranKelayakan: string;
    summary: string;
    summaryWordCount: number;
    readingSessionPoints: number;
    q1IdentitasPoints: number;
    q2RingkasanPoints: number;
    q3KelebihanPoints: number;
    q4KekuranganPoints: number;
    q5SaranPoints: number;
    baseTotalPoints: number;
    baseReadingPoints: number;
    summaryWordCountPoints: number;
    adminBonusPoints: number;
  }) => Promise<void>;
}

export const ReportFormModal: React.FC<ReportFormModalProps> = ({
  isOpen,
  user,
  book,
  appSettings,
  onClose,
  onSubmitReport,
}) => {
  // 1. Identitas Buku Fields
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookPublisher, setBookPublisher] = useState('');
  const [bookPublishYear, setBookPublishYear] = useState('');
  const [pagesRead, setPagesRead] = useState('');

  // 2. Structured Review Textarea Fields (5-Poin Ulasan)
  const [ringkasanIsi, setRingkasanIsi] = useState('');
  const [kelebihanBuku, setKelebihanBuku] = useState('');
  const [kekuranganBuku, setKekuranganBuku] = useState('');
  const [saranKelayakan, setSaranKelayakan] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (book) {
      setBookAuthor(book.author || '');
      setBookPublisher('');
      setBookPublishYear('');
      setPagesRead('');
      setRingkasanIsi('');
      setKelebihanBuku('');
      setKekuranganBuku('');
      setSaranKelayakan('');
      setError('');
    }
  }, [book, isOpen]);

  if (!isOpen || !book) return null;

  const accessStatus = checkLiteracyAccess(appSettings);
  
  // Real-time Component Points Calculation (Total 100 Base Points Schema)
  // 1. Sesi Membaca: +10 Poin (Otomatis)
  const readingSessionPoints = 10;
  
  // 2. Q1. Identitas Buku & Halaman: +10 Poin (Saat halaman diisi)
  const isQ1Filled = pagesRead.trim().length > 0;
  const q1IdentitasPoints = isQ1Filled ? 10 : 0;

  // 3. Q2. Ringkasan Isi Buku: +30 Poin (Saat min. 50 kata)
  const wordCount = countWords(ringkasanIsi);
  const isQ2Filled = wordCount >= 50;
  const q2RingkasanPoints = isQ2Filled ? 30 : 0;

  // 4. Q3. Kelebihan Buku: +15 Poin (Saat diisi)
  const isQ3Filled = kelebihanBuku.trim().length > 0;
  const q3KelebihanPoints = isQ3Filled ? 15 : 0;

  // 5. Q4. Kekurangan Buku: +15 Poin (Saat diisi)
  const isQ4Filled = kekuranganBuku.trim().length > 0;
  const q4KekuranganPoints = isQ4Filled ? 15 : 0;

  // 6. Q5. Saran & Kelayakan: +20 Poin (Saat diisi)
  const isQ5Filled = saranKelayakan.trim().length > 0;
  const q5SaranPoints = isQ5Filled ? 20 : 0;

  // Total Estimated Base Points (0 - 100)
  const totalEstimatedBasePoints = 
    readingSessionPoints + 
    q1IdentitasPoints + 
    q2RingkasanPoints + 
    q3KelebihanPoints + 
    q4KekuranganPoints + 
    q5SaranPoints;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accessStatus.isOpen) {
      setError(accessStatus.reason);
      return;
    }

    if (!pagesRead.trim()) {
      setError('Bagian/Halaman dibaca wajib diisi.');
      return;
    }

    if (!ringkasanIsi.trim() || ringkasanIsi.trim().length < 10) {
      setError('Ringkasan Isi Buku wajib diisi (minimal 10 karakter).');
      return;
    }

    // Combine all 5 structured points into one formatted cohesive report
    const unifiedSummary = `[IDENTITAS BUKU]
• Judul: ${book.title}
• Penulis: ${bookAuthor.trim() || book.author || '-'}
• Penerbit: ${bookPublisher.trim() || '-'}
• Tahun Terbit: ${bookPublishYear.trim() || '-'}
• Halaman/Bab Dibaca: ${pagesRead.trim()}

[RINGKASAN ISI BUKU]
${ringkasanIsi.trim()}

[KELEBIHAN BUKU]
${kelebihanBuku.trim() || 'Tidak dicantumkan'}

[KEKURANGAN BUKU]
${kekuranganBuku.trim() || 'Tidak dicantumkan'}

[SARAN / PERTIMBANGAN KELAYAKAN BUKU]
${saranKelayakan.trim() || 'Tidak dicantumkan'}`;

    setLoading(true);
    setError('');

    try {
      await onSubmitReport({
        bookId: book.id,
        bookTitle: book.title,
        bookAuthor: bookAuthor.trim() || book.author || '',
        bookPublisher: bookPublisher.trim(),
        bookPublishYear: bookPublishYear.trim(),
        pagesRead: pagesRead.trim(),
        identitasBuku: {
          judul: book.title,
          penulis: bookAuthor.trim() || book.author || '',
          penerbit: bookPublisher.trim(),
          tahunTerbit: bookPublishYear.trim(),
          halamanDibaca: pagesRead.trim(),
        },
        ringkasanIsi: ringkasanIsi.trim(),
        kelebihanBuku: kelebihanBuku.trim(),
        kekuranganBuku: kekuranganBuku.trim(),
        saranKelayakan: saranKelayakan.trim(),
        summary: unifiedSummary,
        summaryWordCount: wordCount,
        readingSessionPoints,
        q1IdentitasPoints,
        q2RingkasanPoints,
        q3KelebihanPoints,
        q4KekuranganPoints,
        q5SaranPoints,
        baseTotalPoints: totalEstimatedBasePoints,
        baseReadingPoints: readingSessionPoints + q1IdentitasPoints,
        summaryWordCountPoints: q2RingkasanPoints,
        adminBonusPoints: 0,
      });

      // Reset & close
      setPagesRead('');
      setRingkasanIsi('');
      setKelebihanBuku('');
      setKekuranganBuku('');
      setSaranKelayakan('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Gagal mengirim laporan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-4 animate-fade-in overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-[28px] shadow-2xl border border-[#E2E8F8] overflow-hidden my-6 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#005AC1] via-blue-700 to-indigo-700 p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
              <BookCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">Form Laporan Ulasan Literasi</h3>
              <p className="text-xs text-blue-100">Skema 100 Poin Dasar Komponen + Bonus Ulasan Kritis Guru</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 scrollbar-thin">
          {/* Banner Informasi Kunci Akses jika Ditutup */}
          {!accessStatus.isOpen && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1">
              <div className="font-bold text-rose-950 flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Akses Kegiatan Literasi Sedang Ditutup oleh Admin.</span>
              </div>
              <p className="text-rose-800 font-medium pl-6">
                {accessStatus.reason}
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-600 font-bold flex items-center gap-2">
              <Info className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Student Info Card (Auto-filled) */}
          <div className="bg-[#EEF3FF] p-3.5 rounded-2xl border border-blue-100 space-y-2">
            <div className="text-[11px] font-bold text-[#001A41] uppercase tracking-wider flex items-center justify-between">
              <span>Identitas Siswa Pengirim</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" />
                <span>Sesi Baca: +10 Poin Terkumpul</span>
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700 bg-white p-2 rounded-xl border border-slate-200/80">
                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate font-medium">{user.name}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 bg-white p-2 rounded-xl border border-slate-200/80">
                <GraduationCap className="w-3.5 h-3.5 text-[#005AC1] shrink-0" />
                <span className="font-bold text-[#005AC1]">{user.kelas || 'Belum Ada Kelas'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 bg-white p-2 rounded-xl border border-slate-200/80">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{user.email}</span>
              </div>
            </div>
          </div>

          {/* ================= BAGIAN 1 (Q1): IDENTITAS BUKU (+10 POIN) ================= */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#001A41] uppercase tracking-wider">
                <BookOpen className="w-4 h-4 text-[#005AC1]" />
                <span>Q1. Identitas Buku & Halaman Dibaca</span>
              </div>
              
              {/* Badge Indikator Poin Q1 */}
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition-all flex items-center gap-1 ${
                isQ1Filled
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-slate-200/80 text-slate-600 border-slate-300'
              }`}>
                {isQ1Filled ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>+10 Poin Terkumpul ✓</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3 text-slate-400" />
                    <span>+0 Poin (Isi Halaman Dibaca)</span>
                  </>
                )}
              </span>
            </div>

            {/* Judul Buku (Read Only) */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700">
                Judul Buku:
              </label>
              <div className="w-full px-3.5 py-2.5 bg-white border border-blue-200 rounded-xl text-xs font-bold text-[#001A41] shadow-2xs">
                {book.title}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Penulis Buku */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <PenTool className="w-3 h-3 text-[#005AC1]" />
                  <span>Penulis / Pengarang</span>
                </label>
                <input
                  type="text"
                  disabled={!accessStatus.isOpen}
                  value={bookAuthor}
                  onChange={(e) => setBookAuthor(e.target.value)}
                  placeholder="Nama Penulis"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:border-[#005AC1] focus:ring-2 focus:ring-[#005AC1]/20 outline-hidden font-medium"
                />
              </div>

              {/* Penerbit Buku */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-[#005AC1]" />
                  <span>Penerbit (Opsional)</span>
                </label>
                <input
                  type="text"
                  disabled={!accessStatus.isOpen}
                  value={bookPublisher}
                  onChange={(e) => setBookPublisher(e.target.value)}
                  placeholder="Contoh: Balai Pustaka"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:border-[#005AC1] focus:ring-2 focus:ring-[#005AC1]/20 outline-hidden font-medium"
                />
              </div>

              {/* Tahun Terbit */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#005AC1]" />
                  <span>Tahun Terbit (Opsional)</span>
                </label>
                <input
                  type="text"
                  disabled={!accessStatus.isOpen}
                  value={bookPublishYear}
                  onChange={(e) => setBookPublishYear(e.target.value)}
                  placeholder="Contoh: 2022"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:border-[#005AC1] focus:ring-2 focus:ring-[#005AC1]/20 outline-hidden font-medium"
                />
              </div>
            </div>

            {/* Halaman Dibaca */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-[#005AC1]" />
                  <span>Bagian / Halaman yang Dibaca <span className="text-red-500">*</span></span>
                </label>
                <span className="text-[10px] text-slate-400 font-medium">(Wajib diisi untuk +10 poin Q1)</span>
              </div>
              <input
                type="text"
                required
                disabled={!accessStatus.isOpen}
                placeholder="Contoh: Hal. 1 - 35, atau Bab 1 s.d. Bab 2"
                value={pagesRead}
                onChange={(e) => setPagesRead(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:border-[#005AC1] focus:ring-2 focus:ring-[#005AC1]/20 outline-hidden font-medium disabled:bg-slate-100"
              />
            </div>
          </div>

          {/* ================= BAGIAN 2 (Q2): RINGKASAN ISI BUKU (+30 POIN) ================= */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-1 pb-1">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#005AC1]" />
                <span>Q2. Ringkasan Isi Buku <span className="text-red-500">*</span></span>
              </label>

              {/* Badge Indikator Poin Q2 */}
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 ${
                isQ2Filled 
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                {isQ2Filled ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>+30 Poin Terkumpul ✓ ({wordCount}/50 Kata)</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3 text-amber-500" />
                    <span>+0 Poin ({wordCount}/50 Kata - Kurang {Math.max(0, 50 - wordCount)} kata lagi)</span>
                  </>
                )}
              </span>
            </div>

            <textarea
              required
              rows={4}
              disabled={!accessStatus.isOpen}
              placeholder="Tuliskan ringkasan isi buku secara mendalam, alur cerita utama, tokoh, atau gagasan penting dari bagian buku yang telah Anda baca (minimal 50 kata untuk +30 poin)..."
              value={ringkasanIsi}
              onChange={(e) => setRingkasanIsi(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-[#005AC1] focus:ring-2 focus:ring-[#005AC1]/20 transition-all outline-hidden resize-none font-medium disabled:bg-slate-100 placeholder:text-slate-400"
            />
          </div>

          {/* ================= BAGIAN 3 (Q3): KELEBIHAN BUKU (+15 POIN) ================= */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-1 pb-1">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ThumbsUp className="w-4 h-4 text-emerald-600" />
                <span>Q3. Kelebihan Buku</span>
              </label>

              {/* Badge Indikator Poin Q3 */}
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition-all flex items-center gap-1 ${
                isQ3Filled 
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}>
                {isQ3Filled ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>+15 Poin Terkumpul ✓</span>
                  </>
                ) : (
                  <span>+0 Poin (Belum Terisi)</span>
                )}
              </span>
            </div>

            <textarea
              rows={2}
              disabled={!accessStatus.isOpen}
              placeholder="Tuliskan keunggulan buku (misal: gaya bahasa lugas, visual menarik, pesan moral berbobot)..."
              value={kelebihanBuku}
              onChange={(e) => setKelebihanBuku(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 transition-all outline-hidden resize-none font-medium disabled:bg-slate-100 placeholder:text-slate-400"
            />
          </div>

          {/* ================= BAGIAN 4 (Q4): KEKURANGAN BUKU (+15 POIN) ================= */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-1 pb-1">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ThumbsDown className="w-4 h-4 text-rose-600" />
                <span>Q4. Kekurangan Buku</span>
              </label>

              {/* Badge Indikator Poin Q4 */}
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition-all flex items-center gap-1 ${
                isQ4Filled 
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}>
                {isQ4Filled ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>+15 Poin Terkumpul ✓</span>
                  </>
                ) : (
                  <span>+0 Poin (Belum Terisi)</span>
                )}
              </span>
            </div>

            <textarea
              rows={2}
              disabled={!accessStatus.isOpen}
              placeholder="Tuliskan kekurangan atau hal yang dirasa dapat diperbaiki dari buku ini..."
              value={kekuranganBuku}
              onChange={(e) => setKekuranganBuku(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-rose-600 focus:ring-2 focus:ring-rose-600/20 transition-all outline-hidden resize-none font-medium disabled:bg-slate-100 placeholder:text-slate-400"
            />
          </div>

          {/* ================= BAGIAN 5 (Q5): SARAN & KELAYAKAN BUKU (+20 POIN) ================= */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-1 pb-1">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>Q5. Saran / Pertimbangan Kelayakan Dibaca</span>
              </label>

              {/* Badge Indikator Poin Q5 */}
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition-all flex items-center gap-1 ${
                isQ5Filled 
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}>
                {isQ5Filled ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>+20 Poin Terkumpul ✓</span>
                  </>
                ) : (
                  <span>+0 Poin (Belum Terisi)</span>
                )}
              </span>
            </div>

            <textarea
              rows={2}
              disabled={!accessStatus.isOpen}
              placeholder="Tuliskan rekomendasi atau pertimbangan kelayakan buku bagi pembaca lain..."
              value={saranKelayakan}
              onChange={(e) => setSaranKelayakan(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all outline-hidden resize-none font-medium disabled:bg-slate-100 placeholder:text-slate-400"
            />
          </div>

          {/* ================= REAL-TIME TOTAL POINTS BREAKDOWN BOX ================= */}
          <div className="p-4 bg-gradient-to-br from-[#F8FAFF] via-blue-50/40 to-indigo-50/40 rounded-2xl border-2 border-blue-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-[#001A41] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Total Estimasi Poin Laporan Ini:</span>
              </span>
              <span className="text-sm font-black text-[#005AC1] bg-white px-3 py-1 rounded-full border border-blue-200 shadow-2xs">
                {totalEstimatedBasePoints} / 100 Poin Dasar
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 transition-all duration-300"
                style={{ width: `${Math.min(100, totalEstimatedBasePoints)}%` }}
              />
            </div>

            {/* 6 Micro Component Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
              <div className="p-2 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                <span className="text-slate-600">Sesi Membaca:</span>
                <strong className="text-emerald-600 font-black">+{readingSessionPoints} Pts</strong>
              </div>
              <div className={`p-2 rounded-xl border flex items-center justify-between ${
                isQ1Filled ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'
              }`}>
                <span className="text-slate-600">Q1. Identitas:</span>
                <strong className={isQ1Filled ? 'text-emerald-600 font-black' : 'text-slate-400 font-medium'}>
                  +{q1IdentitasPoints} Pts
                </strong>
              </div>
              <div className={`p-2 rounded-xl border flex items-center justify-between ${
                isQ2Filled ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'
              }`}>
                <span className="text-slate-600">Q2. Ringkasan (50k):</span>
                <strong className={isQ2Filled ? 'text-emerald-600 font-black' : 'text-slate-400 font-medium'}>
                  +{q2RingkasanPoints} Pts
                </strong>
              </div>
              <div className={`p-2 rounded-xl border flex items-center justify-between ${
                isQ3Filled ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'
              }`}>
                <span className="text-slate-600">Q3. Kelebihan:</span>
                <strong className={isQ3Filled ? 'text-emerald-600 font-black' : 'text-slate-400 font-medium'}>
                  +{q3KelebihanPoints} Pts
                </strong>
              </div>
              <div className={`p-2 rounded-xl border flex items-center justify-between ${
                isQ4Filled ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'
              }`}>
                <span className="text-slate-600">Q4. Kekurangan:</span>
                <strong className={isQ4Filled ? 'text-emerald-600 font-black' : 'text-slate-400 font-medium'}>
                  +{q4KekuranganPoints} Pts
                </strong>
              </div>
              <div className={`p-2 rounded-xl border flex items-center justify-between ${
                isQ5Filled ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'
              }`}>
                <span className="text-slate-600">Q5. Saran:</span>
                <strong className={isQ5Filled ? 'text-emerald-600 font-black' : 'text-slate-400 font-medium'}>
                  +{q5SaranPoints} Pts
                </strong>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium pt-1">
              <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>* Guru & Admin Perpustakaan dapat memberikan <strong>Bonus Poin Kualitas Ulasan</strong> tambahan saat memvalidasi laporan.</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-5 text-xs font-bold text-slate-700 hover:bg-[#EEF3FF] rounded-full transition-colors cursor-pointer"
            >
              Batal
            </button>

            {accessStatus.isOpen ? (
              <button
                type="submit"
                disabled={loading}
                className="py-2.5 px-6 bg-[#005AC1] hover:bg-[#00479A] text-white text-xs font-bold rounded-full transition-all shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim Laporan Lengkap ({totalEstimatedBasePoints} Poin)</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="py-2.5 px-6 bg-slate-200 text-slate-500 text-xs font-bold rounded-full flex items-center gap-2 cursor-not-allowed opacity-80"
              >
                <Lock className="w-3.5 h-3.5 text-rose-500" />
                <span>Akses Pengiriman Ditutup</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
