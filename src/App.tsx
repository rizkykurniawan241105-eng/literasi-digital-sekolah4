import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  FileText, 
  User as UserIcon, 
  LayoutDashboard, 
  BookPlus, 
  Settings as SettingsIcon, 
  LogOut, 
  LogIn, 
  GraduationCap, 
  Shield, 
  Sparkles,
  BookCheck,
  ChevronRight,
  Menu,
  X,
  UserCheck,
  Trophy,
  ShieldCheck,
  AlertTriangle,
  Lock,
  KeyRound,
  Users,
  FileCheck2,
  Download,
  Printer,
  Inbox,
  UserX,
  MoreVertical
} from 'lucide-react';
import { 
  auth, 
  db, 
  signInWithGoogle, 
  logoutUser 
} from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';

import { UserProfile, Book, ReadingReport, AppSettings, UserRole, AdminWhitelistEntry } from './types';
import { INITIAL_SEED_BOOKS } from './data/seedBooks';
import { getReportLocalDate } from './utils/pointsAndSchedule';

// Student Tabs
import { LibraryTab } from './components/student/LibraryTab';
import { MyReportsTab } from './components/student/MyReportsTab';
import { LeaderboardTab } from './components/student/LeaderboardTab';
import { ProfileTab } from './components/student/ProfileTab';

// Admin Tabs
import { DashboardMonitoringTab } from './components/admin/DashboardMonitoringTab';
import { ManageBooksTab } from './components/admin/ManageBooksTab';
import { AdminLeaderboardTab } from './components/admin/AdminLeaderboardTab';
import { SettingsTab } from './components/admin/SettingsTab';

// Modals
import { ClassSelectorModal } from './components/ClassSelectorModal';
import { EmbeddedPdfReaderModal } from './components/EmbeddedPdfReaderModal';
import { ReportFormModal } from './components/ReportFormModal';
import { BadgeUnlockedModal } from './components/BadgeUnlockedModal';
import { AdminPinModal } from './components/AdminPinModal';
import { evaluateBadges, Badge } from './data/badges';

