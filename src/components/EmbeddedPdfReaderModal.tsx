import React, { useState } from 'react';
import { X, ExternalLink, Edit3, BookOpen, AlertCircle, Maximize2, Minimize2, Lock, FileText, CheckCircle2 } from 'lucide-react';
import { Book, AppSettings } from '../types';
import { formatPdfEmbedUrl } from '../lib/firebase';
import { checkLiteracyAccess } from '../utils/pointsAndSchedule';

interface EmbeddedPdfReaderModalProps {
  book: Book | null;
  isOpen: boolean;
  appSettings?: AppSettings;
  onClose: () => void;
  onCompleteReading: (book: Book) => void;
  onOpenReport?: (book: Book) => void;
}

export const EmbeddedPdfReaderModal: React.FC<EmbeddedPdfReaderModalProps> = ({
  book,
  isOpen,
  appSettings,
  onClose,
  onCompleteReading,
  onOpenReport,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [iframeError, setIframeError] = useState(false);

  React.useEffect(() => {
    setIframeError(false);
  }, [book?.id, isOpen]);

  if (!isOpen || !book) return null;

  const accessStatus = checkLiteracyAccess(appSettings);
  const formattedUrl = formatPdfEmbedUrl(book.pdfUrl);

  const handleOpenReportForm = () => {
    if (onOpenReport) {
      onOpenReport(book);
    } else {
      onCompleteReading(book);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 p-0 sm:p-2 animate-fade-in">
      <div 
        className={`bg-slate-900 rounded-none sm:rounded-2xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col transition-all duration-300 w-full h-full ${
          isFullscreen 
            ? 'max-w-none max-h-none rounded-none' 
            : 'max-w-6xl max-h-[94vh] sm:rounded-2xl'
        }`}
      >
        {/* Top Header Bar (Material Design 3 High Contrast Header) */}
        <div className="bg-slate-950 text-white px-4 sm:px-6 py-3 flex items-center justify-between gap-3 shrink-0 border-b border-slate-800 shadow-md">
          {/* Left: Book Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 border border-sky-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-white truncate leading-tight">{book.title}</h3>
                <span className="hidden md:inline-block px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-semibold uppercase tracking-wider border border-slate-700">
                  {book.category}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">Penulis: <span className="text-slate-200 font-medium">{book.author}</span></p>
            </div>
          </div>

          {/* Right Header Buttons (Material Design 3 Controls) */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* 1. Tombol Tulis Laporan Rangkuman (MD3 Primary Action) */}
            {accessStatus.isOpen ? (
              <button
                type="button"
                onClick={handleOpenReportForm}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-black text-xs rounded-full transition-all shadow-md flex items-center gap-1.5 cursor-pointer shrink-0"
                title="Tulis Laporan Rangkuman Buku Ini"
              >
                <Edit3 className="w-4 h-4 shrink-0 text-slate-950" />
                <span>Tulis Laporan Rangkuman</span>
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="px-4 py-2 bg-slate-800 text-slate-400 font-bold text-xs rounded-full border border-slate-700 flex items-center gap-1.5 cursor-not-allowed opacity-80 shrink-0"
                title="Akses Laporan Sedang Ditutup oleh Admin"
              >
                <Lock className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Akses Laporan Ditutup</span>
              </button>
            )}

            {/* 2. Tombol Tutup / Keluar (MD3 Close Button) */}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-black text-xs rounded-full transition-all shadow-md flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Keluar / Tutup Mode Baca"
            >
              <X className="w-4 h-4 shrink-0" />
              <span>Keluar</span>
            </button>
          </div>
        </div>

        {/* Access Closed Warning Banner inside Reader if admin closed */}
        {!accessStatus.isOpen && (
          <div className="bg-rose-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-between shadow-md shrink-0 border-b border-rose-700">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-200 shrink-0" />
              <span>Akses Kegiatan Literasi Sedang Ditutup oleh Admin. Tombol pengiriman laporan saat ini dikunci.</span>
            </div>
          </div>
        )}

        {/* Reader Body (iframe / fallback) */}
        <div className="relative flex-1 bg-slate-900 overflow-hidden">
          {/* Overlay Blocker over Google Drive's top-right pop-out button */}
          {!iframeError && (
            <div 
              className="absolute top-0 right-0 w-28 h-14 z-20 pointer-events-auto bg-transparent cursor-default" 
              title="Mode Baca Aktif - Akses keluar tab dinonaktifkan"
            />
          )}

          {iframeError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900 text-slate-100">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-4 shadow-lg">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-white">Pratinjau PDF Tidak Dapat Dimuat dalam Frame</h4>
              <p className="text-xs text-slate-400 max-w-md mt-2 mb-6 leading-relaxed">
                Pratinjau Google Drive ini dibatasi oleh kebijakan keamanan browser atau hak akses file. Silakan buka e-book di tab baru untuk langsung membaca.
              </p>
              <a
                href={formattedUrl || book.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3.5 px-7 bg-[#005AC1] hover:bg-[#00479A] text-white rounded-2xl text-xs font-extrabold transition-all shadow-xl inline-flex items-center gap-2.5 cursor-pointer hover:scale-105"
              >
                <ExternalLink className="w-4 h-4 text-sky-300" />
                <span>Buka E-Book di Tab Baru</span>
              </a>
            </div>
          ) : (
            <iframe
              src={formattedUrl}
              title={book.title}
              className="w-full h-full border-0 bg-white"
              allow="autoplay; encrypted-media"
              onError={() => setIframeError(true)}
            />
          )}
        </div>

        {/* Bottom Floating Bar / Footer */}
        <div className="bg-slate-950 px-4 sm:px-6 py-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-400 shrink-0" />
            <span>Mode Baca Aktif • {book.title}</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
            >
              Tutup
            </button>

            {accessStatus.isOpen ? (
              <button
                type="button"
                onClick={handleOpenReportForm}
                className="py-2 px-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-full transition-all shadow-md flex items-center justify-center gap-2 grow sm:grow-0 cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>Tulis Laporan Rangkuman</span>
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="py-2 px-5 bg-slate-800 text-slate-500 font-bold text-xs rounded-full flex items-center justify-center gap-2 grow sm:grow-0 cursor-not-allowed border border-slate-700"
              >
                <Lock className="w-4 h-4 text-rose-400" />
                <span>Akses Laporan Ditutup</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
