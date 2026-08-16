import React, { useState } from 'react';
import { FileText, Calendar, CheckCircle2, Clock, Search, BookOpen, Bookmark, Filter } from 'lucide-react';
import { ReadingReport } from '../../types';

interface MyReportsTabProps {
  reports: ReadingReport[];
  loading: boolean;
}

export const MyReportsTab: React.FC<MyReportsTabProps> = ({ reports, loading }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredReports = reports.filter(
    (rep) =>
      rep.bookTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rep.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rep.pagesRead.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20 md:pb-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white p-6 rounded-[24px] border border-[#E2E8F8] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#005AC1]" />
            <span>Laporan Saya</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Riwayat dan bukti pengiriman laporan membaca buku Anda
          </p>
        </div>

        <div className="px-4 py-2 bg-[#EEF3FF] border border-[#D8E2FF] rounded-full text-xs font-bold text-[#001A41] flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#005AC1]" />
          <span>Total Laporan: {reports.length}</span>
        </div>
      </div>

      {/* Search Filter */}
      <div className="bg-white p-3.5 rounded-[20px] border border-[#E2E8F8] shadow-xs">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari dalam riwayat laporan (judul buku/isi rangkuman)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#F3F4F9] border border-[#74777F]/30 rounded-full focus:bg-white focus:border-[#005AC1] focus:ring-2 focus:ring-[#005AC1]/20 transition-all outline-hidden font-medium"
          />
        </div>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="bg-white rounded-[24px] border border-[#E2E8F8] p-12 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#005AC1] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Memuat riwayat laporan Anda...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-white rounded-[28px] border border-[#E2E8F8] p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-[#EEF3FF] rounded-full flex items-center justify-center mx-auto text-[#005AC1]">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-700">Belum Ada Laporan Membaca</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? 'Tidak ada laporan yang cocok dengan pencarian Anda.'
              : 'Anda belum pernah mengirim laporan literasi. Pilih buku di Perpustakaan dan klik "Selesai Membaca & Kirim Laporan".'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((rep, idx) => {
            const reportDate = rep.timestamp 
              ? new Date(rep.timestamp).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : rep.dateStr || 'Tanggal tidak dicatat';

            return (
              <div
                key={rep.id ? `my-rep-${rep.id}-${idx}` : `my-rep-idx-${idx}`}
                className="bg-white rounded-[24px] border border-[#E2E8F8] p-5 shadow-xs hover:border-[#005AC1]/40 transition-all space-y-3"
              >
                {/* Card Top Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E2E8F8]">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-[#EEF3FF] text-[#005AC1] rounded-full">
                      <BookOpen className="w-4 h-4" />
                    </span>
                    <h3 className="font-bold text-sm text-slate-900">{rep.bookTitle}</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-[#C2E8FF] text-[#001E30]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#006399]" />
                      <span>{rep.status || 'Terkirim'}</span>
                    </span>
                  </div>
                </div>

                {/* Report Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-700 bg-[#F3F4F9] p-2.5 rounded-xl border border-slate-100">
                    <Bookmark className="w-4 h-4 text-[#005AC1] shrink-0" />
                    <span>Halaman: <strong className="text-slate-900">{rep.pagesRead}</strong></span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-700 bg-[#F3F4F9] p-2.5 rounded-xl border border-slate-100">
                    <Calendar className="w-4 h-4 text-[#005AC1] shrink-0" />
                    <span className="truncate">{reportDate}</span>
                  </div>
                </div>

                {/* Summary / Reflection Box */}
                <div className="bg-[#EEF3FF]/60 p-4 rounded-2xl border border-[#D8E2FF] space-y-1">
                  <div className="text-[11px] font-bold text-[#001A41] uppercase tracking-wider">
                    Rangkuman / Refleksi Siswa:
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-medium">
                    "{rep.summary}"
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