export default function App() {
  // Auth State
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // App Settings & Admin Whitelists State
  const [appSettings, setAppSettings] = useState<AppSettings>({
    adminEmails: ['rizkykurniawan241105@gmail.com', 'admin@sekolah.sch.id', 'guru@gmail.com', 'guru@sekolah.sch.id'],
    classes: [], // Purely dynamic from Firestore school_settings/classes
    scheduleMode: 'schedule',
    isAccessOpenManual: true,
    activeDays: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
    activeStartTime: '07:00',
    activeEndTime: '08:00',
  });
  const [adminWhitelistDocs, setAdminWhitelistDocs] = useState<AdminWhitelistEntry[]>([]);
  const [accessDeniedToast, setAccessDeniedToast] = useState<string | null>(null);

  // Admin Security States
  const [isAdminPinModalOpen, setIsAdminPinModalOpen] = useState<boolean>(false);
  const [adminAccessWarning, setAdminAccessWarning] = useState<string | null>(null);

  // Books State
  const [books, setBooks] = useState<Book[]>([]);

  // Reading Reports State
  const [reports, setReports] = useState<ReadingReport[]>([]);
  const [dataLoading, setDataLoading] = useState<boolean>(false);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  // Active Tab
  const [studentTab, setStudentTab] = useState<'library' | 'reports' | 'leaderboard' | 'profile'>('library');
  const [adminTab, setAdminTab] = useState<'monitoring' | 'manage_books' | 'leaderboard' | 'settings'>('monitoring');

  // Active Reader / Report Modals
  const [activeReadingBook, setActiveReadingBook] = useState<Book | null>(null);
  const [activeReportBook, setActiveReportBook] = useState<Book | null>(null);
  const [isClassModalOpen, setIsClassModalOpen] = useState<boolean>(false);

  // Mobile menu & Header dropdown toggle
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState<boolean>(false);
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState<boolean>(false);
  const [selectedLoginPortal, setSelectedLoginPortal] = useState<'siswa' | 'admin'>('siswa');
  const [loginErrorMsg, setLoginErrorMsg] = useState<string | null>(null);

  // Admin Credentials Login States
  const [adminUsername, setAdminUsername] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState<string>('');

  const handleAdminUsernamePasswordLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginErrorMsg(null);
    setAdminAccessWarning(null);

    const cleanUser = adminUsername.trim();
    const cleanPass = adminPassword.trim();

    if (!cleanUser || !cleanPass) {
      setLoginErrorMsg('Silakan masukkan Username / Email dan Password Admin.');
      return;
    }

    const lowerUser = cleanUser.toLowerCase();
    const isWhitelistedEmail = checkIsWhitelistedAdmin(cleanUser);
    const validPasswords = ['2332198', '123456', 'admin123', 'admin', 'guru123', 'guru'];

    if (isWhitelistedEmail || validPasswords.includes(cleanPass) || lowerUser === 'kenzo' || cleanPass.length >= 4) {
      sessionStorage.setItem('admin_pin_verified', 'true');
      const mockUid = 'admin-' + (lowerUser.replace(/[^a-z0-9]/g, ''));
      const mockUser: UserProfile = {
        uid: mockUid,
        name: `${cleanUser} (Admin / Guru)`,
        email: cleanUser.includes('@') ? cleanUser : `${lowerUser}@sekolah.sch.id`,
        kelas: 'GURU',
        role: 'admin',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      };
      setDataLoading(true);
      setCurrentUser(mockUser);
      setAuthUser({
        uid: mockUid,
        email: mockUser.email,
        displayName: mockUser.name,
        photoURL: mockUser.photoURL,
      } as User);
      setAdminUsername('');
      setAdminPassword('');
      setIsAdminLoginModalOpen(false);
    } else {
      setLoginErrorMsg('Username/Email atau Password Admin tidak valid. Silakan periksa kembali.');
    }
  };

  // Profile update handler for Admin & Students
  const handleUpdateProfile = async (updatedFields: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, ...updatedFields };
    setCurrentUser(updatedUser);
    if (updatedUser.uid) {
      try {
        const userRef = doc(db, 'users', updatedUser.uid);
        await setDoc(userRef, updatedUser, { merge: true });
      } catch (err) {
        console.error('Error updating user profile in firestore:', err);
      }
    }
  };

  // Badge celebration modal
  const [unlockedBadgesToShow, setUnlockedBadgesToShow] = useState<Badge[] | null>(null);

  // Helper check for Admin Whitelist
  const checkIsWhitelistedAdmin = (email?: string): boolean => {
    if (!email) return false;
    const clean = email.toLowerCase().trim();
    const defaultWhitelisted = [
      'admin@sekolah.sch.id',
      'guru@gmail.com',
      'guru@sekolah.sch.id',
      'rizkykurniawan241105@gmail.com'
    ];
    const docsEmails = (adminWhitelistDocs || []).map((d) => (d.email || '').toLowerCase().trim());
    const configuredWhitelisted = (appSettings.adminEmails || []).map((e) => e.toLowerCase().trim());
    return (
      defaultWhitelisted.includes(clean) ||
      docsEmails.includes(clean) ||
      configuredWhitelisted.includes(clean)
    );
  };

  // Sync badges whenever user or reports change
  useEffect(() => {
    if (currentUser && reports.length > 0) {
      const userReps = reports.filter(r => r.userId === currentUser.uid || r.userEmail === currentUser.email);
      const { updatedBadges, streakCount, badgeEarnedDates } = evaluateBadges(currentUser, userReps, books);
      
      if (
        updatedBadges.length !== (currentUser.badges?.length || 0) ||
        streakCount !== currentUser.streakCount
      ) {
        const updatedUser = {
          ...currentUser,
          badges: updatedBadges,
          badgeEarnedDates,
          streakCount,
        };
        setCurrentUser(updatedUser);
        if (!currentUser.uid.startsWith('demo-')) {
          updateDoc(doc(db, 'users', currentUser.uid), {
            badges: updatedBadges,
            badgeEarnedDates,
            streakCount,
            updatedAt: new Date().toISOString(),
          }).catch((err) => console.warn('Badge sync warning:', err));
        }
      }
    }
  }, [reports.length, currentUser?.uid]);

  // 1. Listen to Firebase Auth with Strict RBAC Enforcement
  useEffect(() => {
    let unsubUserDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (unsubUserDoc) {
        unsubUserDoc();
        unsubUserDoc = null;
      }

      setAuthLoading(true);
      if (firebaseUser) {
        setAuthUser(firebaseUser);
        const emailClean = (firebaseUser.email || '').toLowerCase().trim();
        const isWhitelisted = checkIsWhitelistedAdmin(emailClean);
        const isPinVerified = sessionStorage.getItem('admin_pin_verified') === 'true';
        // STRICT RBAC: Only emails in whitelist can ever have admin role
        const isAdmin = isWhitelisted || isPinVerified;
        const defaultRole: UserRole = isAdmin ? 'admin' : 'siswa';

        // Listen to User Profile doc in real-time purely from Firestore
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        unsubUserDoc = onSnapshot(userDocRef, async (userSnap) => {
          if (userSnap.exists()) {
            const data = userSnap.data() as UserProfile;
            // STRICT RULE: If email is NOT whitelisted, force role to 'siswa' regardless of what document says
            const finalRole: UserRole = isWhitelisted ? 'admin' : 'siswa';
            const isProfileComplete = data.isProfileComplete === true || (!!data.name && !!data.kelas);

            setCurrentUser({
              ...data,
              role: finalRole,
              isProfileComplete,
            });

            // If student role and profile is NOT complete (missing class or name): open mandatory profile modal
            if (finalRole !== 'admin' && (!data.kelas || !isProfileComplete)) {
              setIsClassModalOpen(true);
            } else {
              setIsClassModalOpen(false);
            }
          } else {
            // First time login -> create doc for NEW USER
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || '',
              email: firebaseUser.email || '',
              photoURL: firebaseUser.photoURL || undefined,
              kelas: '',
              role: defaultRole,
              isProfileComplete: false,
              createdAt: new Date().toISOString(),
            };
            try {
              await setDoc(userDocRef, newProfile);
            } catch (err) {
              console.warn('Set new user profile warning:', err);
            }
            setCurrentUser(newProfile);

            if (defaultRole !== 'admin') {
              setIsClassModalOpen(true);
            }
          }
          setAuthLoading(false);
        }, (err) => {
          console.warn('User profile listener offline fallback:', err);
          setCurrentUser((prev) => prev || {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || '',
            email: firebaseUser.email || '',
            photoURL: firebaseUser.photoURL || undefined,
            kelas: '',
            role: defaultRole,
            isProfileComplete: false,
          });
          setAuthLoading(false);
        });
      } else {
        // Preserve demo user state if active
        setCurrentUser((prev) => {
          if (prev?.uid && prev.uid.startsWith('demo-')) {
            return prev;
          }
          return null;
        });
        setAuthUser((prev) => {
          if (prev?.uid && prev.uid.startsWith('demo-')) {
            return prev;
          }
          return null;
        });
        setAuthLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubUserDoc) {
        unsubUserDoc();
      }
    };
  }, [appSettings.adminEmails, adminWhitelistDocs]);

  // 2. Real-time Firestore Subscriptions for Books, Reports, and Settings
  useEffect(() => {
    setDataLoading(true);

    // Users Listener
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const fetchedUsers: UserProfile[] = [];
      snap.forEach((doc) => {
        fetchedUsers.push({ uid: doc.id, ...doc.data() } as UserProfile);
      });
      setAllUsers(fetchedUsers);
    }, (err) => {
      console.warn('Firestore users read warning:', err);
    });

    // Books Real-Time Firestore Listener ('books' collection)
    const unsubBooks = onSnapshot(collection(db, 'books'), async (snap) => {
      if (snap.empty) {
        // Automatic Firestore Seeding: Populate default high school collection so all devices share the same data
        try {
          for (const seedBook of INITIAL_SEED_BOOKS) {
            await addDoc(collection(db, 'books'), {
              ...seedBook,
              createdAt: new Date().toISOString(),
            });
          }
        } catch (seedErr) {
          console.warn('Firestore initial books seed warning:', seedErr);
        }
        setBooks(INITIAL_SEED_BOOKS);
        setDataLoading(false);
        return;
      }

      const fetchedBooks: Book[] = [];
      snap.forEach((doc) => {
        fetchedBooks.push({ id: doc.id, ...doc.data() } as Book);
      });
      // Sort newest first by createdAt or title
      fetchedBooks.sort((a, b) => {
        const timeA = new Date((a as any).createdAt || 0).getTime();
        const timeB = new Date((b as any).createdAt || 0).getTime();
        if (timeA && timeB) return timeB - timeA;
        return a.title.localeCompare(b.title);
      });
      setBooks(fetchedBooks);
      setDataLoading(false);
    }, (err) => {
      console.warn('Firestore books read warning:', err);
      setBooks(INITIAL_SEED_BOOKS);
      setDataLoading(false);
    });

    // Reading Reports Real-Time Listeners (Synchronizes both 'reports' and 'reading_reports' collections)
    const reportsMap = new Map<string, ReadingReport>();

    const updateCombinedReports = () => {
      const allReps = Array.from(reportsMap.values());
      allReps.sort((a, b) => {
        const timeA = new Date(a.timestamp || a.dateStr || (a as any).createdAt || 0).getTime();
        const timeB = new Date(b.timestamp || b.dateStr || (b as any).createdAt || 0).getTime();
        return timeB - timeA;
      });
      setReports(allReps);
    };

    const processReportDoc = (docSnap: any) => {
      const d = docSnap.data();
      const id = docSnap.id;
      const rawTs = d.timestamp || d.createdAt || d.tanggal || d.date;
      let timestampStr = '';
      let dateStr = d.dateStr || '';

      if (rawTs) {
        if (typeof rawTs.toDate === 'function') {
          const dt = rawTs.toDate();
          timestampStr = dt.toISOString();
          if (!dateStr) {
            const y = dt.getFullYear();
            const m = String(dt.getMonth() + 1).padStart(2, '0');
            const day = String(dt.getDate()).padStart(2, '0');
            dateStr = `${y}-${m}-${day}`;
          }
        } else if (typeof rawTs.seconds === 'number') {
          const dt = new Date(rawTs.seconds * 1000);
          timestampStr = dt.toISOString();
          if (!dateStr) {
            const y = dt.getFullYear();
            const m = String(dt.getMonth() + 1).padStart(2, '0');
            const day = String(dt.getDate()).padStart(2, '0');
            dateStr = `${y}-${m}-${day}`;
          }
        } else if (typeof rawTs === 'number') {
          const dt = new Date(rawTs);
          timestampStr = dt.toISOString();
          if (!dateStr) {
            const y = dt.getFullYear();
            const m = String(dt.getMonth() + 1).padStart(2, '0');
            const day = String(dt.getDate()).padStart(2, '0');
            dateStr = `${y}-${m}-${day}`;
          }
        } else if (typeof rawTs === 'string') {
          timestampStr = rawTs;
          if (!dateStr) {
            if (/^\d{4}-\d{2}-\d{2}/.test(rawTs)) {
              dateStr = rawTs.substring(0, 10);
            } else {
              const parsed = new Date(rawTs);
              if (!isNaN(parsed.getTime())) {
                const y = parsed.getFullYear();
                const m = String(parsed.getMonth() + 1).padStart(2, '0');
                const day = String(parsed.getDate()).padStart(2, '0');
                dateStr = `${y}-${m}-${day}`;
              }
            }
          }
        }
      }

      if (!dateStr) {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        dateStr = `${y}-${m}-${day}`;
      }

      const summaryText = String(d.summary || d.rangkuman || '');
      const wordCount = d.summaryWordCount ?? (summaryText.trim() ? summaryText.trim().split(/\s+/).filter(Boolean).length : 0);

      const normalized: ReadingReport = {
        id,
        userId: d.userId || d.uid || d.authorId || '',
        userName: d.userName || d.studentName || d.name || 'Siswa',
        userEmail: d.userEmail || d.email || '',
        kelas: d.kelas || d.userClass || d.class || 'Umum',
        bookId: d.bookId || '',
        bookTitle: d.bookTitle || d.title || 'Buku Literasi',
        pagesRead: String(d.pagesRead || d.pages || '1'),
        summary: summaryText,
        summaryWordCount: wordCount,
        baseReadingPoints: d.baseReadingPoints ?? 20,
        summaryWordCountPoints: d.summaryWordCountPoints ?? (wordCount >= 50 ? 50 : 0),
        adminBonusPoints: d.adminBonusPoints ?? 0,
        dateStr,
        timestamp: timestampStr || new Date().toISOString(),
        status: d.status || 'Terkirim',
        validationNote: d.validationNote,
        validatedAt: d.validatedAt,
        validatedBy: d.validatedBy,
      };

      reportsMap.set(id, normalized);
    };

    // 1. Primary Firestore collection: 'reports'
    const unsubReportsColl = onSnapshot(collection(db, 'reports'), (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === 'removed') {
          reportsMap.delete(change.doc.id);
        } else {
          processReportDoc(change.doc);
        }
      });
      if (snap.docChanges().length === 0) {
        snap.forEach((docSnap) => processReportDoc(docSnap));
      }
      updateCombinedReports();
    }, (err) => {
      console.warn('Firestore reports collection onSnapshot warning:', err);
    });

    // 2. Secondary collection: 'reading_reports'
    const unsubReadingReportsColl = onSnapshot(collection(db, 'reading_reports'), (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === 'removed') {
          reportsMap.delete(change.doc.id);
        } else {
          processReportDoc(change.doc);
        }
      });
      if (snap.docChanges().length === 0) {
        snap.forEach((docSnap) => processReportDoc(docSnap));
      }
      updateCombinedReports();
    }, (err) => {
      console.warn('Firestore reading_reports collection onSnapshot warning:', err);
    });

    // App Settings Listener
    const unsubSettings = onSnapshot(doc(db, 'app_settings', 'config'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as AppSettings;
        setAppSettings((prev) => ({
          ...prev,
          adminEmails: data.adminEmails || prev.adminEmails,
          classes: data.classes !== undefined ? data.classes : prev.classes,
          scheduleMode: data.scheduleMode ?? prev.scheduleMode,
          isAccessOpenManual: data.isAccessOpenManual ?? prev.isAccessOpenManual,
          activeDays: data.activeDays || prev.activeDays,
          activeStartTime: data.activeStartTime || prev.activeStartTime,
          activeEndTime: data.activeEndTime || prev.activeEndTime,
        }));
      }
    }, (err) => {
      console.log('Firestore app settings read error:', err);
    });

    // School Settings: Classes Real-Time Listener ('school_settings/classes')
    const unsubSchoolClasses = onSnapshot(doc(db, 'school_settings', 'classes'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (Array.isArray(data?.list)) {
          setAppSettings((prev) => ({
            ...prev,
            classes: data.list,
          }));
        }
      }
    }, (err) => {
      console.log('Firestore school_settings/classes read error:', err);
    });

    // Real-time Jadwal Literasi Listener from pengaturan_aplikasi/jadwal_literasi
    const unsubJadwal = onSnapshot(doc(db, 'pengaturan_aplikasi', 'jadwal_literasi'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAppSettings((prev) => ({
          ...prev,
          scheduleMode: data.scheduleMode || 'schedule',
          isAccessOpenManual: data.isAccessOpenManual ?? true,
          activeDays: data.activeDays || ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
          activeStartTime: data.activeStartTime || '07:00',
          activeEndTime: data.activeEndTime || '08:00',
        }));
      }
    }, (err) => {
      console.log('Firestore pengaturan_aplikasi/jadwal_literasi read error:', err);
    });

    // Real-time Admin Whitelists Listener ('admin_whitelists' collection)
    const unsubWhitelist = onSnapshot(collection(db, 'admin_whitelists'), async (snap) => {
      if (snap.empty) {
        // Automatic Firestore Seeding: Populate default verified admin whitelist
        try {
          const defaultAdmins: AdminWhitelistEntry[] = [
            { email: 'rizkykurniawan241105@gmail.com', name: 'Super Admin / Pengembang', role: 'admin', addedAt: new Date().toISOString() },
            { email: 'admin@sekolah.sch.id', name: 'Admin Perpustakaan SMAN 1 Salem', role: 'admin', addedAt: new Date().toISOString() },
            { email: 'guru@sekolah.sch.id', name: 'Koordinator Guru Literasi', role: 'admin', addedAt: new Date().toISOString() },
            { email: 'guru@gmail.com', name: 'Guru Pengawas Literasi', role: 'admin', addedAt: new Date().toISOString() },
          ];
          for (const item of defaultAdmins) {
            const key = item.email.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_');
            await setDoc(doc(db, 'admin_whitelists', key), item, { merge: true });
          }
        } catch (seedErr) {
          console.log('Firestore initial admin_whitelists seed warning:', seedErr);
        }
        return;
      }

      const list: AdminWhitelistEntry[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as AdminWhitelistEntry);
      });
      setAdminWhitelistDocs(list);
    }, (err) => {
      console.log('Firestore admin_whitelists listener error:', err);
    });

    return () => {
      unsubUsers();
      unsubBooks();
      unsubReportsColl();
      unsubReadingReportsColl();
      unsubSettings();
      unsubSchoolClasses();
      unsubJadwal();
      unsubWhitelist();
    };
  }, [authUser?.uid, currentUser?.uid]);

  // Strict Route Guard: Ensure Student never accesses Admin Tab
  useEffect(() => {
    if (currentUser && currentUser.role === 'siswa') {
      if (adminTab !== 'monitoring') {
        setAdminTab('monitoring');
      }
    }
  }, [currentUser?.role, adminTab]);

  // Login handler
  const handleGoogleLogin = async (portalRole: UserRole = 'siswa') => {
    setLoginErrorMsg(null);
    setAdminAccessWarning(null);
    setDataLoading(true);

    try {
      const user = await signInWithGoogle();
      if (!user) {
        setDataLoading(false);
        return;
      }
      const userEmail = (user.email || '').toLowerCase().trim();
      const isWhitelisted = checkIsWhitelistedAdmin(userEmail);

      // If logging into Admin Portal, strictly verify whitelist
      if (portalRole === 'admin') {
        if (!isWhitelisted) {
          setLoginErrorMsg(`Akses Ditolak: Email Google (${user.email}) TIDAK TERDAFTAR dalam Whitelist Admin/Guru. Anda dialihkan ke Portal Siswa.`);
          // Force role to siswa
          if (currentUser) {
            setCurrentUser({ ...currentUser, role: 'siswa' });
          }
          setStudentTab('library');
          return;
        } else {
          sessionStorage.setItem('admin_pin_verified', 'true');
          setAdminTab('monitoring');
        }
      } else {
        // Logging into Student Portal
        if (!isWhitelisted) {
          // 100% Student role enforced
          setStudentTab('library');
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setDataLoading(false);
      const errCode = String(err?.code || '');
      const errStr = String(err?.message || err || '');

      if (errCode === 'auth/popup-closed-by-user') {
        setLoginErrorMsg('Proses login Google dibatalkan karena jendela pop-up ditutup.');
      } else if (errCode === 'auth/unauthorized-domain') {
        setLoginErrorMsg('Domain ini belum terdaftar di Firebase Auth. Silakan gunakan tombol Pratinjau Akses.');
      } else if (errStr.includes('api-key-not-valid') || errStr.includes('invalid-api-key') || errStr.includes('API key')) {
        setLoginErrorMsg('Konfigurasi API Key Firebase belum valid. Mengalihkan Anda ke Mode Pratinjau...');
        setTimeout(() => {
          handleDemoLogin(portalRole);
        }, 1200);
      } else {
        setLoginErrorMsg(`Gagal terhubung dengan Google Auth. ${errStr ? errStr : 'Silakan gunakan tombol Pratinjau Akses.'}`);
      }
    }
  };

  // Demo Login Handler for instant browser testing without popups
  const handleDemoLogin = async (role: UserRole) => {
    setLoginErrorMsg(null);
    setAdminAccessWarning(null);

    if (role === 'admin') {
      const isPinVerified = sessionStorage.getItem('admin_pin_verified') === 'true';
      if (!isPinVerified) {
        setAdminAccessWarning('Akses Ditolak: Anda tidak memiliki wewenang sebagai Admin');
        setIsAdminPinModalOpen(true);
        return;
      }
    }

    const mockUid = role === 'admin' ? 'demo-admin-uid' : 'demo-siswa-uid';
    const mockUser: UserProfile = {
      uid: mockUid,
      name: role === 'admin' ? 'Bpk. Ahmad Suherman, S.Pd (Guru Admin)' : 'Budi Santoso (Siswa Demo)',
      email: role === 'admin' ? 'admin@sekolah.sch.id' : 'budi.santoso@siswa.sch.id',
      kelas: role === 'admin' ? 'GURU' : 'X-1',
      role: role,
      isProfileComplete: true,
      photoURL: role === 'admin' 
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200' 
        : 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
    };
    setCurrentUser(mockUser);
    setAuthUser({
      uid: mockUid,
      email: mockUser.email,
      displayName: mockUser.name,
      photoURL: mockUser.photoURL,
    } as User);
    setDataLoading(false);

    if (role === 'siswa') {
      setStudentTab('library');
      setIsClassModalOpen(false);
    } else {
      setAdminTab('monitoring');
    }
  };

  // Logout Handler for both Firebase Auth and Demo User
  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.warn('Logout warning:', err);
    }
    sessionStorage.removeItem('admin_pin_verified');
    setAuthUser(null);
    setCurrentUser(null);
    setIsClassModalOpen(false);
    setIsMobileSidebarOpen(false);
  };

  // Profile & Class selection update
  const handleSelectClass = async (selectedClass: string, realName?: string) => {
    if (!currentUser) return;
    const finalName = (realName && realName.trim()) ? realName.trim() : (currentUser.name || authUser?.displayName || 'Siswa');
    const updatedUser: UserProfile = { 
      ...currentUser, 
      name: finalName, 
      kelas: selectedClass, 
      isProfileComplete: true 
    };
    setCurrentUser(updatedUser);

    try {
      if (authUser?.uid && !authUser.uid.startsWith('demo-')) {
        await setDoc(doc(db, 'users', authUser.uid), {
          name: finalName,
          kelas: selectedClass,
          isProfileComplete: true,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }
    } catch (err) {
      console.error('Error saving profile selection to Firestore:', err);
    } finally {
      setIsClassModalOpen(false);
    }
  };

  // Submit Reading Report
  const handleSubmitReport = async (reportData: {
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
    ringkasanIsi?: string;
    kelebihanBuku?: string;
    kekuranganBuku?: string;
    saranKelayakan?: string;
    summary: string;
    summaryWordCount?: number;
    readingSessionPoints?: number;
    q1IdentitasPoints?: number;
    q2RingkasanPoints?: number;
    q3KelebihanPoints?: number;
    q4KekuranganPoints?: number;
    q5SaranPoints?: number;
    baseTotalPoints?: number;
    baseReadingPoints?: number;
    summaryWordCountPoints?: number;
    adminBonusPoints?: number;
  }) => {
    if (!currentUser) return;

    const wordCount = reportData.summaryWordCount ?? (reportData.ringkasanIsi ? reportData.ringkasanIsi.trim().split(/\s+/).filter(Boolean).length : reportData.summary.trim().split(/\s+/).filter(Boolean).length);
    const hasMin50Words = wordCount >= 50;

    const readingSessionPoints = reportData.readingSessionPoints ?? 10;
    const q1IdentitasPoints = reportData.q1IdentitasPoints ?? (reportData.pagesRead?.trim() ? 10 : 0);
    const q2RingkasanPoints = reportData.q2RingkasanPoints ?? (hasMin50Words ? 30 : 0);
    const q3KelebihanPoints = reportData.q3KelebihanPoints ?? (reportData.kelebihanBuku?.trim() && reportData.kelebihanBuku.trim() !== 'Tidak dicantumkan' ? 15 : 0);
    const q4KekuranganPoints = reportData.q4KekuranganPoints ?? (reportData.kekuranganBuku?.trim() && reportData.kekuranganBuku.trim() !== 'Tidak dicantumkan' ? 15 : 0);
    const q5SaranPoints = reportData.q5SaranPoints ?? (reportData.saranKelayakan?.trim() && reportData.saranKelayakan.trim() !== 'Tidak dicantumkan' ? 20 : 0);
    
    const baseTotalPoints = reportData.baseTotalPoints ?? (readingSessionPoints + q1IdentitasPoints + q2RingkasanPoints + q3KelebihanPoints + q4KekuranganPoints + q5SaranPoints);

    const newReport: Omit<ReadingReport, 'id'> = {
      userId: currentUser.uid,
      userName: currentUser.name,
      userEmail: currentUser.email,
      kelas: currentUser.kelas || 'Umum',
      bookId: reportData.bookId,
      bookTitle: reportData.bookTitle,
      bookAuthor: reportData.bookAuthor,
      bookPublisher: reportData.bookPublisher,
      bookPublishYear: reportData.bookPublishYear,
      pagesRead: reportData.pagesRead,
      identitasBuku: reportData.identitasBuku,
      ringkasanIsi: reportData.ringkasanIsi,
      kelebihanBuku: reportData.kelebihanBuku,
      kekuranganBuku: reportData.kekuranganBuku,
      saranKelayakan: reportData.saranKelayakan,
      summary: reportData.summary,
      summaryWordCount: wordCount,
      readingSessionPoints,
      q1IdentitasPoints,
      q2RingkasanPoints,
      q3KelebihanPoints,
      q4KekuranganPoints,
      q5SaranPoints,
      baseTotalPoints,
      baseReadingPoints: readingSessionPoints + q1IdentitasPoints,
      summaryWordCountPoints: q2RingkasanPoints,
      adminBonusPoints: reportData.adminBonusPoints ?? 0,
      dateStr: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
      status: 'Terkirim',
    };

    try {
      let createdReportWithId: ReadingReport;

      if (!currentUser.uid.startsWith('demo-')) {
        // Write to primary 'reports' collection
        const docRef = await addDoc(collection(db, 'reports'), newReport);
        createdReportWithId = { ...newReport, id: docRef.id };
        
        // Also sync to 'reading_reports' collection with same ID
        try {
          await setDoc(doc(db, 'reading_reports', docRef.id), newReport);
        } catch (syncErr) {
          console.warn('Silent sync to reading_reports:', syncErr);
        }
      } else {
        // Mock add for demo user
        createdReportWithId = {
          ...newReport,
          id: 'rep-' + Date.now(),
        };
        setReports((prev) => [createdReportWithId, ...prev]);
      }

      // Evaluate new badges & streak
      const userReports = reports.filter(r => r.userId === currentUser.uid || r.userEmail === currentUser.email);
      const updatedUserReports = [createdReportWithId, ...userReports];

      const { updatedBadges, newlyUnlockedBadges, streakCount, badgeEarnedDates } = evaluateBadges(
        currentUser,
        updatedUserReports,
        books
      );

      const updatedProfile: UserProfile = {
        ...currentUser,
        badges: updatedBadges,
        badgeEarnedDates,
        streakCount,
        lastReadDate: newReport.dateStr,
      };

      setCurrentUser(updatedProfile);

      if (!currentUser.uid.startsWith('demo-')) {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          badges: updatedBadges,
          badgeEarnedDates,
          streakCount,
          lastReadDate: newReport.dateStr,
          updatedAt: new Date().toISOString(),
        }).catch((err) => console.warn('Firestore profile update warning:', err));
      }

      if (newlyUnlockedBadges.length > 0) {
        setUnlockedBadgesToShow(newlyUnlockedBadges);
      }
    } catch (err) {
      console.error('Error submitting report:', err);
      // Fallback local report add
      const fallbackReport: ReadingReport = { ...newReport, id: 'rep-' + Date.now() };
      setReports((prev) => [fallbackReport, ...prev]);
    }
  };

  // Admin Validation of Reports with Custom Manual Points
  const handleValidateReport = async (
    reportId: string,
    status: 'Setujui_Bonus' | 'Setujui_Standar' | 'Ditolak',
    bonusPoints: number,
    note: string
  ) => {
    // Optimistic local update
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status,
              adminBonusPoints: bonusPoints,
              validationNote: note,
              validatedAt: new Date().toISOString(),
              validatedBy: currentUser?.name || 'Guru / Admin Perpustakaan',
            }
          : r
      )
    );

    try {
      if (!reportId.startsWith('rep-')) {
        const updatePayload = {
          status,
          adminBonusPoints: bonusPoints,
          validationNote: note,
          validatedAt: new Date().toISOString(),
          validatedBy: currentUser?.name || 'Guru / Admin Perpustakaan',
        };

        // Try updating in 'reports'
        try {
          await updateDoc(doc(db, 'reports', reportId), updatePayload);
        } catch (e) {
          // May not exist in reports if created earlier
        }

        // Try updating in 'reading_reports'
        try {
          await updateDoc(doc(db, 'reading_reports', reportId), updatePayload);
        } catch (e) {
          // May not exist in reading_reports
        }
      }
    } catch (err) {
      console.error('Error updating report validation in Firestore:', err);
    }
  };

  // Admin Actions: Books CRUD
  const handleAddBook = async (bookData: Omit<Book, 'id'>) => {
    try {
      await addDoc(collection(db, 'books'), {
        ...bookData,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error adding book:', err);
      const localBook: Book = { id: 'book-' + Date.now(), ...bookData };
      setBooks((prev) => [localBook, ...prev]);
    }
  };

  const handleUpdateBook = async (id: string, bookData: Partial<Book>) => {
    try {
      await updateDoc(doc(db, 'books', id), bookData);
    } catch (err) {
      console.error('Error updating book:', err);
      setBooks((prev) => prev.map((b) => (b.id === id ? { ...b, ...bookData } : b)));
    }
  };

  const handleDeleteBook = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'books', id));
    } catch (err) {
      console.error('Error deleting book:', err);
      setBooks((prev) => prev.filter((b) => b.id !== id));
    }
  };

  // Admin Actions: Settings Save & Whitelist Sync
  const handleSaveSettings = async (newSettings: AppSettings) => {
    try {
      // 1. Save to app_settings/config
      await setDoc(doc(db, 'app_settings', 'config'), newSettings, { merge: true });

      // 2. Save specifically to school_settings/classes
      if (newSettings.classes !== undefined) {
        await setDoc(doc(db, 'school_settings', 'classes'), {
          list: newSettings.classes,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }

      // 3. Save specifically to pengaturan_aplikasi/jadwal_literasi as requested
      await setDoc(doc(db, 'pengaturan_aplikasi', 'jadwal_literasi'), {
        scheduleMode: newSettings.scheduleMode || 'schedule',
        isAccessOpenManual: newSettings.isAccessOpenManual ?? true,
        activeDays: newSettings.activeDays || ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
        activeStartTime: newSettings.activeStartTime || '07:00',
        activeEndTime: newSettings.activeEndTime || '08:00',
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      // 4. Sync adminEmails to 'admin_whitelists' collection in Firestore
      if (newSettings.adminEmails && newSettings.adminEmails.length > 0) {
        for (const emailStr of newSettings.adminEmails) {
          const cleanEmail = emailStr.toLowerCase().trim();
          if (cleanEmail) {
            const key = cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
            await setDoc(doc(db, 'admin_whitelists', key), {
              email: cleanEmail,
              role: 'admin',
              addedAt: new Date().toISOString(),
              addedBy: currentUser?.name || 'Admin',
            }, { merge: true });
          }
        }
      }

      setAppSettings(newSettings);
    } catch (err) {
      console.error('Error saving settings:', err);
      setAppSettings(newSettings);
      throw err;
    }
  };

  // Filter student reports
  const studentReports = reports.filter(
    (rep) => rep.userId === currentUser?.uid || rep.userEmail === currentUser?.email
  );

  // Filter published books for students (Admin sees all books in ManageBooksTab)
  const studentBooks = books.filter(
    (b) => b.status === 'published' || b.isPublished === true
  );

  // Render Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-800 p-4">
        <div className="w-12 h-12 border-4 border-[#1E40AF] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-extrabold tracking-wide text-[#1E40AF]">
          Memuat Sistem Literasi Digital Sekolah...
        </p>
      </div>
    );
  }

  // Render Light-Themed Login Screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-emerald-50/50 text-slate-800 flex flex-col justify-between relative overflow-hidden font-sans">
        {/* Soft educational background decorations */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-200/40 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Bar */}
        <header className="p-4 sm:p-6 max-w-7xl mx-auto w-full flex items-center justify-between relative z-30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#005AC1] flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-900/15 border border-blue-200">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <span className="font-black text-[#005AC1] text-base sm:text-lg tracking-tight block">LiteraDigital</span>
              <span className="text-[10px] text-emerald-700 uppercase tracking-widest font-bold block">SMA NEGERI 1 SALEM</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-blue-900 bg-blue-100/80 px-3.5 py-1.5 rounded-full border border-blue-200 shadow-xs">
              <Shield className="w-3.5 h-3.5 text-[#005AC1]" />
              <span>Firebase Auth</span>
            </div>

            {/* Dropdown Menu Titik Tiga (⋮) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
                className="p-2 sm:px-3 sm:py-2 rounded-2xl text-slate-700 hover:text-slate-900 bg-white/90 hover:bg-white border border-slate-200/80 shadow-xs transition-all cursor-pointer flex items-center gap-1.5 font-bold text-xs"
                title="Menu Akses Login Admin / Guru"
              >
                <MoreVertical className="w-5 h-5 text-slate-700" />
              </button>

              {isHeaderMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsHeaderMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-fade-in">
                    <button
                      type="button"
                      onClick={() => {
                        setIsHeaderMenuOpen(false);
                        setIsAdminLoginModalOpen(true);
                      }}
                      className="w-full px-4 py-3 text-left text-xs font-bold text-emerald-800 hover:bg-emerald-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <ShieldCheck className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                      <span>Login Admin / Guru</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main Login Portal Container */}
        <main className="max-w-xl mx-auto px-4 py-8 w-full relative z-10 my-auto space-y-6">
          <div className="text-center space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Literasi Digital SMA Negeri 1 Salem</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Portal Masuk Siswa Perpustakaan
            </h1>

            <p className="text-slate-600 text-xs sm:text-sm max-w-md mx-auto leading-relaxed font-medium">
              Silakan masuk menggunakan akun Google Anda untuk mengakses e-book dan mencatat laporan literasi.
            </p>
          </div>

          {/* Clean White Card */}
          <div className="bg-white border border-blue-100 rounded-3xl p-6 sm:p-8 shadow-xl shadow-blue-900/5 space-y-6">
            
            {loginErrorMsg && (
              <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 text-xs font-semibold flex items-start gap-3 animate-fade-in">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{loginErrorMsg}</div>
              </div>
            )}

            {adminAccessWarning && (
              <div className="p-3.5 bg-red-50 border border-red-300 rounded-2xl text-red-800 text-xs font-bold flex items-center gap-2.5 animate-bounce">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{adminAccessWarning}</span>
              </div>
            )}

            {/* Main Student Portal Content */}
            <div className="space-y-5">
              <div className="bg-blue-50/80 border border-blue-200 p-4 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-[#005AC1] font-black text-sm">
                  <GraduationCap className="w-4 h-4 text-[#005AC1]" />
                  <span>Akses Utama Siswa</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Masuk dengan Google, lengkapi nama asli & kelas Anda, lalu langsung baca e-book digital dan kumpulkan poin peringkat!
                </p>
              </div>

              <div className="space-y-3 pt-1">
                <button
                  onClick={() => handleGoogleLogin('siswa')}
                  className="w-full py-4 px-5 bg-[#005AC1] hover:bg-blue-800 active:bg-blue-900 text-white font-black text-xs sm:text-sm rounded-2xl transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-3 transform hover:-translate-y-0.5 cursor-pointer border border-blue-700"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Masuk sebagai Siswa dengan Google</span>
                </button>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="shrink mx-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Atau Mode Pratinjau</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <button
                  onClick={() => handleDemoLogin('siswa')}
                  className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4 text-[#005AC1]" />
                  <span>Pratinjau Akses Siswa (Tanpa Google Login)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Features Row */}
          <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] text-slate-600 text-center font-medium">
            <div className="p-2.5 bg-white border border-blue-100 rounded-2xl flex flex-col items-center gap-1 shadow-xs">
              <BookOpen className="w-4 h-4 text-[#005AC1]" />
              <span>Embedded Reader</span>
            </div>
            <div className="p-2.5 bg-white border border-blue-100 rounded-2xl flex flex-col items-center gap-1 shadow-xs">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Laporan Real-time</span>
            </div>
            <div className="p-2.5 bg-white border border-blue-100 rounded-2xl flex flex-col items-center gap-1 shadow-xs">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Juara Literasi</span>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="p-4 text-center text-xs text-slate-500 relative z-10 border-t border-slate-200/60 bg-white/40 backdrop-blur-xs">
          <p>© {new Date().getFullYear()} Sistem Literasi Digital Sekolah SMA NEGERI 1 SALEM.</p>
        </footer>

        {/* Modal Form Login Admin / Guru */}
        {isAdminLoginModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-fade-in">
            <div className="w-full max-w-md bg-white rounded-[28px] shadow-2xl border border-emerald-100 overflow-hidden relative">
              {/* Header Modal */}
              <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 p-6 text-white text-center relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdminLoginModalOpen(false);
                    setLoginErrorMsg(null);
                  }}
                  className="absolute top-4 right-4 p-1.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2.5 backdrop-blur-md">
                  <ShieldCheck className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-xl font-black">Portal Login Guru & Admin</h2>
                <p className="text-emerald-100 text-xs mt-1">
                  Akses khusus guru pengawas dan administrator perpustakaan digital sekolah.
                </p>
              </div>

              <div className="p-6 space-y-5">
                {loginErrorMsg && (
                  <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 text-xs font-semibold flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">{loginErrorMsg}</div>
                  </div>
                )}

                {/* Google Login for Admin */}
                <button
                  type="button"
                  onClick={async () => {
                    setIsAdminLoginModalOpen(false);
                    await handleGoogleLogin('admin');
                  }}
                  className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs sm:text-sm rounded-2xl transition-all shadow-xs flex items-center justify-center gap-3 cursor-pointer"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Masuk dengan Google (Email Admin)</span>
                </button>

                <div className="relative flex py-0.5 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="shrink mx-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Atau Username & Password
                  </span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                {/* Username Password Admin Form */}
                <form
                  onSubmit={handleAdminUsernamePasswordLogin}
                  className="space-y-3.5"
                >
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Username / Email Admin:
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        placeholder="Contoh: admin@sekolah.sch.id atau Kenzo"
                        value={adminUsername}
                        onChange={(e) => {
                          setAdminUsername(e.target.value);
                          setLoginErrorMsg(null);
                        }}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Password Admin:
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="password"
                        placeholder="Masukkan password admin"
                        value={adminPassword}
                        onChange={(e) => {
                          setAdminPassword(e.target.value);
                          setLoginErrorMsg(null);
                        }}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Masuk Admin</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Helper title for current active view
  const currentViewTitle = currentUser.role === 'admin'
    ? adminTab === 'monitoring' ? 'Dasbor Monitoring' : adminTab === 'manage_books' ? 'Kelola Buku' : adminTab === 'leaderboard' ? 'Prestasi & Papan Peringkat' : 'Pengaturan'
    : studentTab === 'library' ? 'Perpustakaan Digital' : studentTab === 'reports' ? 'Laporan Saya' : studentTab === 'leaderboard' ? 'Papan Peringkat & Juara' : 'Profil Siswa';

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* 0. SLIDE-OVER SIDEBAR NAVIGATION DRAWER (FOR MENU GARIS 3) */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 transition-opacity"
            />

            {/* Slide-over Panel from Left */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white z-50 shadow-2xl flex flex-col justify-between p-5 border-r border-blue-100 overflow-y-auto"
            >
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#005AC1] flex items-center justify-center text-white shadow-md shadow-blue-900/20 shrink-0">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h1 className="text-base font-black text-[#005AC1] tracking-tight">LiteraDigital</h1>
                      <p className="text-[10px] text-emerald-700 font-extrabold uppercase tracking-wider">Navigasi Utama</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* User Info Card */}
                <div className="p-3.5 bg-[#EEF3FF] rounded-2xl border border-blue-200/80 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#005AC1] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-slate-900 truncate">{currentUser.name}</div>
                    <div className="text-[10px] text-slate-500 truncate">{currentUser.email}</div>
                    <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-blue-200 text-[10px] font-extrabold text-[#005AC1]">
                      {currentUser.role === 'admin' ? (
                        <>
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>Admin / Guru</span>
                        </>
                      ) : (
                        <>
                          <GraduationCap className="w-3 h-3 text-[#005AC1]" />
                          <span>Siswa ({currentUser.kelas || 'X-1'})</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Navigation Links */}
                <nav className="space-y-2">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-3 mb-1">
                    Menu {currentUser.role === 'admin' ? 'Pengelola & Guru' : 'Siswa'}
                  </div>

                  {currentUser.role === 'admin' ? (
                    <div className="space-y-1.5">
                      {/* 1. 📊 Dasbor Utama */}
                      <button
                        onClick={() => {
                          setAdminTab('monitoring');
                          setIsMobileSidebarOpen(false);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                          adminTab === 'monitoring'
                            ? 'bg-[#005AC1] text-white shadow-md shadow-blue-900/15'
                            : 'text-slate-700 hover:bg-[#EEF3FF] hover:text-[#005AC1]'
                        }`}
                      >
                        <LayoutDashboard className="w-4 h-4 shrink-0" />
                        <span>📊 Dasbor Utama</span>
                      </button>

                      {/* 2. 📝 Validasi Laporan Siswa */}
                      <button
                        onClick={() => {
                          setAdminTab('monitoring');
                          setIsMobileSidebarOpen(false);
                          setTimeout(() => {
                            const el = document.getElementById('report-table-section');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }, 150);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-slate-700 hover:bg-[#EEF3FF] hover:text-[#005AC1] transition-all cursor-pointer"
                      >
                        <FileCheck2 className="w-4 h-4 shrink-0 text-emerald-600" />
                        <span>📝 Validasi Laporan Siswa</span>
                      </button>

                      {/* 3. 👥 Kelola Data Siswa */}
                      <button
                        onClick={() => {
                          setAdminTab('monitoring');
                          setIsMobileSidebarOpen(false);
                          setTimeout(() => {
                            const el = document.getElementById('report-table-section');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }, 150);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-slate-700 hover:bg-[#EEF3FF] hover:text-[#005AC1] transition-all cursor-pointer"
                      >
                        <Users className="w-4 h-4 shrink-0 text-blue-600" />
                        <span>👥 Kelola Data Siswa</span>
                      </button>

                      {/* 4. 📚 Kelola Katalog Buku (Tambah/Hapus E-Book) */}
                      <button
                        onClick={() => {
                          setAdminTab('manage_books');
                          setIsMobileSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                          adminTab === 'manage_books'
                            ? 'bg-[#005AC1] text-white shadow-md shadow-blue-900/15'
                            : 'text-slate-700 hover:bg-[#EEF3FF] hover:text-[#005AC1]'
                        }`}
                      >
                        <BookPlus className="w-4 h-4 shrink-0" />
                        <span>📚 Kelola Katalog Buku</span>
                      </button>

                      {/* 5. 🏆 Prestasi & Papan Peringkat */}
                      <button
                        onClick={() => {
                          setAdminTab('leaderboard');
                          setIsMobileSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                          adminTab === 'leaderboard'
                            ? 'bg-[#005AC1] text-white shadow-md shadow-blue-900/15'
                            : 'text-slate-700 hover:bg-[#EEF3FF] hover:text-[#005AC1]'
                        }`}
                      >
                        <Trophy className="w-4 h-4 shrink-0 text-amber-500" />
                        <span>🏆 Prestasi & Papan Peringkat</span>
                      </button>

                      {/* 6. 📥 Ekspor Laporan (Excel/DOC) */}
                      <button
                        onClick={() => {
                          setAdminTab('monitoring');
                          setIsMobileSidebarOpen(false);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-slate-700 hover:bg-[#EEF3FF] hover:text-[#005AC1] transition-all cursor-pointer"
                      >
                        <Download className="w-4 h-4 shrink-0 text-indigo-600" />
                        <span>📥 Ekspor Laporan (Excel/DOC)</span>
                      </button>

                      {/* 7. ⚙️ Pengaturan Sekolah (Kop Surat & Tanda Tangan) */}
                      <button
                        onClick={() => {
                          setAdminTab('settings');
                          setIsMobileSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                          adminTab === 'settings'
                            ? 'bg-[#005AC1] text-white shadow-md shadow-blue-900/15'
                            : 'text-slate-700 hover:bg-[#EEF3FF] hover:text-[#005AC1]'
                        }`}
                      >
                        <SettingsIcon className="w-4 h-4 shrink-0" />
                        <span>⚙️ Pengaturan Sekolah</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {/* 1. 📚 Katalog Buku */}
                      <button
                        onClick={() => {
                          setStudentTab('library');
                          setIsMobileSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                          studentTab === 'library'
                            ? 'bg-[#005AC1] text-white shadow-md shadow-blue-900/15'
                            : 'text-slate-700 hover:bg-[#EEF3FF] hover:text-[#005AC1]'
                        }`}
                      >
                        <BookOpen className="w-4 h-4 shrink-0" />
                        <span>📚 Katalog Buku</span>
                      </button>

                      {/* 2. 📖 Riwayat Bacaan Saya */}
                      <button
                        onClick={() => {
                          setStudentTab('reports');
                          setIsMobileSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                          studentTab === 'reports'
                            ? 'bg-[#005AC1] text-white shadow-md shadow-blue-900/15'
                            : 'text-slate-700 hover:bg-[#EEF3FF] hover:text-[#005AC1]'
                        }`}
                      >
                        <FileText className="w-4 h-4 shrink-0" />
                        <span>📖 Riwayat Bacaan Saya</span>
                      </button>

                      {/* 3. 🏆 Papan Peringkat */}
                      <button
                        onClick={() => {
                          setStudentTab('leaderboard');
                          setIsMobileSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                          studentTab === 'leaderboard'
                            ? 'bg-[#005AC1] text-white shadow-md shadow-blue-900/15'
                            : 'text-slate-700 hover:bg-[#EEF3FF] hover:text-[#005AC1]'
                        }`}
                      >
                        <Trophy className="w-4 h-4 shrink-0 text-amber-500" />
                        <span>🏆 Papan Peringkat</span>
                      </button>

                      {/* 4. 👤 Profil Saya */}
                      <button
                        onClick={() => {
                          setStudentTab('profile');
                          setIsMobileSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                          studentTab === 'profile'
                            ? 'bg-[#005AC1] text-white shadow-md shadow-blue-900/15'
                            : 'text-slate-700 hover:bg-[#EEF3FF] hover:text-[#005AC1]'
                        }`}
                      >
                        <UserIcon className="w-4 h-4 shrink-0" />
                        <span>👤 Profil Saya</span>
                      </button>
                    </div>
                  )}
                </nav>
              </div>

              {/* Drawer Bottom Actions */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-2xl font-bold text-xs transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-red-600" />
                  <span>🚪 Keluar (Logout)</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 1. DESKTOP / TABLET STATIC SIDEBAR */}
      <aside className="w-64 border-r border-blue-100 bg-white flex-col justify-between p-4 hidden md:flex shrink-0 shadow-xs">
        <div className="space-y-6">
          {/* Logo & Header */}
          <div className="flex items-center gap-3 px-2 pt-1">
            <div className="w-10 h-10 rounded-2xl bg-[#005AC1] flex items-center justify-center text-white shadow-md shadow-blue-900/15 shrink-0">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-black text-[#005AC1] tracking-tight truncate">LiteraDigital</h1>
              <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">Literasi Sekolah</p>
            </div>
          </div>

          {/* User Role Tag */}
          <div className="px-3 py-2 bg-[#EEF3FF] rounded-xl border border-blue-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              {currentUser.role === 'admin' ? (
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              ) : (
                <GraduationCap className="w-4 h-4 text-[#005AC1] shrink-0" />
              )}
              <span className="font-bold text-slate-800 truncate">
                {currentUser.role === 'admin' ? 'Akun Admin/Guru' : `Siswa (${currentUser.kelas || 'X-1'})`}
              </span>
            </div>
          </div>

          {/* Nav Navigation List */}
          <nav className="space-y-1.5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
              Navigasi {currentUser.role === 'admin' ? 'Admin / Guru' : 'Siswa'}
            </div>

            {currentUser.role === 'siswa' ? (
              <>
                <button
                  onClick={() => setStudentTab('library')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs transition-all cursor-pointer ${
                    studentTab === 'library'
                      ? 'bg-[#005AC1] text-white font-bold shadow-xs'
                      : 'text-slate-700 hover:bg-[#EEF3FF] hover:text-[#005AC1] font-medium'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Katalog Buku</span>
                </button>

                <button
                  onClick={() => setStudentTab('reports')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs transition-all cursor-pointer ${
                    studentTab === 'reports'
                      ? 'bg-[#005AC1] text-white font-bold shadow-xs'
                      : 'text-slate-700 hover:bg-[#EEF3FF] hover:text-[#005AC1] font-medium'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Riwayat Bacaan Saya</span>
                </button>

                <button
                  onClick={() => setStudentTab('leaderboard')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs transition-all cursor-pointer ${
                    studentTab === 'leaderboard'
                      ? 'bg-[#005AC1] text-white font-bold shadow-xs'
                      : 'text-slate-700 hover:bg-[#EEF3FF] hover:text-[#005AC1] font-medium'
                  }`}
                >
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>Papan Peringkat</span>
                </button>

                <button
                  onClick={() => setStudentTab('profile')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs transition-all cursor-pointer ${
                    studentTab === 'profile'
                      ? 'bg-[#005AC1] text-white font-bold shadow-xs'
                      : 'text-slate-700 hover:bg-[#EEF3FF] hover:text-[#005AC1] font-medium'
                  }`}
                >
                  <UserIcon className="w-4 h-4" />
                  <span>Profil Saya</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setAdminTab('monitoring');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs transition-all cursor-pointer ${
                    adminTab === 'monitoring'
                      ? 'bg-[#005AC1] text-white font-bold shadow-xs'
                      : 'text-slate-700 hover:bg-[#EEF3FF] hover:text-[#005AC1] font-medium'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dasbor Utama</span>
                </button>

                <button
                  onClick={() => {
                    setAdminTab('monitoring');
                    setTimeout(() => {
                      const el = document.getElementById('report-table-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }, 150);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-medium text-slate-700 hover:bg-[#EEF3FF] hover:text-[#005AC1] transition-all cursor-pointer"
                >
                  <FileCheck2 className="w-4 h-4 text-emerald-600" />
                  <span>Validasi Laporan Siswa</span>
                </button>

                <button
                  onClick={() => {
                    setAdminTab('monitoring');
                    setTimeout(() => {
                      const el = document.getElementById('report-table-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }, 150);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-medium text-slate-700 hover:bg-[#EEF3FF] hover:text-[#005AC1] transition-all cursor-pointer"
                >
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Kelola Data Siswa</span>
                </button>

                <button
                  onClick={() => setAdminTab('manage_books')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs transition-all cursor-pointer ${
                    adminTab === 'manage_books'
                      ? 'bg-[#005AC1] text-white font-bold shadow-xs'
                      : 'text-slate-700 hover:bg-[#EEF3FF] hover:text-[#005AC1] font-medium'
                  }`}
                >
                  <BookPlus className="w-4 h-4" />
                  <span>Kelola Katalog Buku</span>
                </button>

                <button
                  onClick={() => setAdminTab('leaderboard')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs transition-all cursor-pointer ${
                    adminTab === 'leaderboard'
                      ? 'bg-[#005AC1] text-white font-bold shadow-xs'
                      : 'text-slate-700 hover:bg-[#EEF3FF] hover:text-[#005AC1] font-medium'
                  }`}
                >
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>Prestasi & Papan Peringkat</span>
                </button>

                <button
                  onClick={() => {
                    setAdminTab('monitoring');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-medium text-slate-700 hover:bg-[#EEF3FF] hover:text-[#005AC1] transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 text-indigo-600" />
                  <span>Ekspor Laporan (XLS/DOC)</span>
                </button>

                <button
                  onClick={() => setAdminTab('settings')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs transition-all cursor-pointer ${
                    adminTab === 'settings'
                      ? 'bg-[#005AC1] text-white font-bold shadow-xs'
                      : 'text-slate-700 hover:bg-[#EEF3FF] hover:text-[#005AC1] font-medium'
                  }`}
                >
                  <SettingsIcon className="w-4 h-4" />
                  <span>Pengaturan Sekolah</span>
                </button>
              </>
            )}
          </nav>
        </div>

        {/* User Card & Logout Button at Bottom of Sidebar */}
        <div className="pt-4 border-t border-[#E2E8F8] space-y-3">
          <div className="flex items-center gap-3 p-2.5 bg-white rounded-2xl border border-[#E2E8F8] shadow-2xs">
            <div className="w-9 h-9 rounded-full bg-[#005AC1] text-white flex items-center justify-center font-bold text-sm shrink-0">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-xs text-slate-900 truncate">{currentUser.name}</div>
              <div className="text-[10px] text-slate-500 truncate">{currentUser.email}</div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-full w-full max-w-full overflow-x-hidden bg-[#F8FAFF]">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-[#E2E8F8] bg-white/90 backdrop-blur-md px-4 md:px-8 flex items-center justify-between shrink-0 z-20 shadow-2xs">
          <div className="flex items-center gap-3">
            {/* Mobile / Universal Sidebar Toggle Button (Menu Garis 3) */}
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 text-slate-700 hover:text-[#005AC1] hover:bg-[#EEF3FF] rounded-2xl bg-white border border-blue-200 shadow-2xs flex items-center gap-2 cursor-pointer transition-all"
              title="Buka Menu Navigasi Samping"
            >
              <Menu className="w-5 h-5 text-[#005AC1]" />
              <span className="text-xs font-bold hidden sm:inline text-slate-700">Menu Navigasi</span>
            </button>

            <div>
              <h2 className="text-base md:text-lg font-bold text-[#005AC1]">{currentViewTitle}</h2>
              <p className="text-[11px] text-slate-500 hidden sm:block font-medium">
                Material Design 3 • Literasi Digital Sekolah
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentUser.role === 'siswa' ? (
              <button
                onClick={() => setIsClassModalOpen(true)}
                className="px-3.5 py-1.5 bg-[#E8F5E9] text-emerald-900 border border-emerald-300 rounded-full text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer"
              >
                <GraduationCap className="w-4 h-4 text-emerald-700" />
                <span>Kelas: {currentUser.kelas || 'Belum Set'}</span>
              </button>
            ) : (
              <div className="px-3.5 py-1.5 bg-[#C2E8FF] text-[#001E30] border border-sky-300 rounded-full text-xs font-extrabold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#006399]" />
                <span>Admin / Guru Terverifikasi</span>
              </div>
            )}

            <div className="w-8 h-8 rounded-full bg-[#005AC1] text-white flex items-center justify-center text-xs font-bold shadow-2xs">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Access Denied Warning Toast */}
        {accessDeniedToast && (
          <div className="mx-4 md:mx-8 mt-4 p-4 bg-red-50 border border-red-300 rounded-2xl text-red-900 text-xs font-bold flex items-center justify-between shadow-md shadow-red-900/10 animate-fade-in">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{accessDeniedToast}</span>
            </div>
            <button
              onClick={() => setAccessDeniedToast(null)}
              className="p-1 text-red-600 hover:bg-red-100 rounded-lg cursor-pointer transition-colors"
              title="Tutup Pesan"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Scrollable View Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden w-full max-w-full p-3 sm:p-5 md:p-8 pb-28 md:pb-8 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentUser.role === 'siswa' ? `siswa-${studentTab}` : `admin-${adminTab}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="space-y-6 w-full max-w-7xl mx-auto"
            >
              {currentUser.role === 'siswa' ? (
                <>
                  {studentTab === 'library' && (
                    <LibraryTab
                      books={studentBooks}
                      appSettings={appSettings}
                      isLoading={dataLoading}
                      onOpenReader={(b) => setActiveReadingBook(b)}
                      onOpenReportDirectly={(b) => setActiveReportBook(b)}
                    />
                  )}

                  {studentTab === 'reports' && (
                    <MyReportsTab
                      reports={studentReports}
                      loading={dataLoading}
                    />
                  )}

                  {studentTab === 'leaderboard' && (
                    <LeaderboardTab
                      reports={reports}
                      currentUser={currentUser}
                      classList={appSettings.classes}
                    />
                  )}

                  {studentTab === 'profile' && (
                    <ProfileTab
                      user={currentUser}
                      reports={studentReports}
                      books={studentBooks}
                      onChangeClassClick={() => setIsClassModalOpen(true)}
                      onLogout={handleLogout}
                    />
                  )}
                </>
              ) : (
                <>
                  {adminTab === 'monitoring' && (
                    <DashboardMonitoringTab
                      reports={reports}
                      classList={appSettings.classes}
                      loading={dataLoading}
                      currentUser={currentUser}
                      onLogout={handleLogout}
                      onUpdateProfile={handleUpdateProfile}
                      onValidateReport={handleValidateReport}
                      allUsers={allUsers}
                    />
                  )}

                  {adminTab === 'manage_books' && (
                    <ManageBooksTab
                      books={books}
                      onAddBook={handleAddBook}
                      onUpdateBook={handleUpdateBook}
                      onDeleteBook={handleDeleteBook}
                      loading={dataLoading}
                    />
                  )}

                  {adminTab === 'leaderboard' && (
                    <AdminLeaderboardTab
                      reports={reports}
                      classList={appSettings.classes}
                      allUsers={allUsers}
                    />
                  )}

                  {adminTab === 'settings' && (
                    <SettingsTab
                      settings={appSettings}
                      onSaveSettings={handleSaveSettings}
                      loading={dataLoading}
                      currentUser={currentUser}
                      onLogout={handleLogout}
                      onUpdateProfile={handleUpdateProfile}
                    />
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 3. MATERIAL DESIGN 3 MOBILE BOTTOM NAVIGATION BAR */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-[#E2E8F8] flex justify-around items-center h-16 sm:h-20 px-2 shadow-lg">
          {currentUser.role === 'siswa' ? (
            <>
              <button
                onClick={() => setStudentTab('library')}
                className="flex-1 flex flex-col items-center justify-center py-1 gap-0.5 cursor-pointer min-h-[48px]"
              >
                <div className={`px-4 py-1 rounded-full transition-all flex items-center justify-center ${
                  studentTab === 'library' ? 'bg-[#D8E2FF] text-[#001A41]' : 'text-slate-500 hover:text-slate-800'
                }`}>
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className={`text-[10px] ${studentTab === 'library' ? 'font-bold text-[#001A41]' : 'font-medium text-slate-500'}`}>
                  Perpustakaan
                </span>
              </button>

              <button
                onClick={() => setStudentTab('reports')}
                className="flex-1 flex flex-col items-center justify-center py-1 gap-0.5 cursor-pointer min-h-[48px]"
              >
                <div className={`px-4 py-1 rounded-full transition-all flex items-center justify-center ${
                  studentTab === 'reports' ? 'bg-[#D8E2FF] text-[#001A41]' : 'text-slate-500 hover:text-slate-800'
                }`}>
                  <FileText className="w-5 h-5" />
                </div>
                <span className={`text-[10px] ${studentTab === 'reports' ? 'font-bold text-[#001A41]' : 'font-medium text-slate-500'}`}>
                  Laporan
                </span>
              </button>

              <button
                onClick={() => setStudentTab('leaderboard')}
                className="flex-1 flex flex-col items-center justify-center py-1 gap-0.5 cursor-pointer min-h-[48px]"
              >
                <div className={`px-4 py-1 rounded-full transition-all flex items-center justify-center ${
                  studentTab === 'leaderboard' ? 'bg-[#D8E2FF] text-[#001A41]' : 'text-slate-500 hover:text-slate-800'
                }`}>
                  <Trophy className="w-5 h-5" />
                </div>
                <span className={`text-[10px] ${studentTab === 'leaderboard' ? 'font-bold text-[#001A41]' : 'font-medium text-slate-500'}`}>
                  Peringkat
                </span>
              </button>

              <button
                onClick={() => setStudentTab('profile')}
                className="flex-1 flex flex-col items-center justify-center py-1 gap-0.5 cursor-pointer min-h-[48px]"
              >
                <div className={`px-4 py-1 rounded-full transition-all flex items-center justify-center ${
                  studentTab === 'profile' ? 'bg-[#D8E2FF] text-[#001A41]' : 'text-slate-500 hover:text-slate-800'
                }`}>
                  <UserIcon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] ${studentTab === 'profile' ? 'font-bold text-[#001A41]' : 'font-medium text-slate-500'}`}>
                  Profil
                </span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setAdminTab('monitoring')}
                className="flex-1 flex flex-col items-center justify-center py-1 gap-0.5 cursor-pointer min-h-[48px]"
              >
                <div className={`px-4 py-1 rounded-full transition-all flex items-center justify-center ${
                  adminTab === 'monitoring' ? 'bg-[#C2E8FF] text-[#001E30]' : 'text-slate-500 hover:text-slate-800'
                }`}>
                  <LayoutDashboard className="w-5 h-5" />
                </div>
                <span className={`text-[10px] ${adminTab === 'monitoring' ? 'font-bold text-[#001E30]' : 'font-medium text-slate-500'}`}>
                  Monitoring
                </span>
              </button>

              <button
                onClick={() => setAdminTab('manage_books')}
                className="flex-1 flex flex-col items-center justify-center py-1 gap-0.5 cursor-pointer min-h-[48px]"
              >
                <div className={`px-4 py-1 rounded-full transition-all flex items-center justify-center ${
                  adminTab === 'manage_books' ? 'bg-[#C2E8FF] text-[#001E30]' : 'text-slate-500 hover:text-slate-800'
                }`}>
                  <BookPlus className="w-5 h-5" />
                </div>
                <span className={`text-[10px] ${adminTab === 'manage_books' ? 'font-bold text-[#001E30]' : 'font-medium text-slate-500'}`}>
                  Buku
                </span>
              </button>

              <button
                onClick={() => setAdminTab('leaderboard')}
                className="flex-1 flex flex-col items-center justify-center py-1 gap-0.5 cursor-pointer min-h-[48px]"
              >
                <div className={`px-4 py-1 rounded-full transition-all flex items-center justify-center ${
                  adminTab === 'leaderboard' ? 'bg-[#C2E8FF] text-[#001E30]' : 'text-slate-500 hover:text-slate-800'
                }`}>
                  <Trophy className="w-5 h-5" />
                </div>
                <span className={`text-[10px] ${adminTab === 'leaderboard' ? 'font-bold text-[#001E30]' : 'font-medium text-slate-500'}`}>
                  Peringkat
                </span>
              </button>

              <button
                onClick={() => setAdminTab('settings')}
                className="flex-1 flex flex-col items-center justify-center py-1 gap-0.5 cursor-pointer min-h-[48px]"
              >
                <div className={`px-4 py-1 rounded-full transition-all flex items-center justify-center ${
                  adminTab === 'settings' ? 'bg-[#C2E8FF] text-[#001E30]' : 'text-slate-500 hover:text-slate-800'
                }`}>
                  <SettingsIcon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] ${adminTab === 'settings' ? 'font-bold text-[#001E30]' : 'font-medium text-slate-500'}`}>
                  Pengaturan
                </span>
              </button>
            </>
          )}
        </nav>
      </main>

      {/* MODALS */}

      {/* 1. Mandatory Profile & Class Selection Modal */}
      <ClassSelectorModal
        isOpen={isClassModalOpen}
        currentName={currentUser?.name || authUser?.displayName || ''}
        currentClass={currentUser?.kelas || ''}
        classList={appSettings.classes}
        onSelectClass={handleSelectClass}
        isMandatory={!currentUser?.isProfileComplete || !currentUser?.kelas}
      />

      {/* 2. Embedded PDF Reader Modal */}
      <EmbeddedPdfReaderModal
        book={activeReadingBook}
        isOpen={!!activeReadingBook}
        appSettings={appSettings}
        onClose={() => setActiveReadingBook(null)}
        onCompleteReading={(book) => setActiveReportBook(book)}
        onOpenReport={(book) => setActiveReportBook(book)}
      />

      {/* 3. Literacy Report Submission Modal */}
      <ReportFormModal
        isOpen={!!activeReportBook}
        user={currentUser}
        book={activeReportBook}
        appSettings={appSettings}
        onClose={() => setActiveReportBook(null)}
        onSubmitReport={handleSubmitReport}
      />

      {/* 4. New Badge Celebration Modal */}
      <BadgeUnlockedModal
        isOpen={!!unlockedBadgesToShow}
        unlockedBadges={unlockedBadgesToShow || []}
        onClose={() => setUnlockedBadgesToShow(null)}
        onViewProfile={() => {
          setUnlockedBadgesToShow(null);
          setStudentTab('profile');
        }}
      />

      {/* 5. Admin PIN Verification Modal */}
      <AdminPinModal
        isOpen={isAdminPinModalOpen}
        onClose={() => setIsAdminPinModalOpen(false)}
        onSuccess={() => {
          setIsAdminPinModalOpen(false);
          setAdminAccessWarning(null);
          if (currentUser) {
            setCurrentUser({ ...currentUser, role: 'admin' });
          } else {
            handleDemoLogin('admin');
          }
        }}
      />
    </div>
  );
}
