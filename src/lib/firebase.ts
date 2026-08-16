import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  initializeFirestore,
  setLogLevel,
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import config from '../../firebase-applet-config.json';
import { UserProfile, Book, ReadingReport } from '../types';
import { DEFAULT_CLASSES } from '../data/schoolConstants';

// Mute verbose transient network warnings from Firestore internal logs
setLogLevel('error');

// Initialize Firebase with long-polling auto-detection for reliable cloud/container connectivity
const app = getApps().length === 0 ? initializeApp(config) : getApp();

export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
}, config.firestoreDatabaseId || undefined);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Google Auth helper
export const signInWithGoogle = async () => {
  try {
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Sign Out Error:', error);
  }
};

// URL Transformer helper for Google Drive PDF embeds
export function formatPdfEmbedUrl(url: string): string {
  if (!url) return '';
  
  const trimmedUrl = url.trim();

  // Google Drive URL handling
  if (trimmedUrl.includes('drive.google.com')) {
    // Extract file ID if in format /file/d/FILE_ID or /d/FILE_ID
    const fileIdMatch = trimmedUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || trimmedUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
    }

    // Check for id query parameter e.g., ?id=FILE_ID
    try {
      const parsed = new URL(trimmedUrl);
      const idParam = parsed.searchParams.get('id');
      if (idParam) {
        return `https://drive.google.com/file/d/${idParam}/preview`;
      }
    } catch {
      const idMatch = trimmedUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (idMatch && idMatch[1]) {
        return `https://drive.google.com/file/d/${idMatch[1]}/preview`;
      }
    }

    // Direct replacement of /view, /view?usp=sharing, /edit with /preview
    let converted = trimmedUrl
      .replace(/\/view(\?.*)?$/, '/preview')
      .replace(/\/view\?usp=sharing/, '/preview')
      .replace(/\/edit(\?.*)?$/, '/preview');

    if (!converted.includes('/preview')) {
      converted = converted.replace(/\/view/, '/preview');
    }

    return converted;
  }

  // Generic PDF URL through Google Docs Viewer for cross-origin PDF embedding if needed
  if (trimmedUrl.endsWith('.pdf') && !trimmedUrl.includes('google.com')) {
    return `https://docs.google.com/gview?url=${encodeURIComponent(trimmedUrl)}&embedded=true`;
  }

  return trimmedUrl;
}

