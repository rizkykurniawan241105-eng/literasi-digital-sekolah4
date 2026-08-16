import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  Award, 
  Crown, 
  Medal, 
  Sparkles, 
  Flame, 
  Search, 
  GraduationCap, 
  User as UserIcon, 
  CheckCircle2, 
  TrendingUp, 
  BarChart3,
  Star
} from 'lucide-react';
import { ReadingReport, UserProfile } from '../../types';
import { calculateReportPoints } from '../../utils/pointsAndSchedule';

interface LeaderboardTabProps {
  reports: ReadingReport[];
  currentUser: UserProfile;
  classList: string[];
}

interface StudentRank {
  userId: string;
  userName: string;
  userEmail: string;
  kelas: string;
  reportCount: number;
  totalPagesRead: number;
  points: number;
  rank: number;
  photoURL?: string;
}

export const LeaderboardTab: React.FC<LeaderboardTabProps> = ({
  reports,
  currentUser,
  classList,
}) => {
  const [selectedScope, setSelectedScope] = useState<'sekolah' | 'kelas'>('sekolah');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'semua' | 'bulan_ini'>('semua');
  const [searchQuery, setSearchQuery] = useState('');

  // Current Month String YYYY-MM
  const currentMonthStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  // Filtered reports by timeframe
  const activeReports = useMemo(() => {
    return reports.filter((r) => {
      if (selectedTimeframe === 'bulan_ini') {
        return r.dateStr && r.dateStr.startsWith(currentMonthStr);
      }
      return true;
    });
  }, [reports, selectedTimeframe, currentMonthStr]);

  // Compute student rankings
  const studentRankings = useMemo(() => {
    const map = new Map<string, StudentRank>();

    activeReports.forEach((rep) => {
      const key = rep.userId || rep.userEmail || rep.userName;
      const pages = parseInt(rep.pagesRead, 10) || 15;
      const rPoints = calculateReportPoints(rep).totalPoints;

      if (!map.has(key)) {
        map.set(key, {
          userId: key,
          userName: rep.userName || 'Siswa',
          userEmail: rep.userEmail || '',
          kelas: rep.kelas || 'Umum',
          reportCount: 1,
          totalPagesRead: pages,
          points: rPoints,
          rank: 0,
        });
      } else {
        const existing = map.get(key)!;
        existing.reportCount += 1;
        existing.totalPagesRead += pages;
        existing.points += rPoints;
      }
    });

    // Make sure current user is included if they have 0 reports
    const currentKey = currentUser.uid || currentUser.email;
    if (!map.has(currentKey)) {
      map.set(currentKey, {
        userId: currentKey,
        userName: currentUser.name,
        userEmail: currentUser.email,
        kelas: currentUser.kelas || 'X-1',
        reportCount: 0,
        totalPagesRead: 0,
        points: 0,
        rank: 0,
      });
    }

    // Convert map to array and sort by points
    let arr = Array.from(map.values());

    // Filter scope if "kelas"
    if (selectedScope === 'kelas' && currentUser.kelas) {
      arr = arr.filter((s) => s.kelas === currentUser.kelas);
    }

    // Sort by points descending
    arr.sort((a, b) => b.points - a.points || b.reportCount - a.reportCount);

    // Assign rank positions
    arr.forEach((item, index) => {
      item.rank = index + 1;
    });

    return arr;
  }, [activeReports, currentUser, selectedScope]);

  // Compute Class Rankings
  const classRankings = useMemo(() => {
    const classMap = new Map<string, { kelas: string; totalReports: number; studentCount: Set<string> }>();

    activeReports.forEach((rep) => {
      const cls = rep.kelas || 'Lainnya';
      if (!classMap.has(cls)) {
        classMap.set(cls, { kelas: cls, totalReports: 1, studentCount: new Set([rep.userId]) });
      } else {
        const item = classMap.get(cls)!;
        item.totalReports += 1;
        item.studentCount.add(rep.userId);
      }
    });

    const arr = Array.from(classMap.values()).map((c) => ({
      kelas: c.kelas,
      totalReports: c.totalReports,
      activeStudents: c.studentCount.size,
      avgPerStudent: (c.totalReports / (c.studentCount.size || 1)).toFixed(1),
    }));

    arr.sort((a, b) => b.totalReports - a.totalReports);
    return arr;
  }, [activeReports]);

  // Find Current Student Rank
  const currentKey = currentUser.uid || currentUser.email;
  const myRankInfo = studentRankings.find((s) => s.userId === currentKey) || {
    userId: currentKey,
    userName: currentUser.name,
    userEmail: currentUser.email,
    kelas: currentUser.kelas || 'X-1',
    reportCount: 0,
    totalPagesRead: 0,
    points: 0,
    rank: studentRankings.length + 1,
  };

  // Search filtered student list
  const filteredRankings = useMemo(() => {
    if (!searchQuery.trim()) return studentRankings;
    return studentRankings.filter(
      (s) =>
        s.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.kelas.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [studentRankings, searchQuery]);

  // Top 3 Podium
  const top1 = studentRankings[0];
  const top2 = studentRankings[1];
  const top3 = studentRankings[2];

  return (
    <div className="space-y-6 pb-20 md:pb-6 animate-fade-in font-sans">
      {/* Bright Sky Blue Hero Header */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#005AC1] via-blue-700 to-indigo-800 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-48 h-48 bg-sky-200/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/25 text-blue-100 text-xs font-bold uppercase tracking-wider">
              <Trophy className="w-4 h-4 text-amber-300" />
              <span>Papan Peringkat Literasi Sekolah</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug">
              Ranking & Prestasi Membaca
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
              Dapatkan poin literasi setiap kali membaca dan mengirimkan rangkuman buku harian. Tingkatkan posisi kelas Anda menjadi Juara Literasi Sekolah!
            </p>
          </div>

          {/* Current User Quick Rank Widget */}
          <div className="shrink-0 bg-white/15 backdrop-blur-md border border-white/25 p-4 rounded-[20px] flex items-center gap-4 text-white w-full sm:w-auto">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center font-black text-lg shadow-md shrink-0">
              #{myRankInfo.rank}
            </div>
            <div>
              <div className="text-xs font-semibold text-blue-100">Posisi Kamu ({selectedScope === 'sekolah' ? 'Sekolah' : 'Kelas'})</div>
              <div className="text-lg font-extrabold text-white">{myRankInfo.points.toLocaleString()} Poin</div>
              <div className="text-[11px] text-blue-200">{myRankInfo.reportCount} Laporan Selesai</div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Toolbar: Scope & Timeframe Filters */}
      <div className="bg-white p-4 rounded-[24px] border border-[#E2E8F8] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Scope Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#F3F4F9] rounded-full border border-slate-200/60 w-full sm:w-auto">
          <button
            onClick={() => setSelectedScope('sekolah')}
            className={`flex-1 sm:flex-none px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              selectedScope === 'sekolah'
                ? 'bg-[#005AC1] text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            Seluruh Sekolah
          </button>
          <button
            onClick={() => setSelectedScope('kelas')}
            className={`flex-1 sm:flex-none px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              selectedScope === 'kelas'
                ? 'bg-[#005AC1] text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            Kelas Saya ({currentUser.kelas || 'X-1'})
          </button>
        </div>

        {/* Timeframe Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs font-bold text-slate-500 hidden sm:inline">Periode:</span>
          <div className="flex items-center gap-1.5 p-1 bg-[#F3F4F9] rounded-full border border-slate-200/60">
            <button
              onClick={() => setSelectedTimeframe('semua')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedTimeframe === 'semua'
                  ? 'bg-white text-[#001A41] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Waktu
            </button>
            <button
              onClick={() => setSelectedTimeframe('bulan_ini')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedTimeframe === 'bulan_ini'
                  ? 'bg-white text-[#001A41] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bulan Ini
            </button>
          </div>
        </div>
      </div>

      {/* TOP 3 PODIUM DISPLAY */}
      {studentRankings.length > 0 && (
        <div className="pt-2">
          <div className="text-center mb-4">
            <h2 className="text-base font-black text-slate-900 inline-flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              <span>3 Besar Pembaca Teraktif ({selectedScope === 'sekolah' ? 'Sekolah' : currentUser.kelas})</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end max-w-4xl mx-auto">
            {/* Rank #2 Silver */}
            {top2 ? (
              <div className="bg-gradient-to-b from-slate-50 to-slate-100 rounded-3xl border border-slate-200 p-5 text-center shadow-xs order-2 sm:order-1 relative group hover:shadow-md transition-all">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-200 text-slate-800 text-[11px] font-black px-3 py-0.5 rounded-full border border-slate-300 shadow-xs flex items-center gap-1">
                  <Medal className="w-3.5 h-3.5 text-slate-500" /> Juara 2
                </div>
                <div className="w-16 h-16 rounded-2xl bg-slate-200 text-slate-700 mx-auto mt-2 flex items-center justify-center font-black text-xl border-2 border-slate-300 shadow-inner">
                  {top2.userName.charAt(0).toUpperCase()}
                </div>
                <h3 className="font-bold text-sm text-slate-900 mt-3 truncate">{top2.userName}</h3>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-700 text-[10px] font-bold mt-1">
                  Kelas {top2.kelas}
                </span>
                <div className="mt-3 pt-3 border-t border-slate-200 text-xs">
                  <div className="font-extrabold text-sky-700 text-base">{top2.points.toLocaleString()} Poin</div>
                  <div className="text-[11px] text-slate-500">{top2.reportCount} Laporan • {top2.totalPagesRead} Hal.</div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-3xl border border-dashed border-slate-200 p-6 text-center text-slate-400 order-2 sm:order-1">
                Belum Ada Juara 2
              </div>
            )}

            {/* Rank #1 Gold */}
            {top1 ? (
              <div className="bg-gradient-to-b from-amber-500/10 via-sky-50/50 to-white rounded-3xl border-2 border-amber-400 p-6 text-center shadow-lg shadow-amber-500/10 order-1 sm:order-2 relative transform sm:-translate-y-2 group hover:scale-[1.02] transition-all">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 text-xs font-black px-4 py-1 rounded-full border border-amber-300 shadow-md flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-slate-950 fill-amber-300" /> Juara 1 Utama
                </div>
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 mx-auto mt-2 flex items-center justify-center font-black text-2xl border-4 border-amber-200 shadow-lg">
                  {top1.userName.charAt(0).toUpperCase()}
                </div>
                <h3 className="font-extrabold text-base text-slate-900 mt-3 truncate">{top1.userName}</h3>
                <span className="inline-block px-3 py-0.5 rounded-full bg-sky-100 text-sky-800 text-xs font-bold mt-1">
                  Kelas {top1.kelas}
                </span>
                <div className="mt-4 pt-3 border-t border-amber-200/60 text-xs">
                  <div className="font-black text-sky-700 text-xl">{top1.points.toLocaleString()} Poin</div>
                  <div className="text-xs text-slate-600 font-medium">{top1.reportCount} Laporan • {top1.totalPagesRead} Hal.</div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-3xl border border-dashed border-slate-200 p-6 text-center text-slate-400 order-1 sm:order-2">
                Belum Ada Juara 1
              </div>
            )}

            {/* Rank #3 Bronze */}
            {top3 ? (
              <div className="bg-gradient-to-b from-amber-900/5 to-slate-100 rounded-3xl border border-amber-200 p-5 text-center shadow-xs order-3 relative group hover:shadow-md transition-all">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-700 text-white text-[11px] font-black px-3 py-0.5 rounded-full border border-amber-600 shadow-xs flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-200" /> Juara 3
                </div>
                <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-900 mx-auto mt-2 flex items-center justify-center font-black text-xl border-2 border-amber-300 shadow-inner">
                  {top3.userName.charAt(0).toUpperCase()}
                </div>
                <h3 className="font-bold text-sm text-slate-900 mt-3 truncate">{top3.userName}</h3>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-100/80 text-amber-900 text-[10px] font-bold mt-1">
                  Kelas {top3.kelas}
                </span>
                <div className="mt-3 pt-3 border-t border-slate-200 text-xs">
                  <div className="font-extrabold text-sky-700 text-base">{top3.points.toLocaleString()} Poin</div>
                  <div className="text-[11px] text-slate-500">{top3.reportCount} Laporan • {top3.totalPagesRead} Hal.</div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-3xl border border-dashed border-slate-200 p-6 text-center text-slate-400 order-3">
                Belum Ada Juara 3
              </div>
            )}
          </div>
        </div>
      )}

      {/* FULL RANKING TABLE LIST */}
      <div className="bg-white rounded-[28px] border border-[#E2E8F8] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#E2E8F8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#005AC1]" />
              <span>Daftar Peringkat Pembaca ({filteredRankings.length})</span>
            </h2>
            <p className="text-xs text-slate-500">
              Setiap 1 Laporan Selesai = +100 Poin + (2 Poin × Hal. Dibaca)
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama siswa atau kelas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-[#F3F4F9] border border-[#74777F]/30 rounded-full focus:bg-white focus:border-[#005AC1] focus:ring-2 focus:ring-[#005AC1]/20 outline-hidden font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F3F4F9] text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-[#E2E8F8]">
              <tr>
                <th className="py-3.5 px-4 text-center">Rank</th>
                <th className="py-3.5 px-4">Siswa</th>
                <th className="py-3.5 px-4">Kelas</th>
                <th className="py-3.5 px-4 text-center">Laporan</th>
                <th className="py-3.5 px-4 text-center">Total Hal.</th>
                <th className="py-3.5 px-4 text-right">Skor Poin</th>
                <th className="py-3.5 px-4 text-center">Lencana</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F8]">
              {filteredRankings.map((student) => {
                const isMe = student.userId === currentKey;
                let badgeLabel = 'Pembaca Aktif';
                let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';

                if (student.rank === 1) {
                  badgeLabel = 'Juara 1 Literasi';
                  badgeStyle = 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
                } else if (student.rank === 2) {
                  badgeLabel = 'Bintang Literasi';
                  badgeStyle = 'bg-slate-200 text-slate-800 border-slate-300 font-bold';
                } else if (student.rank === 3) {
                  badgeLabel = 'Duta Baca';
                  badgeStyle = 'bg-amber-900/10 text-amber-900 border-amber-300 font-bold';
                } else if (student.rank <= 10) {
                  badgeLabel = 'Kutu Buku Utama';
                  badgeStyle = 'bg-[#C2E8FF] text-[#001E30] border-sky-200 font-bold';
                }

                return (
                  <tr
                    key={student.userId}
                    className={`transition-colors ${
                      isMe ? 'bg-[#EEF3FF] font-semibold border-l-4 border-l-[#005AC1]' : 'hover:bg-[#F3F4F9]/60'
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center font-black text-sm">
                      {student.rank === 1 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-black shadow-xs">
                          1
                        </span>
                      ) : student.rank === 2 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-slate-900 font-black shadow-xs">
                          2
                        </span>
                      ) : student.rank === 3 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700 text-white font-black shadow-xs">
                          3
                        </span>
                      ) : (
                        <span className="text-slate-500">#{student.rank}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isMe ? 'bg-[#005AC1] text-white' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {student.userName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                            <span>{student.userName}</span>
                            {isMe && (
                              <span className="px-2 py-0.5 bg-[#005AC1] text-white text-[9px] font-bold rounded-full">
                                Saya
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">{student.userEmail}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      <span className="px-3 py-1 bg-[#F3F4F9] rounded-full text-slate-700 font-bold border border-slate-200">
                        {student.kelas}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                      {student.reportCount} Buku
                    </td>

                    <td className="py-3.5 px-4 text-center text-slate-600 font-medium">
                      {student.totalPagesRead} Hal.
                    </td>

                    <td className="py-3.5 px-4 text-right font-extrabold text-[#005AC1] text-sm">
                      {student.points.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-[10px] border ${badgeStyle}`}
                      >
                        {badgeLabel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CLASS LEADERBOARD SECTION */}
      <div className="bg-white rounded-3xl border border-sky-100 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-sky-600" />
              <span>Papan Peringkat Kelas Teraktif</span>
            </h2>
            <p className="text-xs text-slate-500">
              Persaingan partisipasi membaca antar kelas di sekolah
            </p>
          </div>
        </div>

        {classRankings.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-4 text-center">Belum ada data aktivitas kelas.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {classRankings.slice(0, 6).map((cls, idx) => {
              const maxReports = classRankings[0]?.totalReports || 1;
              const percentage = Math.min(100, Math.round((cls.totalReports / maxReports) * 100));

              return (
                <div
                  key={cls.kelas}
                  className="p-4 rounded-2xl bg-sky-50/50 border border-sky-100 flex flex-col justify-between space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-sky-600 text-white font-black text-xs flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="font-extrabold text-sm text-slate-900">Kelas {cls.kelas}</span>
                    </div>
                    <span className="font-black text-sm text-sky-700">
                      {cls.totalReports} Laporan
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-sky-500 to-blue-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span>{cls.activeStudents} Siswa Berpartisipasi</span>
                    <span>Rata-rata: {cls.avgPerStudent} laporan/siswa</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
