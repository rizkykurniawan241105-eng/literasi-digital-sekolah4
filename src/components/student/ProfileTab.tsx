import React, { useState } from 'react';
import { Mail, GraduationCap, Award, LogOut, BookOpen, CheckCircle, Shield, Edit3, Sparkles, Flame, Lock, Info, X } from 'lucide-react';
import { UserProfile, ReadingReport, Book } from '../../types';
import { BADGE_DEFINITIONS, Badge, getBadgeProgress, calculateReadingStreak } from '../../data/badges';
import { calculateStudentTotalPoints } from '../../utils/pointsAndSchedule';

interface ProfileTabProps {
  user: UserProfile;
  reports: ReadingReport[];
  books: Book[];
  onChangeClassClick: () => void;
  onLogout: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  user,
  reports,
  books,
  onChangeClassClick,
  onLogout,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedBadgeDetail, setSelectedBadgeDetail] = useState<Badge | null>(null);

  const safeReports = Array.isArray(reports) ? reports : [];
  const totalReports = safeReports.length;
  const uniqueBooksCount = new Set(safeReports.map((r) => r.bookId || r.bookTitle)).size;
  const streakCount = user.streakCount ?? calculateReadingStreak(safeReports);

  const unlockedBadgeIds = new Set<string>(user.badges || []);

  // Filtered Badges
  const filteredBadges = BADGE_DEFINITIONS.filter((badge) => {
    const isUnlocked = unlockedBadgeIds.has(badge.id);
    if (filterCategory === 'unlocked') return isUnlocked;
    if (filterCategory === 'locked') return !isUnlocked;
    if (filterCategory !== 'all') return badge.category === filterCategory;
    return true;
  });

  // Total Points calculated from badges + tiered reading reports
  const badgePointsTotal = BADGE_DEFINITIONS.filter((b) => unlockedBadgeIds.has(b.id)).reduce((acc, b) => acc + b.points, 0);
  const totalPoints = calculateStudentTotalPoints(safeReports, badgePointsTotal);

  return (
    <div className="space-y-6 pb-20 md:pb-6 animate-fade-in max-w-4xl mx-auto">
      {/* Profile Card Banner */}
      <div className="bg-white rounded-[28px] border border-[#E2E8F8] overflow-hidden shadow-xs">
        <div className="h-32 bg-gradient-to-r from-[#005AC1] via-blue-700 to-indigo-800 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        </div>

        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-4">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-full bg-white p-1 shadow-lg shrink-0 border-2 border-[#D8E2FF] relative">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#005AC1] to-blue-800 text-white rounded-full flex items-center justify-center font-black text-2xl shadow-inner">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full border border-white shadow-xs flex items-center gap-0.5">
                  <Award className="w-3 h-3 text-slate-950" />
                  <span>{unlockedBadgeIds.size} Badges</span>
                </div>
              </div>

              <div>
                <h1 className="text-xl font-bold text-slate-900">{user.name}</h1>
                <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1 mt-0.5 font-medium">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{user.email}</span>
                </p>
              </div>
            </div>

            {/* Class Pill & Points */}
            <div className="flex items-center gap-2">
              <div className="px-4 py-1.5 bg-[#EEF3FF] border border-[#D8E2FF] text-[#001A41] rounded-full text-xs font-bold flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-[#005AC1]" />
                <span>Kelas: {user.kelas || 'Belum Set'}</span>
              </div>

              <button
                onClick={onChangeClassClick}
                className="p-2 text-slate-600 hover:text-[#005AC1] hover:bg-[#EEF3FF] rounded-full transition-colors border border-slate-200 cursor-pointer"
                title="Ubah Kelas"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats & Streak Counter Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Streak Counter */}
        <div className="bg-gradient-to-br from-orange-500 via-rose-500 to-amber-500 p-4 rounded-[20px] text-white shadow-md flex items-center gap-3">
          <div className="w-11 h-11 bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center shrink-0 border border-white/30">
            <Flame className="w-6 h-6 animate-pulse text-amber-200" />
          </div>
          <div>
            <div className="text-2xl font-black tracking-tight">{streakCount} Hari</div>
            <div className="text-[11px] font-bold text-orange-100 uppercase tracking-wider">Streak Membaca</div>
          </div>
        </div>

        {/* Unique Books */}
        <div className="bg-white p-4 rounded-[20px] border border-[#E2E8F8] shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 bg-[#EEF3FF] text-[#005AC1] rounded-full flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{uniqueBooksCount}</div>
            <div className="text-[11px] text-slate-500 font-bold">Buku Dibaca</div>
          </div>
        </div>

        {/* Total Reports */}
        <div className="bg-white p-4 rounded-[20px] border border-[#E2E8F8] shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 bg-[#EEF3FF] text-[#005AC1] rounded-full flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{totalReports}</div>
            <div className="text-[11px] text-slate-500 font-bold">Laporan Literasi</div>
          </div>
        </div>

        {/* Total Points */}
        <div className="bg-white p-4 rounded-[20px] border border-[#E2E8F8] shadow-xs flex items-center gap-3">
          <div className="w-11 h-11 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-amber-600">{totalPoints}</div>
            <div className="text-[11px] text-slate-500 font-bold">Total Poin Literasi</div>
          </div>
        </div>
      </div>

      {/* Lencana & Pencapaian Section */}
      <div className="bg-white p-6 rounded-[28px] border border-[#E2E8F8] shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F8]">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Sistem Lencana & Prestasi Literasi</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Kumpulkan lencana prestisius dengan rajin membaca dan konsisten mengulas buku!
            </p>
          </div>

          <div className="px-3.5 py-1 bg-amber-50 border border-amber-200 text-amber-900 rounded-full text-xs font-bold self-start sm:self-auto flex items-center gap-1.5">
            <span>Selesai:</span>
            <span className="font-extrabold text-amber-950">
              {unlockedBadgeIds.size} / {BADGE_DEFINITIONS.length}
            </span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          {[
            { id: 'all', label: 'Semua Lencana' },
            { id: 'unlocked', label: `Terbuka (${unlockedBadgeIds.size})` },
            { id: 'locked', label: `Terkunci (${BADGE_DEFINITIONS.length - unlockedBadgeIds.size})` },
            { id: 'buku', label: '📚 Koleksi Buku' },
            { id: 'streak', label: '🔥 Streak' },
            { id: 'kategori', label: '🌈 Kategori' },
            { id: 'laporan', label: '✍️ Laporan' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterCategory(tab.id)}
              className={`px-4 py-2 rounded-full font-bold whitespace-nowrap transition-all cursor-pointer ${
                filterCategory === tab.id
                  ? 'bg-[#005AC1] text-white shadow-xs'
                  : 'bg-[#F3F4F9] hover:bg-slate-200/80 text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBadges.map((badge) => {
            const isUnlocked = unlockedBadgeIds.has(badge.id);
            const progress = getBadgeProgress(badge, reports, books);
            const earnedDate = user.badgeEarnedDates?.[badge.id];

            return (
              <div
                key={badge.id}
                onClick={() => setSelectedBadgeDetail(badge)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between group ${
                  isUnlocked
                    ? 'bg-gradient-to-br from-sky-50/60 via-white to-amber-50/30 border-sky-300 hover:border-sky-400 hover:shadow-md'
                    : 'bg-slate-50/70 border-slate-200 opacity-75 hover:opacity-100 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`text-3xl shrink-0 p-2 rounded-2xl transition-transform group-hover:scale-110 ${
                        isUnlocked ? 'bg-white shadow-xs border border-sky-100' : 'bg-slate-200/60 grayscale'
                      }`}>
                        {badge.icon}
                      </div>

                      <div>
                        <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1">
                          <span>{badge.name}</span>
                          {isUnlocked ? (
                            <CheckCircle className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                          ) : (
                            <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                          )}
                        </h3>
                        <p className="text-[11px] text-slate-500 font-medium">{badge.reqText}</p>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isUnlocked
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-slate-200 text-slate-600 border-slate-300'
                    }`}>
                      +{badge.points} Poin
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed mb-3 line-clamp-2">
                    {badge.description}
                  </p>
                </div>

                {/* Progress Bar or Earned Tag */}
                <div className="pt-2 border-t border-slate-100">
                  {isUnlocked ? (
                    <div className="flex items-center justify-between text-[10px] font-bold text-sky-700">
                      <span>✓ Lencana Terbuka</span>
                      {earnedDate && (
                        <span className="text-slate-400 font-medium">
                          {new Date(earnedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                        <span>Progres Lencana</span>
                        <span className="font-bold text-slate-700">{progress.current} / {progress.target}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-sky-500 to-blue-600 rounded-full transition-all duration-500"
                          style={{ width: `${progress.percentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Badge Detail Modal */}
      {selectedBadgeDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-sky-100 shadow-2xl relative space-y-4">
            <button
              onClick={() => setSelectedBadgeDetail(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2 pt-2">
              <div className="text-5xl mx-auto p-4 bg-sky-50 rounded-3xl w-20 h-20 flex items-center justify-center border border-sky-100 shadow-xs">
                {selectedBadgeDetail.icon}
              </div>

              <h3 className="text-base font-black text-slate-900">{selectedBadgeDetail.name}</h3>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Bonus +{selectedBadgeDetail.points} Poin Literasi</span>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                <Info className="w-4 h-4 text-sky-600 shrink-0" />
                <span>Syarat Pembukaan:</span>
              </div>
              <p className="text-slate-600 leading-relaxed">{selectedBadgeDetail.description}</p>
            </div>

            {/* Status in detail */}
            {unlockedBadgeIds.has(selectedBadgeDetail.id) ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold text-center flex items-center justify-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Selamat! Lencana Ini Sudah Terbuka</span>
              </div>
            ) : (
              <div className="p-3 bg-sky-50 border border-sky-200 text-sky-900 rounded-2xl text-xs space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Progres Anda:</span>
                  <span>
                    {getBadgeProgress(selectedBadgeDetail, reports, books).current} / {selectedBadgeDetail.target}
                  </span>
                </div>
                <div className="w-full h-2 bg-sky-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-600 rounded-full"
                    style={{ width: `${getBadgeProgress(selectedBadgeDetail, reports, books).percentage}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={() => setSelectedBadgeDetail(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Tutup Modal
            </button>
          </div>
        </div>
      )}

      {/* Account Control & Logout */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800">Autentikasi Akun Google</h3>
            <p className="text-[11px] text-slate-500">Terhubung secara aman dengan Firebase Auth</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full sm:w-auto py-2.5 px-5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar dari Akun</span>
        </button>
      </div>
    </div>
  );
};
