export type UserRole = 'siswa' | 'admin';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  kelas: string; // e.g. "X-1"
  role: UserRole;
  isProfileComplete?: boolean; // True if name & class are set
  createdAt?: string;
  updatedAt?: string;
  badges?: string[]; // Array of unlocked badge IDs
  badgeEarnedDates?: Record<string, string>; // Map of badgeId -> ISO string date
  streakCount?: number; // Current consecutive reading day streak
  lastReadDate?: string; // Last date YYYY-MM-DD
}

export interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  coverUrl: string;
  pdfUrl: string;
  description?: string;
  pageCount?: number;
  createdAt?: string;
  status?: 'draft' | 'published'; // 'draft' = Disembunyikan, 'published' = Tampil di Siswa
  isPublished?: boolean;
}

export interface ReadingReport {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  kelas: string;
  bookId: string;
  bookTitle: string;
  bookAuthor?: string;
  bookPublisher?: string;
  bookPublishYear?: string;
  pagesRead: string;
  
  // 5 Structured review fields
  identitasBuku?: {
    judul?: string;
    penulis?: string;
    penerbit?: string;
    tahunTerbit?: string;
    halamanDibaca?: string;
  };
  ringkasanIsi?: string; // b. Ringkasan Isi Buku
  kelebihanBuku?: string; // c. Kelebihan Buku
  kekuranganBuku?: string; // d. Kekurangan Buku
  saranKelayakan?: string; // e. Saran / Pertimbangan Kelayakan Buku

  summary: string; // Unified review string combining all 5 sections
  summaryWordCount?: number;
  
  // Point system (Total 100 base component points + custom admin bonus)
  readingSessionPoints?: number; // Sesi Membaca E-Book (10 pts)
  q1IdentitasPoints?: number;    // Q1. Identitas Buku & Hal (10 pts)
  q2RingkasanPoints?: number;    // Q2. Ringkasan min 50 kata (30 pts)
  q3KelebihanPoints?: number;    // Q3. Kelebihan Buku (15 pts)
  q4KekuranganPoints?: number;   // Q4. Kekurangan Buku (15 pts)
  q5SaranPoints?: number;        // Q5. Saran & Kelayakan (20 pts)
  baseTotalPoints?: number;      // Total of 6 components above (up to 100 pts)

  // Legacy fallback fields for backward compatibility
  baseReadingPoints?: number; 
  summaryWordCountPoints?: number; 
  
  adminBonusPoints?: number; // Custom admin bonus points (e.g. 10, 25, 50, 100, etc.)
  pointsTotal?: number; // Total combined points for this report
  status: 'Terkirim' | 'Diverifikasi' | 'Setujui_Bonus' | 'Setujui_Standar' | 'Ditolak';
  validationNote?: string;
  validatedAt?: string;
  validatedBy?: string;
  timestamp: string; // ISO String or formatted timestamp
  dateStr: string;   // YYYY-MM-DD
}

export interface AppSettings {
  adminEmails: string[];
  classes: string[];
  // Literacy Access & Schedule Settings
  scheduleMode?: 'manual' | 'schedule'; // 'manual' force override vs 'schedule' automatic time check
  isAccessOpenManual?: boolean; // Manual toggle switch: true = Buka, false = Tutup
  activeDays?: string[]; // e.g. ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat']
  activeStartTime?: string; // e.g. "07:00"
  activeEndTime?: string; // e.g. "08:00"
}

export interface AdminWhitelistEntry {
  id?: string;
  email: string;
  name?: string;
  role?: 'admin';
  addedAt?: string;
  addedBy?: string;
}

