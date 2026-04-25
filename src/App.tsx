import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  onAuthStateChanged, 
  signOut,
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  setDoc,
  doc, 
  orderBy, 
  limit, 
  Timestamp,
  serverTimestamp,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  ref,
  uploadBytes,
  getDownloadURL,
  auth, 
  db, 
  storage,
  handleFirestoreError,
  OperationType,
  GoogleAuthProvider,
  signInWithPopup
} from './firebase';
import { User as FirebaseUser } from 'firebase/auth';
import { generateKeyPair, encryptContent, decryptContent } from './lib/crypto';
import { glacierAI, AIQuality } from './lib/gemini';
import { cn } from './lib/utils';
import { MeteorixLogo } from './components/Logo';
import { 
  LogOut, 
  Send, 
  Image as ImageIcon, 
  Paperclip, 
  Video, 
  Clock, 
  ChevronLeft, 
  Search,
  MessageSquare,
  Users,
  ShieldCheck,
  Zap,
  Star,
  Sparkles,
  Trash2,
  Cpu,
  Shield,
  Lock,
  Film,
  Key,
  Globe,
  Database,
  CloudLightning,
  X,
  RefreshCcw,
  RotateCcw,
  Mail,
  UserPlus,
  Moon,
  Sun,
  Bell,
  Eye,
  Settings,
  ExternalLink,
  Volume2,
  Save,
  Settings2,
  Archive,
  Battery,
  Wifi,
  Info,
  VolumeX,
  PinOff,
  Inbox,
  Heart,
  List,
  Reply,
  Copy,
  Forward,
  Pin,
  Bot,
  ListChecks,
  Check,
  Plus,
  Mic,
  Phone,
  BarChart3,
  FileText,
  Headphones,
  CirclePlay,
  CirclePause,
  ArrowDownToLine,
  PhoneCall,
  VideoOff,
  PhoneOff,
  MicOff,
  Camera,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { DynamicBackground } from './components/DynamicBackground';

// --- Types ---
interface ChatUser {
  uid: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  photoURL: string;
  publicKey?: string;
  status?: string;
  lastSeen?: any;
  bio?: string;
  nicknames?: Record<string, string>; // Store custom names for others
  
  // Customization Matrix (20+ points)
  accentColor?: 'glacier' | 'nova' | 'flare' | 'emerald' | 'amber' | 'rose';
  bubbleStyle?: 'sharp' | 'rounded' | 'futuristic' | 'minimal';
  fontFamily?: 'sans' | 'mono' | 'serif' | 'grotesk';
  bgAnimation?: 'dynamic' | 'static' | 'flow' | 'glitch';
  transparency?: number;
  compactMode?: boolean;
  showBio?: boolean;
  showLastSeen?: boolean;
  messageFont?: number; // 12-20
  blurIntensity?: number;
  activeStatus?: boolean;
  soundEnabled?: boolean;
  typingIndicator?: boolean;
  readReceipts?: boolean;
  encryptionBadge?: boolean;
  avatarShape?: 'circle' | 'square' | 'squircle';
  themeMode?: 'dark' | 'light' | 'oled' | 'matrix' | 'meteoroid' | 'nebula';
  savedContacts?: string[]; // UIDs of saved nodes
}

const AI_SUGGESTIONS = [
  "Generate a 4K neon cityscape",
  "Animate a deep space nebula",
  "Write complex React code",
  "Complex logic: Time travel paradox",
  "Create an icy planet visualization"
];

interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: string;
  updatedAt: any;
  type: 'direct' | 'group';
  isAI?: boolean;
  groupName?: string;
  groupDescription?: string;
  groupAvatar?: string;
  groupRules?: string;
  adminId?: string;
  inviteCode?: string;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  contentEncrypted: string;
  iv: string;
  encKeys?: { [uid: string]: string };
  type: 'text' | 'file' | 'image' | 'video' | 'video_call' | 'voice_call' | 'audio' | 'voice' | 'poll' | 'call';
  disappearsAt?: any;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: number;
  pollData?: {
    question: string;
    options: { text: string; votes: string[] }[];
    multipleAnswers?: boolean;
  };
  createdAt: any;
}

function useLongPress(callback: (e: any) => void) {
  const [timer, setTimer] = useState<any>(null);

  const start = useCallback((e: any) => {
    const isTouch = e.type?.startsWith('touch');
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;

    const t = setTimeout(() => {
      callback({ clientX, clientY, preventDefault: () => e.preventDefault?.() });
    }, 600);
    setTimer(t);
  }, [callback]);

  const stop = useCallback(() => {
    if (timer) clearTimeout(timer);
    setTimer(null);
  }, [timer]);

  return {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchStart: start,
    onTouchEnd: stop,
  };
}

// --- Components ---

function AudioRecorder({ onRecordingComplete, onCancel }: { onRecordingComplete: (blob: Blob) => void, onCancel: () => void }) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timerId = useRef<any>(null);

  useEffect(() => {
    startRecording();
    return () => {
      if (timerId.current) clearInterval(timerId.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      chunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data);
      };

      mediaRecorder.current.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' });
        onRecordingComplete(blob);
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      timerId.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access failed:", err);
      onCancel();
    }
  };

  const stop = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      clearInterval(timerId.current);
    }
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 flex items-center justify-between px-4 bg-red-500/10 rounded-2xl md:rounded-3xl border border-red-500/20 animate-in fade-in slide-in-from-right-4">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-red-400 font-mono text-sm font-bold uppercase tracking-widest">{formatTime(duration)}</span>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={onCancel} className="text-white/40 hover:text-white transition-colors text-xs font-bold uppercase tracking-tighter">Discard</button>
        <button 
          onClick={stop}
          className="bg-red-500 text-white p-3 rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)]"
        >
          <Mic className="w-5 h-5 fill-current" />
        </button>
      </div>
    </div>
  );
}

function PollCreator({ onCreate, onCancel }: { onCreate: (poll: Message['pollData']) => void, onCancel: () => void }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  const addOption = () => {
    if (options.length < 5) setOptions([...options, '']);
  };

  const handlePollCreate = () => {
    if (!question.trim() || options.some(o => !o.trim())) return;
    onCreate({
      question,
      options: options.map(o => ({ text: o, votes: [] })),
      multipleAnswers: false
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }} 
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
    >
      <div className="w-full max-w-md bg-[#0a0a0c] border border-white/10 rounded-[40px] p-8 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 h-full pointer-events-none opacity-5">
           <BarChart3 size={200} />
        </div>
        
        <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-6">Create Matrix Poll</h3>
        
        <div className="space-y-6 relative z-10">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">The Query</label>
            <input 
              type="text" 
              placeholder="What is your current frequency?"
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white focus:outline-none focus:border-glacier-primary transition-all text-sm"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>

          <div className="space-y-3">
             <label className="text-[10px] font-black uppercase text-white/40 tracking-widest ml-1">Response Channels</label>
             {options.map((opt, i) => (
                <input 
                  key={i}
                  type="text" 
                  placeholder={`Option ${i+1}`}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-5 text-white focus:outline-none focus:border-glacier-primary transition-all text-xs"
                  value={opt}
                  onChange={(e) => {
                    const newOpt = [...options];
                    newOpt[i] = e.target.value;
                    setOptions(newOpt);
                  }}
                />
             ))}
             {options.length < 5 && (
                <button 
                  onClick={addOption}
                  className="text-[10px] text-glacier-primary font-bold uppercase tracking-widest hover:underline flex items-center gap-2"
                >
                  <Plus className="w-3 h-3" /> Add Link
                </button>
             )}
          </div>

          <div className="flex gap-4 pt-4">
             <button onClick={onCancel} className="flex-1 py-4 rounded-2xl border border-white/10 text-white/40 font-bold uppercase tracking-widest text-[10px] hover:bg-white/5 transition-all">Cancel</button>
             <button 
              onClick={handlePollCreate}
              className="flex-1 py-4 rounded-2xl bg-glacier-primary text-black font-black uppercase tracking-widest text-[10px] shadow-xl hover:brightness-110 active:scale-95 transition-all"
             >
              Deploy Poll
             </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SidebarChatItem({ conv, onSelect, isActive, onContextMenu, currentUserData }: any) {
  const longPressProps = useLongPress((e: any) => onContextMenu(e, 'chat', conv));
  const [userData, setUserData] = useState<any>(null);
  
  // Get other user ID for direct chats
  const otherId = !conv.isAI && conv.type !== 'group' && conv.participants ? conv.participants.find((p: string) => p !== currentUserData?.uid) : null;
  const nickname = otherId ? currentUserData?.nicknames?.[otherId] : null;

  useEffect(() => {
    if (otherId) {
      if (!(window as any)._user_cache) (window as any)._user_cache = {};
      if ((window as any)._user_cache[otherId]) {
        setUserData((window as any)._user_cache[otherId]);
      } else {
        getDoc(doc(db, 'users', otherId)).then(snap => {
          if (snap.exists()) {
            const data = snap.data();
            (window as any)._user_cache[otherId] = data;
            setUserData(data);
          }
        });
      }
    }
  }, [otherId]);

  return (
    <button
      onClick={() => onSelect(conv)}
      onContextMenu={(e: React.MouseEvent) => {
        e.preventDefault();
        onContextMenu(e.clientX, e.clientY, 'chat', conv);
      }}
      {...longPressProps}
      className={cn(
        "w-full text-left p-4 rounded-2xl flex items-center gap-4 transition-all group relative border border-transparent mb-1",
        isActive ? "bg-glacier-primary/10 border-glacier-primary/30 shadow-lg shadow-glacier-primary/5" : "hover:bg-white/5"
      )}
    >
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 transition-all group-hover:scale-105 shadow-xl bg-center bg-cover bg-glacier-surface",
        conv.isAI ? "border-glacier-primary/30 shadow-glacier-primary/10" : "bg-glacier-primary/20 border-glacier-primary/30 overflow-hidden"
      )} style={{ 
        backgroundImage: conv.isAI 
          ? 'url(/glacier_ai.png)' 
          : (conv.type === 'group' ? `url(${conv.groupAvatar})` : (userData?.photoURL ? `url(${userData.photoURL})` : 'none'))
      }}>
          {!conv.isAI && conv.type !== 'group' && !userData?.photoURL && <Users className="text-glacier-primary w-5 h-5" />}
          {conv.type === 'group' && !conv.groupAvatar && <Users className="text-glacier-primary w-5 h-5" />}
      </div>
      <div className="flex-1 text-left min-w-0">
        <div className="flex justify-between items-center mb-0.5">
          <span className={cn("font-black text-sm tracking-tighter truncate uppercase", isActive ? "text-glacier-primary" : "text-glacier-text")}>
            {conv.isAI ? 'Glacier AI' : (nickname || (conv.type === 'group' ? conv.groupName : (userData?.displayName || userData?.username || `Neural Link ${conv.id.slice(0, 4)}`)))}
          </span>
          <span className="text-[9px] text-glacier-text/20 font-black uppercase">{conv.updatedAt ? format(conv.updatedAt.toDate(), 'HH:mm') : ''}</span>
        </div>
        <p className="text-[11px] text-glacier-text/40 truncate font-medium">
          {conv.lastMessage || 'Link active...'}
        </p>
      </div>
    </button>
  );
}

// --- App Component ---
export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [privateKey, setPrivateKey] = useState<CryptoKey | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedChat, setSelectedChat] = useState<Conversation | null>(null);
  const [currentUserData, setCurrentUserData] = useState<ChatUser | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [networkStatus, setNetworkStatus] = useState<any>(null);

  // Initialize Native Shell Hardware
  useEffect(() => {
    const initNative = async () => {
      try {
        // Standard Web Browser Hardware Interface
        let batteryLevel = 1;
        try {
          const battery: any = (navigator as any).getBattery ? await (navigator as any).getBattery() : null;
          if (battery) batteryLevel = battery.level;
        } catch (e) {}

        setDeviceInfo({
          model: 'Web Neural Node',
          operatingSystem: 'Browser',
          osVersion: 'Agent-X',
          batteryLevel
        });

        const updateNetwork = () => {
          setNetworkStatus({
            connected: navigator.onLine,
            connectionType: (navigator as any).connection?.effectiveType || 'cellular'
          });
        };

        updateNetwork();
        window.addEventListener('online', updateNetwork);
        window.addEventListener('offline', updateNetwork);
      } catch (err) {
        console.log('Diagnostic link failed');
      }
    };
    initNative();
  }, []);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light' | 'oled' | 'matrix' | 'meteoroid' | 'nebula'>('dark');
  const [viewingProfile, setViewingProfile] = useState<ChatUser | null>(null);
  const [savedContacts, setSavedContacts] = useState<string[]>([]);
  const [activeContextMenu, setActiveContextMenu] = useState<{ x: number, y: number, type: 'chat' | 'message', target: any } | null>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  // PWA Install Logic
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setInstallPrompt(null);
  };

  // Theme & Accent Sync
  useEffect(() => {
    (window as any).currentTheme = theme;
    const root = window.document.documentElement;
    // Mode Class
    root.classList.remove('light', 'oled', 'matrix', 'meteoroid', 'nebula');
    if (theme !== 'dark') root.classList.add(theme);

    // Dynamic Accent (The "100+ Themes" Engine)
    if (currentUserData?.accentColor) {
      const color = currentUserData.accentColor.startsWith('#') 
        ? currentUserData.accentColor 
        : ({
            glacier: '#58a6ff',
            nova: '#a855f7',
            flare: '#ef4444',
            emerald: '#10b981',
            amber: '#f59e0b',
            rose: '#f43f5e'
          } as any)[currentUserData.accentColor] || '#58a6ff';
          
      root.style.setProperty('--accent-primary', color);
      root.style.setProperty('--custom-accent', color);
      
      if (theme === 'meteoroid') {
        root.style.setProperty('--accent-primary', '#ffcc33');
      } else if (theme === 'nebula') {
        root.style.setProperty('--accent-primary', '#ec4899');
      }
    }

    // Font Sync
    if (currentUserData?.fontFamily) {
      const fonts: any = {
         sans: 'Inter, sans-serif',
         mono: 'JetBrains Mono, monospace',
         serif: 'Playfair Display, serif',
         grotesk: 'Space Grotesk, sans-serif'
      };
      root.style.setProperty('--font-sans', fonts[currentUserData.fontFamily]);
    }
  }, [theme, currentUserData]);
  
  // Advanced Auth Flow States
  const [authStep, setAuthStep] = useState<'init' | 'profile'>('init');
  
  // Registration Data
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regUsername, setRegUsername] = useState('');

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      try {
        if (u) {
          setUser(u);
          const userDocRef = doc(db, 'users', u.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const data = userDoc.data() as ChatUser;
            setSavedContacts(data.savedContacts || []);
            // CRITICAL: Force profile setup if handle @ is missing
            if (data.username && data.username.startsWith('@')) {
              setCurrentUserData(data);
              if (!(window as any)._glacier_pk) {
                 const { privateKey } = await generateKeyPair(); 
                 setPrivateKey(privateKey);
                 (window as any)._glacier_pk = privateKey;
              } else {
                setPrivateKey((window as any)._glacier_pk);
              }
            } else {
              setAuthStep('profile');
            }
          } else {
            // User exists in Auth but not in Firestore -> Profile incomplete
            setAuthStep('profile');
          }
        } else {
          setUser(null);
          setCurrentUserData(null);
          setAuthStep('init');
        }
      } catch (err) {
        console.error("Auth initialization error:", err);
        // We don't throw here to ensure authReady becomes true
      } finally {
        setAuthReady(true);
      }
    });
    return unsubscribe;
  }, []);

  // 2. Fetch Conversations
  const glacierAIConv = useMemo(() => {
    if (!user) return null;
    const participants = [user.uid, 'glacier-ai'].sort();
    const convId = participants.join('_');
    return {
      id: convId,
      participants,
      type: 'direct',
      updatedAt: Timestamp.now(),
      isAI: true
    } as Conversation;
  }, [user]);

  useEffect(() => {
    const handler = (e: any) => {
      const { convId } = e.detail;
      const aiConv = conversations.find(c => c.id === convId) || glacierAIConv;
      if (aiConv) {
        setSelectedChat(aiConv);
      }
    };
    window.addEventListener('matrix-ask-ai', handler);
    return () => window.removeEventListener('matrix-ask-ai', handler);
  }, [conversations, glacierAIConv]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid)
    );
    return onSnapshot(q, (snapshot) => {
      let fetched = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Conversation));
      // Sort manually to avoid index requirement
      fetched.sort((a, b) => {
        const ta = a.updatedAt?.toMillis?.() || 0;
        const tb = b.updatedAt?.toMillis?.() || 0;
        return tb - ta;
      });
      
      // Strict Deduplication using Map for unique IDs
      const conversationMap = new Map();
      
      // If AI channel exists (local ghost), add it first
      if (glacierAIConv) {
        conversationMap.set(glacierAIConv.id, glacierAIConv);
      }
      
      // Fill/Overwrite with Firestore data (Source of Truth)
      fetched.forEach(conv => {
        conversationMap.set(conv.id, conv);
      });
      
      setConversations(Array.from(conversationMap.values()).sort((a: any, b: any) => {
        const timeA = a.updatedAt?.toMillis?.() || 0;
        const timeB = b.updatedAt?.toMillis?.() || 0;
        return timeB - timeA;
      }));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'conversations');
    });
  }, [user, glacierAIConv]);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      // Use popup for cleaner matrix feel
      const result = await signInWithPopup(auth, provider);
      
      // Immediately check if this user exists in our records
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      
      if (userDoc.exists()) {
        const data = userDoc.data() as ChatUser;
        if (data.username && data.username.startsWith('@')) {
           setCurrentUserData(data);
           return;
        }
      }
      
      setAuthStep('profile');
    } catch (error: any) {
      console.error("Google sync failure:", error);
      let errorMessage = `Sync Failure: ${error.message}`;
      
      // Special hint for APK users
      if (error.code === 'auth/internal-error' || error.message.includes('Action is invalid')) {
        errorMessage = "Handshake Error: Ensure your SHA-1 fingerprint and google-services.json are registered in Firebase for the APK.";
      }
      
      setAuthError(errorMessage);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSystemPurge = async () => {
    if (!window.confirm("CRITICAL WARNING: This will permanently wipe ALL users and conversations from the server. This cannot be undone. All nodes will be forced offline. Proceed?")) return;
    setIsLoggingIn(true);
    try {
      const uSnap = await getDocs(collection(db, 'users'));
      await Promise.all(uSnap.docs.map(d => deleteDoc(d.ref)));
      const cSnap = await getDocs(collection(db, 'conversations'));
      await Promise.all(cSnap.docs.map(d => deleteDoc(d.ref)));
      
      alert("System Overwrite Complete. Total Network Wipe Successful.");
      window.location.reload();
    } catch (err: any) {
      setAuthError(`Core Wipe Failed: ${err.message}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleCompleteProfile = async () => {
    if (!user) return;
    
    const cleanUsername = regUsername.trim().toLowerCase();
    if (!cleanUsername.startsWith('@') || cleanUsername.length < 3) {
       setAuthError("PROTOCOL ERROR: Handle must start with '@' and be at least 3 characters.");
       return;
    }
    
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      // Check for uniqueness
      const q = query(collection(db, 'users'), where('username', '==', cleanUsername));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setAuthError("PROTOCOL ERROR: This username is already preserved.");
        setIsLoggingIn(false);
        return;
      }

      const { publicKey, privateKey } = await generateKeyPair();
      const userData: ChatUser = {
        uid: user.uid,
        email: user.email!,
        username: cleanUsername,
        firstName: regFirstName.trim(),
        lastName: regLastName.trim(),
        displayName: `${regFirstName.trim()} ${regLastName.trim()}`,
        photoURL: user.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.uid}`,
        publicKey,
        lastSeen: serverTimestamp() as any,
      };
      
      // Save to server (Firestore) - this "remembers" it
      await setDoc(doc(db, 'users', user.uid), userData);
      
      setPrivateKey(privateKey);
      setCurrentUserData(userData);
      (window as any)._glacier_pk = privateKey;
    } catch (err: any) {
      console.error("Profile sync failure:", err);
      setAuthError(`Server Persistence Failure: ${err.message}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleUpdateMetadata = async (updates: Partial<ChatUser>) => {
    if (!user) return;
    const updateDocRef = doc(db, 'users', user.uid);
    try {
      await setDoc(updateDocRef, updates, { merge: true });
      if (updates.savedContacts) setSavedContacts(updates.savedContacts);
    } catch (err) {
      console.error("Matrix metadata sync failure:", err);
    }
  };

  const handleToggleContact = async (targetUid: string) => {
    if (!currentUserData) return;
    const isSaved = savedContacts.includes(targetUid);
    const newContacts = isSaved 
      ? savedContacts.filter(id => id !== targetUid)
      : [...savedContacts, targetUid];
    
    await handleUpdateMetadata({ savedContacts: newContacts });
    setCurrentUserData({ ...currentUserData, savedContacts: newContacts });
  };

  const logout = () => signOut(auth);

  const handleOpenContextMenu = (e: React.MouseEvent | React.TouchEvent | any, type: 'chat' | 'message', target: any) => {
    e.preventDefault?.();
    const x = 'clientX' in e ? e.clientX : (e.touches?.[0]?.clientX || 0);
    const y = 'clientY' in e ? e.clientY : (e.touches?.[0]?.clientY || 0);
    // Boundary check for viewport
    const finalX = Math.min(x, window.innerWidth - 220);
    const finalY = Math.min(y, window.innerHeight - 300);
    setActiveContextMenu({ x: finalX, y: finalY, type, target });
  };

  if (!authReady) return <LoadingScreen />;
  if (!user || !currentUserData) return (
    <AuthScreen 
      onGoogleLogin={handleGoogleLogin}
      onCompleteProfile={handleCompleteProfile}
      regData={{
        firstName: regFirstName, setFirstName: setRegFirstName,
        lastName: regLastName, setLastName: setRegLastName,
        username: regUsername, setUsername: setRegUsername
      }}
      isLoading={isLoggingIn} 
      error={authError} 
      step={authStep}
      onSystemPurge={handleSystemPurge}
    />
  );

  return (
    <div 
      className="flex h-[100dvh] w-full overflow-hidden bg-[#0a0a0c] relative select-none pb-safe"
      onClick={() => activeContextMenu && setActiveContextMenu(null)}
    >
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <DynamicBackground />
      </div>
      
      {/* Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_2px,3px_100%] opacity-20" />
      
      {/* Sidebar - Hidden on mobile when chat is selected */}
      <div className={cn(
        "flex-col border-r border-white/5 glass-dark z-20 shrink-0 h-full transition-all duration-300 pt-safe",
        selectedChat ? "hidden md:flex w-80" : "flex w-full md:w-80",
        theme === 'nebula' && "meteorix-border overflow-visible"
      )}>
        <Sidebar 
          conversations={conversations} 
          onSelect={setSelectedChat} 
          activeId={selectedChat?.id}
          currentUser={currentUserData}
          onLogout={logout}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenCreateGroup={() => setIsCreateGroupOpen(true)}
          onViewProfile={setViewingProfile}
          onContextMenu={handleOpenContextMenu}
          onInstall={installPrompt ? handleInstall : null}
          deviceInfo={deviceInfo}
          networkStatus={networkStatus}
        />
      </div>

      {/* Main Chat Area - Hidden on mobile when no chat is selected */}
      <div className={cn(
        "flex-1 h-full relative z-10 transition-all duration-300",
        !selectedChat ? "hidden md:flex" : "flex"
      )}>
        <AnimatePresence mode="wait">
          {selectedChat ? (
            <ChatWindow 
              key={selectedChat.id}
              chat={selectedChat} 
              currentUser={user}
              currentUserData={currentUserData}
              privateKey={privateKey}
              onBack={() => setSelectedChat(null)}
              onViewProfile={setViewingProfile}
              onContextMenu={handleOpenContextMenu}
            />
          ) : (
            <EmptyState />
          )}
        </AnimatePresence>
      </div>

      {/* Modals placed outside main flex to avoid stacking issues */}
      <AnimatePresence>
        {isSearchOpen && (
          <UserSearchModal 
            onClose={() => setIsSearchOpen(false)} 
            onStartChat={async (targetUser: any) => {
              const existing = conversations.find(c => 
                c.type === 'direct' && c.participants.includes(targetUser.uid)
              );
              if (existing) {
                setSelectedChat(existing);
              } else {
                try {
                  const newConv = await addDoc(collection(db, 'conversations'), {
                    participants: [user.uid, targetUser.uid].sort(),
                    type: 'direct',
                    updatedAt: serverTimestamp(),
                  });
                  setSelectedChat({ id: newConv.id, participants: [user.uid, targetUser.uid], type: 'direct', updatedAt: Timestamp.now() });
                } catch (err) {
                  handleFirestoreError(err, OperationType.CREATE, 'conversations');
                }
              }
              setIsSearchOpen(false);
            }}
            currentUser={user}
          />
        )}
        
        {isCreateGroupOpen && (
          <CreateGroupModal 
            onClose={() => setIsCreateGroupOpen(false)}
            currentUser={user}
            onCreated={(newConv: any) => {
              setSelectedChat(newConv);
              setIsCreateGroupOpen(false);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsModal 
            onClose={() => setIsSettingsOpen(false)} 
            userData={currentUserData}
            currentUser={user}
            onUpdate={async (newData: any) => {
               if (user) {
                 try {
                   await setDoc(doc(db, 'users', user.uid), newData, { merge: true });
                   setCurrentUserData({ ...currentUserData, ...newData });
                   
                   // Sync local theme if changed
                   if (newData.themeMode) setTheme(newData.themeMode);
                 } catch (err) {
                   handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
                 }
               }
            }}
            onLogout={logout}
            onSystemPurge={handleSystemPurge}
            currentTheme={theme}
            onThemeChange={setTheme}
          />
        )}
        
        {viewingProfile && (
          <UserProfileModal 
            user={viewingProfile} 
            isSaved={savedContacts.includes(viewingProfile.uid)}
            onToggleContact={handleToggleContact}
            onClose={() => setViewingProfile(null)}
            onStartChat={async (target: any) => {
               setViewingProfile(null);
               // Use existing search logic or similar
               const existing = conversations.find(c => 
                c.type === 'direct' && c.participants.includes(target.uid)
               );
               if (existing) {
                 setSelectedChat(existing);
               } else {
                 try {
                   const newConv = await addDoc(collection(db, 'conversations'), {
                     participants: [user!.uid, target.uid].sort(),
                     type: 'direct',
                     updatedAt: serverTimestamp(),
                   });
                   setSelectedChat({ id: newConv.id, participants: [user!.uid, target.uid], type: 'direct', updatedAt: Timestamp.now() });
                 } catch (err) {
                   handleFirestoreError(err, OperationType.CREATE, 'conversations');
                 }
               }
            }}
          />
        )}

        {/* Global Context Menu */}
        <AnimatePresence>
          {activeContextMenu && (
            <ContextMenu 
              key="global-context-menu"
              {...activeContextMenu} 
              onClose={() => setActiveContextMenu(null)} 
              onSetNickname={async (conv: any) => {
                if (conv.isAI) return;
                const otherId = conv.participants.find((p: string) => p !== user?.uid);
                if (!otherId) return;
                const nick = window.prompt("Enter Specific Name (Nickname):");
                if (nick === null) return;
                
                const newNicknames = { ...(currentUserData?.nicknames || {}), [otherId]: nick };
                await handleUpdateMetadata({ nicknames: newNicknames });
                setCurrentUserData({ ...currentUserData!, nicknames: newNicknames });
              }}
            />
          )}
        </AnimatePresence>
      </AnimatePresence>
    </div>
  );
}

// --- Subcomponents ---

function CreateGroupModal({ onClose, currentUser, onCreated }: any) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatar, setAvatar] = useState('');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<ChatUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const searchUsers = async () => {
    if (!search.trim()) return;
    setLoading(true);
    try {
      const sanitized = search.startsWith('@') ? search.toLowerCase() : `@${search.toLowerCase()}`;
      const q = query(collection(db, 'users'), where('username', '>=', sanitized), where('username', '<=', sanitized + '\uf8ff'), limit(10));
      const snap = await getDocs(q);
      const items = snap.docs.map(d => d.data() as ChatUser).filter(u => u.uid !== currentUser.uid);
      setResults(items);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'users');
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (u: ChatUser) => {
    if (selectedUsers.find(su => su.uid === u.uid)) {
      setSelectedUsers(selectedUsers.filter(su => su.uid !== u.uid));
    } else {
      setSelectedUsers([...selectedUsers, u]);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) return alert("Group Designation Required");

    setIsCreating(true);
    try {
      const participants = [currentUser.uid, ...selectedUsers.map(u => u.uid)].sort();
      const uniqueParticipants = Array.from(new Set(participants));
      const newConvData = {
        participants: uniqueParticipants,
        type: 'group',
        groupName: name.trim(),
        groupDescription: description.trim(),
        groupAvatar: avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`,
        adminId: currentUser.uid,
        updatedAt: serverTimestamp(),
      };
      
      const newConv = await addDoc(collection(db, 'conversations'), newConvData);
      onCreated({ id: newConv.id, ...newConvData, updatedAt: Timestamp.now() });
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'conversations');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-6 bg-black/90 backdrop-blur-xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-glacier-bg/40 backdrop-blur-3xl w-full h-full md:h-auto md:max-w-md md:rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(88,166,255,0.15)] border border-white/10 flex flex-col"
      >
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-glacier-primary/10 rounded-2xl flex items-center justify-center border border-glacier-primary/20">
                <Users className="text-glacier-primary w-6 h-6" />
             </div>
             <div>
                <h2 className="text-xl font-black tracking-tighter uppercase text-white leading-tight">Neural Cluster</h2>
                <div className="flex items-center gap-2">
                   <p className="text-[10px] text-glacier-primary uppercase font-bold tracking-[0.2em]">Step {step} of 2</p>
                   <div className="flex gap-1">
                      <div className={cn("w-3 h-1 rounded-full transition-all", step === 1 ? "bg-glacier-primary" : "bg-white/10")} />
                      <div className={cn("w-3 h-1 rounded-full transition-all", step === 2 ? "bg-glacier-primary" : "bg-white/10")} />
                   </div>
                </div>
             </div>
          </div>
          <button onClick={onClose} className="p-3 text-white/20 hover:text-red-400 hover:bg-white/5 rounded-2xl transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
           <AnimatePresence mode="wait">
             {step === 1 ? (
               <motion.div 
                 key="step1"
                 initial={{ opacity: 0, x: -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: 20 }}
                 className="space-y-6"
               >
                  <div className="space-y-4">
                     <div className="flex gap-2">
                        <div className="relative flex-1">
                           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                           <input 
                             type="text" 
                             placeholder="Scan Network @handle..." 
                             className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-5 text-sm focus:outline-none focus:border-glacier-primary transition-all text-white placeholder:text-white/20 font-bold"
                             value={search}
                             onChange={(e) => setSearch(e.target.value)}
                             onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                           />
                        </div>
                        <button 
                          onClick={searchUsers}
                          disabled={loading}
                          className="bg-glacier-primary text-black px-6 rounded-2xl hover:brightness-110 disabled:opacity-50 transition-all font-black uppercase text-[10px] tracking-widest"
                        >
                          {loading ? <RefreshCcw className="w-5 h-5 animate-spin" /> : "Scan"}
                        </button>
                     </div>

                     <div className="space-y-2 max-h-[320px] overflow-y-auto custom-scrollbar pr-1">
                       {results.length > 0 ? (
                         results.map(u => (
                           <button 
                             key={u.uid}
                             onClick={() => toggleUser(u)}
                             className={cn(
                               "w-full p-4 rounded-[2rem] flex items-center gap-4 transition-all border group",
                               selectedUsers.find(su => su.uid === u.uid) 
                                 ? "bg-glacier-primary/10 border-glacier-primary/40 shadow-[0_0_20px_rgba(88,166,255,0.1)]" 
                                 : "bg-white/5 border-white/5 hover:bg-white/10"
                             )}
                           >
                             <img src={u.photoURL || `https://picsum.photos/seed/${u.uid}/100`} alt="" className="w-12 h-12 rounded-2xl border border-white/10 object-cover" />
                             <div className="flex-1 text-left">
                               <p className="text-sm font-black text-white uppercase tracking-tight">{u.displayName}</p>
                               <p className="text-[10px] text-glacier-primary font-mono tracking-widest uppercase opacity-60">Node_{u.uid.slice(0, 8)}</p>
                             </div>
                             <div className={cn(
                               "w-8 h-8 rounded-xl flex items-center justify-center border transition-all",
                               selectedUsers.find(su => su.uid === u.uid) ? "bg-glacier-primary border-glacier-primary text-black scale-110" : "border-white/10 text-transparent"
                             )}>
                               <Check className="w-5 h-5" />
                             </div>
                           </button>
                         ))
                       ) : search.length > 0 && !loading ? (
                         <div className="py-12 flex flex-col items-center gap-4 opacity-20">
                            <Zap className="w-10 h-10" />
                            <p className="text-[10px] uppercase font-black tracking-[0.3em]">No resonance detected</p>
                         </div>
                       ) : (
                         <div className="py-12 flex flex-col items-center gap-4 opacity-10">
                            <Globe className="w-12 h-12" />
                            <p className="text-[10px] uppercase font-black tracking-[0.3em]">Query the global matrix</p>
                         </div>
                       )}
                     </div>

                     {selectedUsers.length > 0 && (
                       <div className="pt-6 border-t border-white/5">
                         <div className="flex justify-between items-center mb-4">
                            <label className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em]">Synchronized Nodes ({selectedUsers.length})</label>
                            <button onClick={() => setSelectedUsers([])} className="text-[9px] text-red-400/60 uppercase font-bold hover:text-red-400">Clear All</button>
                         </div>
                         <div className="flex flex-wrap gap-2">
                           {selectedUsers.map((u, idx) => (
                             <div key={`selected-${u.uid}-${idx}`} className="flex items-center gap-2 bg-glacier-primary/10 border border-glacier-primary/20 rounded-2xl py-2 pl-2 pr-4 group/chip hover:bg-glacier-primary/20 transition-all">
                               <img src={u.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${u.uid}`} alt="" className="w-6 h-6 rounded-lg" />
                               <span className="text-[10px] font-black text-white uppercase tracking-tight">{u.displayName.split(' ')[0]}</span>
                               <button onClick={() => toggleUser(u)} className="hover:text-red-400 transition-colors">
                                 <X className="w-3.5 h-3.5 text-white/20 group-hover/chip:text-white/60" />
                               </button>
                             </div>
                           ))}
                         </div>
                       </div>
                     )}
                  </div>
               </motion.div>
             ) : (
               <motion.div 
                 key="step2"
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                 className="space-y-10"
               >
                   <div className="flex flex-col items-center gap-8">
                     <div className="relative">
                        <div className="w-32 h-32 rounded-[3.5rem] bg-white/5 border-4 border-white/10 flex items-center justify-center overflow-hidden transition-all shadow-2xl bg-cover bg-center"
                             style={{ backgroundImage: avatar ? `url(${avatar})` : (name ? `url(https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)})` : 'none') }}>
                          {!avatar && !name && <Camera className="w-10 h-10 text-white/20" />}
                        </div>
                        <div className="absolute -bottom-3 -right-3 w-12 h-12 bg-glacier-primary rounded-2xl flex items-center justify-center shadow-2xl border-4 border-glacier-bg">
                           <ImageIcon className="w-5 h-5 text-black" />
                        </div>
                     </div>
                     <div className="w-full space-y-6">
                        <div className="space-y-3">
                          <label className="text-[11px] font-black uppercase text-glacier-primary tracking-[0.3em] ml-1">Logo URL Source</label>
                          <input 
                            type="text" 
                            placeholder="Direct image link..." 
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm focus:outline-none focus:border-glacier-primary transition-all text-white font-mono placeholder:text-white/10"
                            value={avatar}
                            onChange={(e) => setAvatar(e.target.value)}
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[11px] font-black uppercase text-glacier-primary tracking-[0.3em] ml-1">Cluster Designation</label>
                          <input 
                            type="text" 
                            placeholder="Identify your group..." 
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-xl font-black tracking-tighter uppercase focus:outline-none focus:border-glacier-primary transition-all text-white placeholder:text-white/10"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                          />
                        </div>
                        <div className="space-y-3">
                           <label className="text-[11px] font-black uppercase text-glacier-primary tracking-[0.3em] ml-1">Mission Directive</label>
                           <textarea 
                            placeholder="Define the group's biological purpose..." 
                            className="w-full bg-white/5 border border-white/10 rounded-3xl py-5 px-6 text-sm focus:outline-none focus:border-glacier-primary transition-all min-h-[140px] text-white/60 leading-relaxed font-medium placeholder:text-white/10"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                          />
                        </div>
                     </div>
                   </div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>

        <div className="p-8 bg-white/[0.02] shrink-0 border-t border-white/5 flex gap-4">
          {step === 2 && (
            <button 
              onClick={() => setStep(1)}
              className="px-8 py-5 border border-white/10 rounded-[2rem] text-white/40 font-black uppercase tracking-[0.2em] text-[10px] hover:bg-white/5 transition-all"
            >
              Back
            </button>
          )}
          <button 
            onClick={() => step === 1 ? setStep(2) : handleCreate()}
            disabled={step === 1 ? selectedUsers.length === 0 : (!name.trim() || isCreating)}
            className="flex-1 bg-glacier-primary text-black font-black uppercase tracking-[0.2em] text-[10px] py-5 rounded-[2rem] hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-3 shadow-[0_20px_40px_rgba(88,166,255,0.2)]"
          >
            {isCreating ? (
              <RefreshCcw className="w-5 h-5 animate-spin" />
            ) : step === 1 ? (
              <>Initialize Protocols <ArrowRight className="w-4 h-4" /></>
            ) : (
              <>Establish Neural Link <Zap className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-[#0a0a0c] text-white relative overflow-y-auto">
      <div className="absolute inset-0 z-0 opacity-10">
        <DynamicBackground />
      </div>
      <MeteorixLogo size={120} className="mb-8" />
      <h1 className="text-2xl font-sans tracking-widest uppercase font-bold mb-2">Initializing</h1>
      <h2 className="text-xl font-bold color-changing uppercase tracking-[0.2em]">Meteorix Messaging</h2>
    </div>
  );
}

function AuthScreen({ 
  onGoogleLogin, onCompleteProfile, regData, isLoading, error, step, onSystemPurge
}: { 
  onGoogleLogin: () => void,
  onCompleteProfile: () => void,
  regData: {
    firstName: string, setFirstName: (s: string) => void,
    lastName: string, setLastName: (s: string) => void,
    username: string, setUsername: (s: string) => void
  },
  isLoading: boolean, 
  error: string | null,
  step: 'init' | 'profile',
  onSystemPurge: () => void
}) {
  useEffect(() => {
    (window as any)._meteor_purge = onSystemPurge;
    return () => { delete (window as any)._meteor_purge; };
  }, [onSystemPurge]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'profile') onCompleteProfile();
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col md:flex-row bg-[#08080a] relative overflow-hidden font-sans pt-safe pb-safe px-safe">
      {/* Background Layer */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
        <DynamicBackground />
      </div>

      {/* Brand / Info Sidebar */}
      <div className={cn(
        "hidden md:flex relative w-1/2 flex-col justify-between p-12 lg:p-20 z-10 border-r border-white/5",
        step === 'profile' ? "bg-glacier-primary/5" : "bg-white/[0.02]"
      )}>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
             <MeteorixLogo size={48} />
             <h1 className="text-3xl font-black text-white tracking-tighter">METEOR<span className="text-glacier-primary">IX</span></h1>
          </div>
          <p className="text-white/40 font-mono text-xs uppercase tracking-[0.3em] mt-4">Neural Communication Core</p>
        </div>

        <div className="space-y-8">
           <AnimatePresence mode="wait">
             <motion.div 
               key={step}
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: 20 }}
               className="max-w-md"
             >
                <h2 className="text-5xl font-black text-white leading-tight mb-6">
                  {step === 'profile' ? "A new world awaits your spark." : "Reconnect with the matrix signals."}
                </h2>
                <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                     <p className="text-glacier-primary font-bold text-xl font-mono">256-BIT</p>
                     <p className="text-white/30 text-[10px] uppercase font-bold tracking-widest leading-none">Quantum Encryption</p>
                   </div>
                   <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                     <p className="text-glacier-primary font-bold text-xl font-mono">0.4ms</p>
                     <p className="text-white/30 text-[10px] uppercase font-bold tracking-widest leading-none">Neural Latency</p>
                   </div>
                </div>
             </motion.div>
           </AnimatePresence>
        </div>

        <div className="flex items-center gap-6">
           <div className="flex gap-2">
              <Globe className="w-4 h-4 text-white/20" />
              <Database className="w-4 h-4 text-white/20" />
              <ShieldCheck className="w-4 h-4 text-white/20" />
           </div>
           <p className="text-[10px] text-white/20 uppercase font-black tracking-widest">Global Station Status: Operational</p>
        </div>
      </div>

      {/* Auth UI Container */}
      <div className="flex-1 flex flex-col items-center justify-start md:justify-center p-6 md:p-12 z-20 relative overflow-y-auto pt-12 md:pt-12">
        <motion.div 
          key={`form-auth-step-${step}`}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm space-y-8"
        >
          {/* Mobile Only Header */}
          <div className="md:hidden text-center space-y-4 mb-12">
            <MeteorixLogo size={80} className="mx-auto" />
            <h1 className="text-3xl font-black text-white tracking-tighter">METEORIX</h1>
          </div>

          <div className="space-y-1">
             <h3 className="text-2xl font-black text-white tracking-tight">
               {step === 'init' && "Neural Gate"}
               {step === 'profile' && "Complete Identity"}
             </h3>
             <p className="text-white/40 text-xs font-medium tracking-wide">
               {step === 'init' && "Authorize your neural node via Google Matrix."}
               {step === 'profile' && "Finalize your network footprint."}
             </p>
          </div>

          {error && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3"
            >
              <Shield className="w-4 h-4 text-red-400 mt-1 shrink-0" />
              <p className="text-[11px] text-red-200 font-medium leading-relaxed">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 'init' && (
              <div className="space-y-6">
                <button 
                  type="button"
                  onClick={onGoogleLogin}
                  disabled={isLoading}
                  className="w-full bg-white text-black font-black uppercase tracking-widest text-xs py-5 rounded-2xl shadow-[0_10px_30px_rgba(255,255,255,0.1)] hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center justify-center gap-3 border border-white/20"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {isLoading ? "Connecting..." : "Continue with Google"}
                </button>
                <div className="flex flex-col items-center gap-6">
                  <p className="text-[9px] text-white/20 uppercase font-black text-center tracking-widest px-4 leading-relaxed">
                    By engaging, you authorize encryption protocols and storage synchronization with your Google Identity.
                  </p>
                  
                  <button 
                    type="button"
                    onClick={(window as any)._meteor_purge}
                    className="text-[8px] text-white/10 hover:text-red-500/40 uppercase font-black tracking-widest transition-colors flex items-center gap-1.5 group"
                  >
                    <Trash2 className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    System Maintenance: Wipe All Nodes
                  </button>
                </div>
              </div>
            )}

            {step === 'profile' && (
               <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest ml-1">First ID</label>
                      <input 
                        type="text"
                        placeholder="John"
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-4 text-white focus:outline-none focus:border-glacier-primary/50 transition-all text-sm"
                        value={regData.firstName}
                        onChange={(e) => regData.setFirstName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest ml-1">Last ID</label>
                       <input 
                        type="text"
                        placeholder="Doe"
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-4 text-white focus:outline-none focus:border-glacier-primary/50 transition-all text-sm"
                        value={regData.lastName}
                        onChange={(e) => regData.setLastName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] uppercase font-bold text-white/40 tracking-[0.2em] ml-1">Handshake ID (Compulsory @)</label>
                    <div className="relative group">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-glacier-primary font-black">@</div>
                      <input 
                        type="text"
                        placeholder="matrix_user"
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-5 pl-10 pr-4 text-white focus:outline-none focus:border-glacier-primary/50 transition-all font-mono lowercase text-sm"
                        value={regData.username.startsWith('@') ? regData.username.slice(1) : regData.username}
                        onChange={(e) => {
                          const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);
                          regData.setUsername(`@${val}`);
                        }}
                        onFocus={(e) => { if(!regData.username) regData.setUsername('@'); }}
                        required
                      />
                    </div>
                    <p className="text-[9px] text-white/30 uppercase font-bold tracking-widest px-1">Persistence: Your handle will be permanently linked to this node on the server.</p>
                  </div>

                  <div className="space-y-4 pt-4">
                    <button 
                      type="submit"
                      disabled={isLoading || regData.username.length <= 1 || !regData.firstName || !regData.lastName}
                      className="w-full bg-glacier-primary text-black font-black uppercase tracking-widest text-xs py-5 rounded-2xl shadow-[0_10px_30px_rgba(88,166,255,0.2)] hover:scale-[1.03] active:scale-[0.98] transition-all disabled:opacity-30 flex items-center justify-center gap-3"
                    >
                       <ShieldCheck className="w-4 h-4" />
                       {isLoading ? "Writing to Server..." : "Establish Neural Lock"}
                    </button>
                    
                    <button 
                      type="button"
                      onClick={() => auth.signOut()}
                      className="w-full text-[10px] text-white/20 uppercase font-bold tracking-widest hover:text-white transition-colors"
                    >
                      Abort Connection (Logout)
                    </button>
                  </div>
               </div>
            )}
          </form>

          {/* Footer Copy */}
          <div className="text-center">
             <p className="text-[9px] text-white/20 uppercase font-black tracking-widest">
                Meteorix Comm-Link v9.2.0 • Secured by Google Matrix
             </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function ContextMenu({ x, y, type, target, onClose, onSetNickname, currentUser }: { x: number, y: number, type: 'chat' | 'message', target: any, onClose: () => void, onSetNickname?: (target: any) => void, currentUser?: any }) {
  const isDirectChat = type === 'chat' && target.type === 'direct';
  
  const menuItems = type === 'chat' ? [
    ...(!target.isAI ? [{ label: 'Set Nickname', icon: UserPlus, action: 'nickname' }] : []),
    { label: 'Archive chat', icon: Archive, action: 'archive' },
    ...(!target.isAI ? [{ label: 'Mute notifications', icon: VolumeX, action: 'mute' }] : []),
    { label: 'Pin chat', icon: Pin, action: 'pinChat' },
    { label: 'Mark as unread', icon: Inbox, action: 'unread' },
    { label: 'Add to favourites', icon: Heart, action: 'favourite' },
    { label: 'Add to list', icon: List, action: 'list' },
    { label: 'Clear chat', icon: Trash2, danger: true, action: 'clear' },
    ...(!isDirectChat && !target.isAI ? [{ label: 'Exit group', icon: LogOut, danger: true, action: 'exit' }] : []),
  ] : [
    { label: 'Message info', icon: Info, action: 'info' },
    { label: 'Reply', icon: Reply, action: 'reply' },
    { label: 'Copy', icon: Copy, action: 'copy' },
    { label: 'Forward', icon: Forward, action: 'forward' },
    { label: 'Pin', icon: Pin, action: 'pinMsg' },
    { label: 'Ask Matrix AI', icon: Sparkles, action: 'askAi' },
    { label: 'Star', icon: Star, action: 'star' },
    { label: 'Select', icon: ListChecks, action: 'select' },
    { label: 'Delete', icon: Trash2, danger: true, action: 'delete' },
  ];

  const handleAction = async (item: any) => {
    try {
      if (item.action === 'clear' && type === 'chat') {
        const messagesRef = collection(db, 'conversations', target.id, 'messages');
        const snapshot = await getDocs(messagesRef);
        await Promise.all(snapshot.docs.map(doc => deleteDoc(doc.ref)));
      } else if (item.action === 'delete' && type === 'message') {
        await deleteDoc(doc(db, 'conversations', target.conversationId, 'messages', target.id));
      } else if (item.action === 'copy') {
        navigator.clipboard.writeText(target.contentEncrypted || '');
      } else if (item.action === 'nickname' && type === 'chat') {
        onSetNickname?.(target);
      } else if (item.action === 'pinMsg' && type === 'message') {
        await updateDoc(doc(db, 'conversations', target.conversationId, 'messages', target.id), { isPinned: true });
      } else if (item.action === 'star' && type === 'message') {
        await updateDoc(doc(db, 'conversations', target.conversationId, 'messages', target.id), { isStarred: true });
      } else if (item.action === 'archive' && type === 'chat' && currentUser) {
        await updateDoc(doc(db, 'users', currentUser.uid), { [`archivedChats.${target.id}`]: true });
      } else if (item.action === 'askAi' && type === 'message') {
        // Open AI chat and pre-fill with message content
        const participants = [currentUser.uid, 'glacier-ai'].sort();
        const convId = participants.join('_');
        window.dispatchEvent(new CustomEvent('matrix-ask-ai', { detail: { query: target.contentEncrypted, convId } }));
      }
    } catch (err) {
      console.error("Action error:", err);
    }
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      style={{ left: x, top: y }}
      className="fixed z-[100] w-56 bg-glacier-surface/90 backdrop-blur-2xl border border-white/10 rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden p-1.5"
      onClick={e => e.stopPropagation()}
    >
      <div className="space-y-0.5">
        {menuItems.map((item, i) => (
          <React.Fragment key={`ctx-frag-${item.label}-${i}`}>
            {i === 6 && type === 'chat' && <div key={`sep-chat-${i}`} className="h-[1px] bg-white/5 my-1.5 mx-2" />}
            {i === 8 && type === 'message' && <div key={`sep-msg-${i}`} className="h-[1px] bg-white/5 my-1.5 mx-2" />}
            <button
              onClick={() => handleAction(item)}
              key={`ctx-btn-${item.label}-${i}`}
              className={cn(
                "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[11px] font-bold tracking-tight transition-all",
                item.danger ? "text-red-400 hover:bg-red-400/10" : "text-white/70 hover:bg-white/5 hover:text-glacier-primary"
              )}
            >
              <item.icon className="w-4 h-4" />
              <span className="flex-1 text-left">{item.label}</span>
            </button>
          </React.Fragment>
        ))}
      </div>
    </motion.div>
  );
}

function Sidebar({ conversations, onSelect, activeId, currentUser, onOpenSearch, onOpenSettings, onOpenCreateGroup, onViewProfile, onContextMenu, onInstall, deviceInfo, networkStatus }: any) {
  const [tab, setTab] = useState<'chats' | 'users'>('chats');
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (tab === 'users') {
      const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
          const q = query(collection(db, 'users'), limit(20));
          const snap = await getDocs(q);
          const fetchedUsers = snap.docs.map(d => d.data() as ChatUser).filter(u => u.uid !== currentUser.uid);
          
          // Deduplicate if needed (though Firestore IDs should be unique)
          const uniqueMap = new Map();
          fetchedUsers.forEach(u => uniqueMap.set(u.uid, u));
          setUsers(Array.from(uniqueMap.values()));
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingUsers(false);
        }
      };
      fetchUsers();
    }
  }, [tab, currentUser.uid]);

  const filteredConversations = conversations.filter((c: any) => {
    const isArchived = currentUser?.archivedChats?.[c.id];
    const matchesSearch = c.id.toLowerCase().includes(search.toLowerCase()) || 
                         (c.type === 'group' && c.groupName.toLowerCase().includes(search.toLowerCase()));
    return matchesSearch && !isArchived;
  });

  const onStartChat = async (targetUser: ChatUser) => {
     // Check if conversation exists or create new
     // Simplified for demo: use a deterministic ID for direct chats
     const participants = [currentUser.uid, targetUser.uid].sort();
     const convId = participants.join('_');
     
     const convData: Conversation = {
       id: convId,
       participants,
       type: 'direct',
       updatedAt: serverTimestamp()
     };
     
     try {
       await setDoc(doc(db, 'conversations', convId), convData, { merge: true });
       onSelect(convData);
     } catch (err) {
       console.error(err);
     }
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-glacier-bg pt-safe">
      {/* Profile Header */}
      <div 
        className="p-6 flex items-center justify-between border-b border-white/5 bg-glacier-surface/30 shrink-0"
      >
        <div className="flex items-center gap-3 cursor-pointer group" onClick={onOpenSettings}>
          <div className="w-10 h-10 rounded-xl border border-glacier-primary/30 overflow-hidden shrink-0 group-hover:scale-110 transition-all">
            <img src={currentUser.photoURL || `https://picsum.photos/seed/${currentUser.uid}/200`} alt="Avatar" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
          </div>
          <div className="flex-col min-w-0">
            <span className={cn(
               "text-sm font-black text-glacier-text leading-tight truncate tracking-tight uppercase",
               "color-changing"
            )}>{currentUser.displayName}</span>
            <div className="flex items-center gap-1.5 leading-none mt-0.5">
              <span className="text-[9px] text-glacier-primary font-mono font-bold uppercase tracking-tighter animate-pulse drop-shadow-[0_0_5px_rgba(88,166,255,0.5)]">Node Online</span>
            </div>
          </div>
        </div>
           <button onClick={onOpenSearch} className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-glacier-text/40 hover:text-glacier-primary hover:bg-white/10 transition-all">
              <Search className="w-4 h-4" />
           </button>
           <button onClick={onOpenCreateGroup} title="New Group" className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-glacier-text/40 hover:text-glacier-primary hover:bg-white/10 transition-all">
              <Users className="w-4 h-4" />
           </button>
           <button onClick={onOpenSettings} className="p-2.5 bg-white/5 border border-white/5 rounded-xl text-glacier-text/40 hover:text-glacier-primary hover:bg-white/10 transition-all">
              <Settings className="w-4 h-4" />
           </button>
      </div>

      {/* Navigation Tabs */}
      <div className="px-4 pt-4 flex gap-2">
        <button 
          onClick={() => setTab('chats')}
          className={cn(
            "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2",
            tab === 'chats' ? "bg-glacier-primary/10 border-glacier-primary/50 text-glacier-primary shadow-[0_0_15px_rgba(88,166,255,0.1)]" : "bg-white/5 border-white/5 text-glacier-text/40 hover:bg-white/10"
          )}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Signals
        </button>
        <button 
          onClick={() => setTab('users')}
          className={cn(
            "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2",
            tab === 'users' ? "bg-glacier-primary/10 border-glacier-primary/50 text-glacier-primary shadow-[0_0_15px_rgba(88,166,255,0.1)]" : "bg-white/5 border-white/5 text-glacier-text/40 hover:bg-white/10"
          )}
        >
          <Users className="w-3.5 h-3.5" />
          Nodes
        </button>
      </div>

      {/* Search Filter */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-glacier-text/30" />
          <input 
            type="text" 
            placeholder={tab === 'chats' ? "Search signals..." : "Search users..."}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-glacier-primary/50 transition-all font-sans text-glacier-text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className={cn("flex-1 overflow-y-auto custom-scrollbar px-4 pb-6 space-y-2", tab === 'users' ? "pt-4" : "pt-2")}>
        {tab === 'chats' ? (
          filteredConversations.map((conv: any, i: number) => (
            <SidebarChatItem 
              key={`chat-link-${conv.id}-${i}`}
              conv={conv}
              isActive={activeId === conv.id}
              onSelect={onSelect}
              onContextMenu={onContextMenu}
              currentUserData={currentUser}
            />
          ))
        ) : (
          <div className="space-y-2">
             {loadingUsers ? (
                <div className="py-20 flex flex-col items-center gap-4 opacity-30">
                   <Zap className="w-6 h-6 animate-spin text-glacier-primary" />
                   <span className="text-[10px] font-bold uppercase tracking-widest text-glacier-text">Scanning Network...</span>
                </div>
             ) : (
                users.filter(u => u.displayName.toLowerCase().includes(search.toLowerCase())).map((u, i) => (
                  <button
                    key={`user-link-${u.uid}-${i}`}
                    onClick={() => onStartChat(u)}
                    onDoubleClick={() => onViewProfile(u)}
                    className="w-full p-4 rounded-2xl flex items-center gap-4 transition-all group hover:bg-white/5 border border-transparent hover:border-white/5"
                  >
                    <div className="w-12 h-12 rounded-xl border border-white/10 overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                      <img src={u.photoURL || `https://picsum.photos/seed/${u.uid}/200`} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <span className="font-bold text-sm text-glacier-text block truncate uppercase tracking-tighter">{u.displayName}</span>
                      <span className="text-[10px] text-glacier-primary/60 uppercase font-mono tracking-tighter truncate">Node • ID:{u.uid.slice(0, 6)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <button onClick={(e) => { e.stopPropagation(); onViewProfile(u); }} className="p-2 text-white/20 hover:text-glacier-primary transition-all">
                          <ExternalLink className="w-4 h-4" />
                       </button>
                       <Zap className="w-4 h-4 text-glacier-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))
             )}
          </div>
        )}

        {/* Device Diagnostics - Native APK only */}
        {deviceInfo && (
           <div className="mt-8 p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
             <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
                <span className="text-[10px] font-black uppercase text-glacier-primary tracking-widest flex items-center gap-2">
                   <Cpu className="w-3 h-3" />
                   Neural Diagnostics
                </span>
                <div className="flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-glacier-primary animate-pulse" />
                   <span className="text-[8px] text-glacier-text/40 font-mono uppercase">Node Active</span>
                </div>
             </div>
             
             <div className="grid grid-cols-2 gap-3 pb-2">
                <div className="flex items-center gap-2">
                   <Battery className={cn("w-3.5 h-3.5", (deviceInfo.batteryLevel || 1) < 0.2 ? "text-flare" : "text-glacier-primary/60")} />
                   <div className="flex flex-col">
                      <span className="text-[8px] text-glacier-text/30 font-black uppercase tracking-tighter">Power Cell</span>
                      <span className="text-[10px] text-glacier-text/70 font-mono font-bold leading-none">{Math.round((deviceInfo.batteryLevel || 0) * 100)}%</span>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                   <Wifi className={cn("w-3.5 h-3.5", networkStatus?.connected ? "text-glacier-primary/60" : "text-flare")} />
                   <div className="flex flex-col">
                      <span className="text-[8px] text-glacier-text/30 font-black uppercase tracking-tighter">Neural Link</span>
                      <span className="text-[10px] text-glacier-text/70 font-mono font-bold leading-none">{networkStatus?.connectionType || 'LOCKED'}</span>
                   </div>
                </div>
             </div>
             
             <div className="bg-glacier-surface/50 p-2 rounded-lg border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <Database className="w-3 h-3 text-glacier-primary/40" />
                   <span className="text-[9px] text-glacier-text/30 font-mono uppercase truncate max-w-[100px]">{deviceInfo.model || 'Unknown Node'}</span>
                </div>
                <span className="text-[8px] font-black text-glacier-primary/60 uppercase">OS {deviceInfo.osVersion}</span>
             </div>
           </div>
        )}
      </div>
    </div>
  );
}

function SettingsModal({ onClose, userData, currentUser, onUpdate, onLogout, onSystemPurge, currentTheme, onThemeChange }: any) {
  const [activeTab, setActiveTab] = useState<'identity' | 'visuals' | 'prefs' | 'security' | 'experimental'>('identity');
  const [formData, setFormData] = useState<Partial<ChatUser>>({
    displayName: userData?.displayName || '',
    username: userData?.username || '',
    status: userData?.status || '',
    bio: userData?.bio || '',
    accentColor: userData?.accentColor || 'glacier',
    bubbleStyle: userData?.bubbleStyle || 'rounded',
    fontFamily: userData?.fontFamily || 'sans',
    bgAnimation: userData?.bgAnimation || 'dynamic',
    transparency: userData?.transparency || 10,
    compactMode: userData?.compactMode ?? false,
    showBio: userData?.showBio ?? true,
    showLastSeen: userData?.showLastSeen ?? true,
    messageFont: userData?.messageFont || 14,
    blurIntensity: userData?.blurIntensity || 30,
    avatarShape: userData?.avatarShape || 'squircle',
    encryptionBadge: userData?.encryptionBadge ?? true,
    typingIndicator: userData?.typingIndicator ?? true,
    activeStatus: userData?.activeStatus ?? true,
    soundEnabled: userData?.soundEnabled ?? true,
    themeMode: userData?.themeMode || currentTheme
  });
  
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdate = (updates: Partial<ChatUser>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    
    setUploading(true);
    setLocalError(null);
    try {
      const storageRef = ref(storage, `avatars/${currentUser.uid}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      handleUpdate({ photoURL: downloadURL });
    } catch (err: any) {
      setLocalError(`Upload Error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setLocalError(null);
    try {
      // Check username uniqueness if it changed
      if (formData.username && formData.username !== userData?.username) {
        const q = query(collection(db, 'users'), where('username', '==', formData.username));
        const snap = await getDocs(q);
        const alreadyExists = snap.docs.some(doc => doc.id !== currentUser.uid);
        if (alreadyExists) {
           setLocalError("This username is already preserved");
           setSaving(false);
           return;
        }
      }

      await onUpdate(formData);
      onClose();
    } catch (err: any) {
      setLocalError(`Save Failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const TabButton = ({ id, label, icon: Icon }: any) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-xs font-bold uppercase tracking-widest",
        activeTab === id ? "bg-glacier-primary text-black shadow-lg" : "text-glacier-text/40 hover:bg-white/5"
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="hidden md:inline truncate">{label}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-xl">
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleImageUpload} 
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-glacier-surface w-full h-full md:h-[85vh] md:max-w-4xl md:rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/5 flex flex-col"
      >
        <div className="p-6 md:p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02] shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-glacier-primary/10 rounded-2xl flex items-center justify-center border border-glacier-primary/20">
              <Zap className="text-glacier-primary w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-sans font-black tracking-tighter text-glacier-text uppercase">Matrix Configuration</h2>
              <p className="text-[10px] text-glacier-primary/60 font-mono font-bold tracking-widest uppercase">Node ID: {currentUser?.uid.slice(0, 16)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 text-white/20 hover:text-glacier-primary hover:bg-white/5 rounded-2xl transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Nav */}
          <div className="w-20 md:w-64 border-r border-white/5 p-4 flex flex-col gap-2 bg-black/20 overflow-y-auto">
            <TabButton id="identity" label="Neural Identity" icon={UserPlus} />
            <TabButton id="visuals" label="Visual Matrix" icon={Sparkles} />
            <TabButton id="prefs" label="Preferences" icon={Bell} />
            <TabButton id="security" label="Vault Security" icon={ShieldCheck} />
            <TabButton id="experimental" label="Danger Zone" icon={Database} />
            
            <div className="mt-auto px-4 py-6">
              <button 
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-xs font-bold uppercase tracking-widest text-red-400 hover:bg-red-400/10"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span className="hidden md:inline truncate">Sign Out</span>
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 custom-scrollbar bg-glacier-bg/50">
            {activeTab === 'identity' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="relative group shrink-0">
                    <img 
                      src={formData.photoURL || currentUser?.photoURL || `https://picsum.photos/seed/${currentUser?.uid}/200`} 
                      alt="" 
                      className={cn(
                        "w-32 h-32 border-4 border-glacier-primary/20 object-cover shadow-2xl transition-all",
                        formData.avatarShape === 'circle' ? "rounded-full" : 
                        formData.avatarShape === 'square' ? "rounded-2xl" : "rounded-[2.5rem]"
                      )} 
                      referrerPolicy="no-referrer"
                    />
                    <div 
                      onClick={() => !uploading && fileInputRef.current?.click()}
                      className={cn(
                        "absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-inherit flex items-center justify-center cursor-pointer disabled:opacity-50",
                        uploading && "opacity-100"
                      )}
                    >
                       {uploading ? (
                         <div className="w-6 h-6 border-2 border-glacier-primary border-t-transparent rounded-full animate-spin" />
                       ) : (
                         <ImageIcon className="text-white w-6 h-6" />
                       )}
                    </div>
                  </div>
                  <div className="flex-1 w-full space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] text-glacier-primary uppercase font-black tracking-[0.2em] ml-1">Display Name</label>
                       <input 
                         type="text" 
                         value={formData.displayName} 
                         onChange={e => handleUpdate({ displayName: e.target.value })}
                         className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-sm focus:outline-none focus:border-glacier-primary transition-all text-glacier-text font-bold"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] text-glacier-primary uppercase font-black tracking-[0.2em] ml-1">Status Phrase</label>
                       <input 
                         type="text" 
                         value={formData.status} 
                         onChange={e => handleUpdate({ status: e.target.value })}
                         className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-sm focus:outline-none focus:border-glacier-primary transition-all text-glacier-text italic font-medium"
                         placeholder="Synchronizing..."
                       />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] text-glacier-primary uppercase font-black tracking-[0.2em] ml-1">Neural Bio (Public)</label>
                   <textarea 
                     value={formData.bio} 
                     onChange={e => handleUpdate({ bio: e.target.value })}
                     className="w-full bg-white/5 border border-white/10 rounded-[2rem] py-5 px-6 text-sm focus:outline-none focus:border-glacier-primary transition-all text-glacier-text min-h-[120px] leading-relaxed"
                     placeholder="Tell the matrix about your node..."
                   />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40">Avatar Shape</h4>
                      <div className="flex gap-3">
                         {(['circle', 'squircle', 'square'] as const).map(s => (
                           <button 
                             key={s}
                             onClick={() => handleUpdate({ avatarShape: s })}
                             className={cn(
                               "w-10 h-10 border-2 transition-all",
                               s === 'circle' ? "rounded-full" : s === 'square' ? "rounded-lg" : "rounded-xl",
                               formData.avatarShape === s ? "border-glacier-primary bg-glacier-primary/20 scale-110 shadow-lg" : "border-white/10 bg-white/5 hover:border-white/30"
                             )}
                           />
                         ))}
                      </div>
                   </div>

                   <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40">Neural Handle (@)</h4>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-glacier-primary font-bold">@</span>
                        <input 
                          type="text" 
                          value={formData.username ? (formData.username.startsWith('@') ? formData.username.slice(1) : formData.username) : ''} 
                          onChange={e => handleUpdate({ username: `@${e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')}` })}
                          className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-xs focus:outline-none focus:border-glacier-primary text-glacier-text font-mono"
                          placeholder="handle"
                        />
                      </div>
                   </div>

                   <div className="p-6 rounded-3xl bg-white/5 border border-white/10 flex justify-between items-center">
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40">Display Bio</h4>
                        <p className="text-[8px] opacity-40">Allow others to view your neural bio</p>
                      </div>
                      <button 
                        onClick={() => handleUpdate({ showBio: !formData.showBio })}
                        className={cn("w-12 h-6 rounded-full relative transition-all", formData.showBio ? "bg-glacier-primary" : "bg-white/10")}
                      >
                        <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md", formData.showBio ? "right-1" : "left-1")} />
                      </button>
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'visuals' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
                <div className="space-y-6">
                  <h3 className="text-[11px] font-black text-glacier-primary uppercase tracking-[0.3em]">Neural Resonance Matrix (100+ Themes)</h3>
                  <div className="flex flex-wrap gap-4 items-center">
                    {(['glacier', 'nova', 'flare', 'emerald', 'amber', 'rose'] as const).map(c => {
                       const colors: any = { glacier: '#58a6ff', nova: '#a855f7', flare: '#ef4444', emerald: '#10b981', amber: '#f59e0b', rose: '#f43f5e' };
                       return (
                         <button 
                           key={c}
                           onClick={() => handleUpdate({ accentColor: c })}
                           className={cn(
                             "w-10 h-10 rounded-xl transition-all border-4 flex items-center justify-center",
                             formData.accentColor === c ? "scale-110 border-white shadow-xl" : "border-transparent opacity-60 hover:opacity-100"
                           )}
                           style={{ backgroundColor: colors[c] }}
                         >
                           {formData.accentColor === c && <Zap className="w-4 h-4 text-white" />}
                         </button>
                       );
                    })}
                    <div className="h-10 w-[2px] bg-white/10 mx-2" />
                    <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/10">
                       <input 
                         type="color"
                         value={formData.accentColor?.startsWith('#') ? formData.accentColor : '#58a6ff'}
                         onChange={(e) => handleUpdate({ accentColor: e.target.value })}
                         className="w-8 h-8 rounded-lg bg-transparent border-none cursor-pointer"
                       />
                       <span className="text-[9px] font-black uppercase text-white/40 pr-2">Custom Node Flux</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-[11px] font-black text-glacier-primary uppercase tracking-[0.3em]">Typography Link</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(['sans', 'mono', 'serif', 'grotesk'] as const).map(f => (
                      <button 
                         key={f}
                         onClick={() => handleUpdate({ fontFamily: f })}
                         className={cn(
                           "p-4 rounded-2xl border transition-all text-center space-y-1",
                           formData.fontFamily === f ? "border-glacier-primary bg-glacier-primary/10 shadow-lg" : "border-white/5 bg-white/5"
                         )}
                      >
                         <p className={cn("text-xl font-bold text-white", f === 'sans' ? 'font-sans' : f === 'mono' ? 'font-mono' : f === 'serif' ? 'font-serif' : 'font-sans italic')}>Aa</p>
                         <p className="text-[9px] uppercase font-black opacity-40">{f}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <h3 className="text-[11px] font-black text-glacier-primary uppercase tracking-[0.3em]">Matrix Flux</h3>
                      <div className="grid grid-cols-2 gap-3">
                         {(['dynamic', 'static', 'flow', 'glitch'] as const).map(a => (
                           <button 
                             key={a}
                             onClick={() => handleUpdate({ bgAnimation: a })}
                             className={cn(
                               "p-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all",
                               formData.bgAnimation === a ? "bg-glacier-primary/20 border-glacier-primary text-glacier-primary shadow-lg" : "bg-white/5 border-white/5 text-white/40"
                             )}
                           >
                             {a}
                           </button>
                         ))}
                      </div>
                   </div>
                   <div className="space-y-4">
                      <h3 className="text-[11px] font-black text-glacier-primary uppercase tracking-[0.3em]">Theme Protocol</h3>
                      <div className="grid grid-cols-2 gap-3">
                         {(['dark', 'light', 'oled', 'matrix', 'meteoroid', 'nebula'] as const).map(t => (
                           <button 
                             key={t}
                             onClick={() => {
                               handleUpdate({ themeMode: t });
                               onThemeChange(t);
                             }}
                             className={cn(
                               "p-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all",
                               formData.themeMode === t ? "bg-glacier-primary/20 border-glacier-primary text-glacier-primary shadow-lg" : "bg-white/5 border-white/5 text-white/40"
                             )}
                           >
                             {t}
                           </button>
                         ))}
                      </div>
                   </div>
                </div>
                
                <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 space-y-10">
                   <div className="space-y-4">
                      <div className="flex justify-between">
                         <label className="text-[11px] font-black text-glacier-primary uppercase tracking-[0.3em]">Node Transparency</label>
                         <span className="text-xs font-mono text-glacier-primary font-bold">{formData.transparency}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="100" step="5"
                        value={formData.transparency} 
                        onChange={e => handleUpdate({ transparency: parseInt(e.target.value) })}
                        className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-glacier-primary"
                      />
                   </div>
                   <div className="space-y-4">
                      <div className="flex justify-between">
                         <label className="text-[11px] font-black text-glacier-primary uppercase tracking-[0.3em]">Signal Blur</label>
                         <span className="text-xs font-mono text-glacier-primary font-bold">{formData.blurIntensity}px</span>
                      </div>
                      <input 
                        type="range" min="0" max="100" step="5"
                        value={formData.blurIntensity} 
                        onChange={e => handleUpdate({ blurIntensity: parseInt(e.target.value) })}
                        className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-glacier-primary"
                      />
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'prefs' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {[
                     { id: 'notifications', label: 'Push Signals', sub: 'Instant neuro-feedback on new links', icon: Bell },
                     { id: 'readReceipts', label: 'Transmission Status', sub: 'Broadcast when you ingest a signal', icon: Eye },
                     { id: 'typingIndicator', label: 'Processing Pulse', sub: 'Show others when you are crafting logic', icon: RefreshCcw },
                     { id: 'soundEnabled', label: 'Audio Resonance', sub: 'Acoustic cues for matrix events', icon: Volume2 },
                     { id: 'compactMode', label: 'Information Density', sub: 'Compress signal viewing area', icon: Database },
                     { id: 'encryptionBadge', label: 'Shield Visibility', sub: 'Display E2EE badges on each node', icon: ShieldCheck },
                     { id: 'activeStatus', label: 'Matrix Presence', sub: 'Show your connection integrity', icon: Globe },
                     { id: 'showLastSeen', label: 'Time Flux', sub: 'Display last temporal sync', icon: Clock },
                   ].map(p => (
                     <div key={p.id} className="p-5 rounded-3xl bg-white/5 border border-white/5 flex items-center justify-between hover:bg-white/[0.08] transition-all">
                        <div className="flex items-center gap-4">
                           <div className="p-3 bg-glacier-primary/5 rounded-2xl">
                             <p.icon className="w-5 h-5 text-glacier-primary" />
                           </div>
                           <div>
                              <p className="text-xs font-black text-glacier-text uppercase tracking-tight">{p.label}</p>
                              <p className="text-[10px] text-white/30 uppercase font-bold tracking-tighter">{p.sub}</p>
                           </div>
                        </div>
                        <button 
                          onClick={() => handleUpdate({ [p.id]: !(formData as any)[p.id] })}
                          className={cn("w-10 h-5 rounded-full relative transition-all", (formData as any)[p.id] ? "bg-glacier-primary" : "bg-white/10")}
                        >
                          <div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full transition-all shadow-md", (formData as any)[p.id] ? "right-1" : "left-1")} />
                        </button>
                     </div>
                   ))}
                </div>

                <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 space-y-6">
                   <div className="flex justify-between items-center">
                      <label className="text-[11px] font-black text-glacier-primary uppercase tracking-[0.3em]">Message Scaling</label>
                      <span className="text-sm font-mono text-glacier-primary font-bold">{formData.messageFont}pt</span>
                   </div>
                   <input 
                     type="range" min="12" max="22" step="1"
                     value={formData.messageFont} 
                     onChange={e => handleUpdate({ messageFont: parseInt(e.target.value) })}
                     className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-glacier-primary"
                   />
                   <div className="flex justify-between px-1">
                      <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Minimal</span>
                      <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Maximal</span>
                   </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                 <div className="p-10 rounded-[3rem] bg-white/5 border border-white/5 text-center space-y-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-glacier-primary/5 blur-[80px] -z-10" />
                    <ShieldCheck className="w-20 h-20 text-glacier-primary mx-auto filter drop-shadow-[0_0_20px_rgba(88,166,255,0.4)]" />
                    <div className="space-y-2">
                       <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Node Lockdown Active</h3>
                       <p className="text-[10px] text-glacier-primary uppercase font-bold tracking-[0.2em] max-w-sm mx-auto opacity-60">Your private keys never leave this device. Transmission is strictly peer-to-peer within the Google Matrix.</p>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <h3 className="text-[11px] font-black text-glacier-primary uppercase tracking-[0.3em]">Public Node ID (SPKI)</h3>
                    <div className="relative">
                      <pre className="p-8 rounded-[2.5rem] bg-glacier-bg border border-white/5 font-mono text-[10px] break-all text-glacier-primary/60 leading-relaxed max-h-48 overflow-y-auto custom-scrollbar">
                        {userData?.publicKey || "GENERATING_NEW_SIGNALS..."}
                      </pre>
                      <button className="absolute top-6 right-6 p-2 bg-white/5 rounded-xl text-white/40 hover:text-white transition-all">
                        <Database className="w-4 h-4" />
                      </button>
                    </div>
                 </div>
              </motion.div>
            )}

            {activeTab === 'experimental' && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                 <div className="p-10 rounded-[3.5rem] bg-red-500/5 border border-red-500/10 space-y-6">
                    <div className="flex items-center gap-4 text-red-500">
                       <Trash2 className="w-8 h-8" />
                       <h3 className="text-2xl font-black uppercase tracking-tighter">System Overwrite</h3>
                    </div>
                    <p className="text-xs font-bold text-red-100/40 leading-relaxed uppercase tracking-widest">
                       Triggering a Node Purge will permanently remove your identity link, all message logs, and security keys from the Meteorix network. This action cannot be undone by admin override.
                    </p>
                    <button 
                      onClick={onSystemPurge}
                      className="w-full py-5 rounded-3xl bg-red-500 text-white font-black uppercase tracking-[0.2em] text-[10px] hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_15px_40px_rgba(239,68,68,0.3)]"
                    >
                      EXECUTE TOTAL SYSTEM PURGE
                    </button>
                 </div>
              </motion.div>
            )}
          </div>
        </div>

        <div className="p-6 md:p-8 border-t border-white/5 bg-white/[0.02] flex flex-col md:flex-row gap-4 shrink-0">
          {localError && (
             <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest animate-bounce z-[60]">
                {localError}
             </div>
          )}
          <button 
            onClick={onClose}
            className="flex-1 py-5 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all text-glacier-text underline underline-offset-8 decoration-white/10"
          >
            Abort Synchro
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-5 bg-glacier-primary text-black hover:scale-[1.03] active:scale-[0.97] rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all shadow-[0_15px_50px_rgba(88,166,255,0.4)] relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            <span className="relative z-10">{saving ? "SYNCHRONIZING..." : "Engage Protocol"}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function UserProfileModal({ user, onClose, onStartChat, isSaved, onToggleContact }: { user: ChatUser, onClose: () => void, onStartChat: (u: ChatUser) => void, isSaved: boolean, onToggleContact: (uid: string) => void }) {
  const isAI = user.uid === 'glacier-ai';
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm bg-glacier-bg rounded-[3.5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.9)] border border-white/5 relative"
      >
        {/* Cover Area with stylized background */}
        <div className="h-40 bg-gradient-to-br from-glacier-primary/10 via-glacier-primary/5 to-transparent relative overflow-hidden">
           <div className="absolute inset-0 opacity-10">
              <DynamicBackground />
           </div>
           <div className="absolute right-8 top-8">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md">
                 <ShieldCheck className="w-6 h-6 text-glacier-primary/40" />
              </div>
           </div>
        </div>
        
        {/* Profile Info */}
        <div className="px-8 pb-10 -mt-20 relative">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="relative group">
              <img 
                src={isAI ? '/glacier_ai.png' : (user.photoURL || `https://picsum.photos/seed/${user.uid}/400`)} 
                alt="" 
                className={cn(
                  "w-32 h-32 border-[6px] border-glacier-bg object-cover shadow-2xl transition-all duration-700",
                  isAI ? "rounded-[3rem]" : (user.avatarShape === 'circle' ? "rounded-full" : 
                  user.avatarShape === 'square' ? "rounded-[2.5rem]" : "rounded-[3rem]")
                )}
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-2 right-2 w-8 h-8 bg-glacier-bg rounded-full flex items-center justify-center shadow-xl">
                 <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="space-y-0">
                 <div className="flex items-center justify-center gap-2">
                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-tight">{isAI ? 'Glacier AI' : user.displayName}</h2>
                    {isAI && <ShieldCheck className="text-glacier-primary w-5 h-5 filter drop-shadow-[0_0_5px_rgba(88,166,255,0.8)]" />}
                 </div>
                 <p className="text-glacier-primary font-mono font-black text-[10px] tracking-[0.4em] uppercase opacity-70 mb-2">{isAI ? '@glacier' : user.username}</p>
              </div>
              
              {(isAI || user.status) && (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-glacier-primary/5 border border-glacier-primary/10 rounded-full">
                   <div className="w-1.5 h-1.5 bg-glacier-primary rounded-full animate-ping" />
                   <p className="text-[10px] text-glacier-primary font-black uppercase tracking-widest italic">{isAI ? 'ONLINE_ACTIVE' : user.status}</p>
                </div>
              )}
            </div>

            <div className="w-full h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

            {(isAI || user.bio) ? (
              <div className="space-y-4 w-full">
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] text-glacier-primary text-center">Neural Objective</p>
                 <p className="text-[13px] text-white/50 leading-relaxed font-medium px-8 text-center bg-white/[0.02] py-6 rounded-[2.5rem] border border-white/5 shadow-inner">
                   {isAI ? 'SENTIENT_AI_CORE. Sourced from the Meteorix Neural Matrix. System Intelligence Level: Omega.' : user.bio}
                 </p>
              </div>
            ) : (
              <p className="text-[10px] text-white/10 italic uppercase font-black tracking-[0.2em] py-4">Neural bio not configured.</p>
            )}

            <div className="w-full flex items-center justify-center gap-8 py-2">
               <div className="text-center">
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Signal Strength</p>
                  <p className="text-xs font-mono font-bold text-glacier-primary tracking-widest">STABLE_99%</p>
               </div>
               <div className="w-px h-8 bg-white/5" />
               <div className="text-center">
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Authorization</p>
                  <p className="text-xs font-mono font-bold text-glacier-primary tracking-widest uppercase">Operator</p>
               </div>
            </div>

            <div className="w-full h-px bg-white/5" />

            <div className="flex flex-col items-center gap-1 opacity-40">
               <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white">Registry Temporal Sync</span>
               <span className="text-[10px] font-mono text-glacier-primary">
                 {user.lastSeen ? format(user.lastSeen.toDate(), 'MM.dd.yyyy HH:mm') : 'INITIALIZED_GHOST'}
               </span>
            </div>

            <div className="w-full pt-4 space-y-4">
               <div className="flex gap-3">
                  <button 
                    onClick={() => onStartChat(user)}
                    className="flex-[2] py-5 bg-glacier-primary text-black font-black uppercase text-[10px] tracking-[0.2em] rounded-[2rem] shadow-[0_15px_40px_rgba(88,166,255,0.3)] hover:scale-[1.05] active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Initialize
                  </button>

                  <button 
                    onClick={() => onToggleContact(user.uid)}
                    className={cn(
                      "flex-1 py-5 font-black uppercase text-[10px] tracking-[0.2em] rounded-[2rem] border transition-all flex items-center justify-center gap-2",
                      isSaved 
                        ? "bg-white/10 border-white/10 text-white/60 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-500" 
                        : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"
                    )}
                  >
                    {isSaved ? <Database className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  </button>
               </div>
               
               <button 
                 onClick={onClose}
                 className="w-full py-5 bg-white/5 text-white/20 font-black uppercase text-[9px] tracking-[0.4em] rounded-[2rem] border border-white/5 hover:bg-white/10 transition-all font-mono"
               >
                 Close Data Stream
               </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function GroupProfileModal({ chat, onClose, currentUser }: { chat: Conversation, onClose: () => void, currentUser: any }) {
  const [activeTab, setActiveTab] = useState<'info' | 'members' | 'requests'>('info');
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(chat.groupName || '');
  const [description, setDescription] = useState(chat.groupDescription || '');
  const [rules, setRules] = useState(chat.groupRules || '');
  const [saving, setSaving] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const isAdmin = chat.adminId === currentUser.uid;

  useEffect(() => {
    if (isAdmin && activeTab === 'requests') {
      const q = query(
        collection(db, 'join_requests'), 
        where('conversationId', '==', chat.id),
        where('status', '==', 'pending')
      );
      return onSnapshot(q, (snap) => {
        setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    }
  }, [isAdmin, activeTab, chat.id]);

  const handleUpdate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'conversations', chat.id), {
        groupName: name,
        groupDescription: description,
        groupRules: rules,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setIsEditing(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `conversations/${chat.id}`);
    } finally {
      setSaving(false);
    }
  };

  const handleHandleRequest = async (reqId: string, userId: string, approved: boolean) => {
    try {
      if (approved) {
        // Add to participants
        await setDoc(doc(db, 'conversations', chat.id), {
          participants: Array.from(new Set([...(chat.participants || []), userId])),
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
      // Update request status or delete it
      await setDoc(doc(db, 'join_requests', reqId), { status: approved ? 'accepted' : 'rejected' }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `join_requests/${reqId}`);
    }
  };

  const generateInviteLink = async () => {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    await setDoc(doc(db, 'conversations', chat.id), { inviteCode: code }, { merge: true });
  };

  const promoteToAdmin = async (userId: string) => {
    if (!window.confirm("Promote this member to Master Admin? This cannot be undone easily.")) return;
    await setDoc(doc(db, 'conversations', chat.id), { adminId: userId }, { merge: true });
  };

  const removeMember = async (userId: string) => {
    if (userId === currentUser.uid) return;
    if (!window.confirm("Sever connection for this node?")) return;
    await setDoc(doc(db, 'conversations', chat.id), {
      participants: chat.participants?.filter((uid: string) => uid !== userId)
    }, { merge: true });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm bg-glacier-bg rounded-[3.5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.9)] border border-white/5 relative flex flex-col max-h-[85vh]"
      >
        {/* Cover Area */}
        <div className="h-32 shrink-0 bg-gradient-to-br from-glacier-primary/10 via-glacier-primary/5 to-transparent relative overflow-hidden">
           <div className="absolute inset-0 opacity-10">
              <DynamicBackground />
           </div>
           <div className="absolute right-8 top-6">
              <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md">
                 <Users className="w-5 h-5 text-glacier-primary/40" />
              </div>
           </div>
        </div>
        
        {/* Profile Avatar & Tabs */}
        <div className="px-8 -mt-12 relative z-10 flex flex-col items-center">
            <div className="relative group mb-4">
              <div 
                className="w-24 h-24 border-[4px] border-glacier-bg rounded-[2rem] bg-white/5 object-cover shadow-2xl flex items-center justify-center bg-center bg-cover"
                style={{ backgroundImage: chat.groupAvatar ? `url(${chat.groupAvatar})` : 'none' }}
              >
                {!chat.groupAvatar && <Users className="w-8 h-8 text-white/20" />}
              </div>
            </div>

            <div className="flex gap-4 mb-6">
                {['info', 'members', 'requests'].map((tab: any) => (
                    <button 
                        key={tab} 
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] transition-all",
                            activeTab === tab ? "bg-glacier-primary text-black" : "text-white/40 hover:text-white"
                        )}
                    >
                        {tab}
                    </button>
                ))}
            </div>
        </div>

        {/* Scrollable Content */}
        <div className="px-8 pb-8 flex-1 overflow-y-auto custom-scrollbar">
            {activeTab === 'info' && (
                <div className="space-y-6">
                    {isEditing ? (
                        <div className="space-y-4 text-left">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-glacier-primary tracking-[0.3em] ml-1">Group Designation</label>
                                <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:border-glacier-primary outline-none" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-glacier-primary tracking-[0.3em] ml-1">Mission Directive</label>
                                <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:border-glacier-primary outline-none min-h-[80px]" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-glacier-primary tracking-[0.3em] ml-1">Neural Protocols</label>
                                <textarea value={rules} onChange={e => setRules(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-[10px] font-mono text-white/60 focus:border-glacier-primary outline-none min-h-[80px]" />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 text-center">
                            <div className="space-y-1">
                                <h2 className="text-xl font-black text-white tracking-tighter uppercase leading-tight">{chat.groupName}</h2>
                                <p className="text-glacier-primary font-mono font-black text-[9px] tracking-[0.4em] uppercase opacity-70">ID_{chat.id.slice(0, 8)}</p>
                            </div>
                            
                            <div className="space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-glacier-primary">Mission Directive</p>
                                <p className="text-xs text-white/50 leading-relaxed font-medium bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                                    {chat.groupDescription || "No established directive."}
                                </p>
                            </div>

                            {chat.groupRules && (
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-glacier-primary">Neural Protocols</p>
                                    <div className="text-[10px] font-mono text-white/40 text-left bg-black/20 p-4 rounded-2xl border border-white/5 whitespace-pre-wrap leading-relaxed">
                                        {chat.groupRules}
                                    </div>
                                </div>
                            )}

                            {isAdmin && (
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-glacier-primary">Invite System</p>
                                    {chat.inviteCode ? (
                                        <div className="flex items-center gap-2 bg-white/5 p-3 rounded-2xl border border-white/10">
                                            <span className="flex-1 font-mono text-xs text-white font-bold">{chat.inviteCode}</span>
                                            <button onClick={() => {
                                                navigator.clipboard.writeText(chat.inviteCode!);
                                                alert("Code Copied!");
                                            }} className="text-glacier-primary hover:text-white"><Copy className="w-4 h-4" /></button>
                                        </div>
                                    ) : (
                                        <button onClick={generateInviteLink} className="w-full py-3 bg-white/5 text-white/40 text-[9px] font-bold uppercase rounded-2xl border border-dashed border-white/20">Generate Invite Key</button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'members' && (
                <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-glacier-primary text-center">Neural Nodes</p>
                    <div className="space-y-2">
                        {chat.participants?.map((uid: string) => (
                            <div key={uid} className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5 group">
                                <MemberAvatar userId={uid} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-white truncate"><ResolvedName userId={uid} fallback="Unknown Node" /></p>
                                    <p className="text-[8px] font-mono text-white/20 uppercase">{uid === chat.adminId ? 'Master Admin' : 'Agent'}</p>
                                </div>
                                {isAdmin && uid !== currentUser.uid && (
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => promoteToAdmin(uid)} className="p-2 hover:bg-glacier-primary/10 rounded-xl text-glacier-primary" title="Promote"><ShieldCheck className="w-4 h-4" /></button>
                                        <button onClick={() => removeMember(uid)} className="p-2 hover:bg-red-500/10 rounded-xl text-red-400" title="Remove"><LogOut className="w-4 h-4" /></button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'requests' && (
                <div className="space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-glacier-primary text-center">Pending Linkages</p>
                    {requests.length === 0 ? (
                        <div className="text-center py-10 opacity-20 font-mono text-[10px]">NO_PENDING_TRAFFIC</div>
                    ) : (
                        <div className="space-y-2">
                            {requests.map(req => (
                                <div key={req.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                                    <MemberAvatar userId={req.userId} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-white truncate"><ResolvedName userId={req.userId} fallback="Unknown" /></p>
                                        <p className="text-[8px] font-mono text-white/20 uppercase">Request Signature</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleHandleRequest(req.id, req.userId, true)} className="p-2 bg-glacier-primary/10 text-glacier-primary rounded-xl"><Check className="w-4 h-4" /></button>
                                        <button onClick={() => handleHandleRequest(req.id, req.userId, false)} className="p-2 bg-red-500/10 text-red-400 rounded-xl"><X className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 shrink-0 space-y-3 bg-white/[0.02] border-t border-white/5">
            {activeTab === 'info' && isAdmin && (
                <button 
                  onClick={() => isEditing ? handleUpdate() : setIsEditing(true)}
                  disabled={saving}
                  className="w-full py-4 bg-glacier-primary text-black font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl shadow-xl flex items-center justify-center gap-2"
                >
                  {isEditing ? (saving ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />) : <Settings2 className="w-4 h-4" />}
                  {isEditing ? "Synchronize" : "Edit Directives"}
                </button>
            )}
            <button 
              onClick={onClose}
              className="w-full py-4 bg-white/5 text-white/40 font-black uppercase text-[9px] tracking-[0.4em] rounded-2xl border border-white/5 hover:bg-white/10 transition-all font-mono"
            >
              Terminate View
            </button>
        </div>
      </motion.div>
    </div>
  );
}

function UserSearchModal({ onClose, onStartChat, currentUser }: any) {
  const [activeSearch, setActiveSearch] = useState<'users' | 'clusters'>('users');
  const [queryStr, setQueryStr] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joining, setJoining] = useState(false);

  const searchItems = async () => {
    if (!queryStr.trim()) return;
    setLoading(true);
    try {
      if (activeSearch === 'users') {
        const sanitized = queryStr.startsWith('@') ? queryStr.toLowerCase() : `@${queryStr.toLowerCase()}`;
        const q = query(collection(db, 'users'), where('username', '>=', sanitized), where('username', '<=', sanitized + '\uf8ff'), limit(10));
        const snap = await getDocs(q);
        setResults(snap.docs.map(d => d.data()).filter((u: any) => u.uid !== currentUser.uid));
      } else {
        const q = query(collection(db, 'conversations'), where('type', '==', 'group'), where('groupName', '>=', queryStr), where('groupName', '<=', queryStr + '\uf8ff'), limit(10));
        const snap = await getDocs(q);
        setResults(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, activeSearch === 'users' ? 'users' : 'conversations');
    } finally {
      setLoading(false);
    }
  };

  const joinByCode = async () => {
    if (!inviteCode.trim()) return;
    setJoining(true);
    try {
      const q = query(collection(db, 'conversations'), where('type', '==', 'group'), where('inviteCode', '==', inviteCode.trim().toUpperCase()));
      const snap = await getDocs(q);
      if (snap.empty) {
        alert("Invalid or expired neural link.");
        return;
      }
      const chat = snap.docs[0].data();
      const chatId = snap.docs[0].id;
      
      if (chat.participants.includes(currentUser.uid)) {
        alert("You are already part of this cluster.");
        return;
      }

      const reqQ = query(collection(db, 'join_requests'), where('conversationId', '==', chatId), where('userId', '==', currentUser.uid), where('status', '==', 'pending'));
      const reqSnap = await getDocs(reqQ);
      if (!reqSnap.empty) {
        alert("A request is already propagating through the matrix.");
        return;
      }

      await addDoc(collection(db, 'join_requests'), {
        conversationId: chatId,
        userId: currentUser.uid,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      alert("Join request broadcasted. Wait for administrative approval.");
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'join_requests');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm bg-glacier-bg rounded-[3.5rem] overflow-hidden shadow-2xl border border-white/5 flex flex-col max-h-[85vh]"
      >
        <div className="p-8 shrink-0 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black text-white tracking-widest uppercase">Global Directory</h2>
            <div className="flex bg-white/5 rounded-full p-1">
              <button 
                onClick={() => { setActiveSearch('users'); setResults([]); }}
                className={cn("px-3 py-1 rounded-full text-[8px] font-black uppercase transition-all", activeSearch === 'users' ? "bg-glacier-primary text-black" : "text-white/40")}
              >Nodes</button>
              <button 
                onClick={() => { setActiveSearch('clusters'); setResults([]); }}
                className={cn("px-3 py-1 rounded-full text-[8px] font-black uppercase transition-all", activeSearch === 'clusters' ? "bg-glacier-primary text-black" : "text-white/40")}
              >Clusters</button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input 
              autoFocus
              value={queryStr}
              onChange={e => setQueryStr(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchItems()}
              placeholder={activeSearch === 'users' ? "Search by @handle..." : "Search by cluster name..."}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-glacier-primary transition-all font-mono"
            />
          </div>

          <div className="space-y-4">
             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-glacier-primary">Neural Linkage via Key</p>
             <div className="flex gap-2">
                <input 
                  value={inviteCode}
                  onChange={e => setInviteCode(e.target.value)}
                  placeholder="Paste Invite Key..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs text-white focus:outline-none focus:border-glacier-primary transition-all font-mono"
                />
                <button 
                  onClick={joinByCode}
                  disabled={joining || !inviteCode.trim()}
                  className="px-6 bg-glacier-primary text-black font-black uppercase text-[10px] rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-20"
                >
                  {joining ? <RefreshCcw className="w-3 h-3 animate-spin" /> : "Access"}
                </button>
             </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar space-y-3">
          {loading ? (
             <div className="flex flex-col items-center gap-4 py-20 opacity-20">
                <RefreshCcw className="w-6 h-6 animate-spin" />
                <span className="text-[10px] font-black tracking-widest uppercase">Scanning Matrix...</span>
             </div>
          ) : results.length > 0 ? (
            results.map((item: any) => (
              <div 
                key={item.uid || item.id} 
                onClick={() => {
                  if (activeSearch === 'users') onStartChat(item);
                  else {
                    alert("Cluster Found: " + item.groupName + "\nUse an invite key to join.");
                  }
                }}
                className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/10 hover:border-glacier-primary/20 transition-all group cursor-pointer"
              >
                {activeSearch === 'users' ? (
                  <img src={item.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${item.uid}`} alt="" className="w-10 h-10 rounded-xl border border-white/10 object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-glacier-primary/10 flex items-center justify-center border border-glacier-primary/20">
                    <Users className="w-5 h-5 text-glacier-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-white truncate uppercase tracking-tighter">{activeSearch === 'users' ? item.displayName : item.groupName}</p>
                  <p className="text-[10px] font-mono text-white/30 truncate uppercase">{activeSearch === 'users' ? (item.username || '@unknown') : `ID_${item.id?.slice(0, 8)}`}</p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <ExternalLink className="w-4 h-4 text-glacier-primary" />
                </div>
              </div>
            ))
          ) : queryStr.trim() && (
            <div className="py-20 text-center opacity-10 text-[10px] font-black tracking-widest uppercase">No direct signals detected.</div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function MemberAvatar({ userId }: { userId: string }) {
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (!(window as any)._user_cache) (window as any)._user_cache = {};
    if ((window as any)._user_cache[userId]) {
      setUserData((window as any)._user_cache[userId]);
    } else {
      getDoc(doc(db, 'users', userId)).then(snap => {
        if (snap.exists()) {
          const data = snap.data();
          (window as any)._user_cache[userId] = data;
          setUserData(data);
        }
      });
    }
  }, [userId]);

  return (
    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 overflow-hidden shadow-lg transition-transform hover:scale-110 active:scale-95 bg-center bg-cover"
         style={{ backgroundImage: userData?.photoURL ? `url(${userData.photoURL})` : 'none' }}>
      {!userData?.photoURL && <div className="w-full h-full flex items-center justify-center text-[8px] font-black text-white/20">NODE</div>}
    </div>
  );
}

function ResolvedName({ userId, fallback, className }: { userId: string, fallback: string, className?: string }) {
  const [name, setName] = useState<string>(fallback);

  useEffect(() => {
    if (!userId || userId === 'glacier-ai' || userId === 'system') return;
    
    if (!(window as any)._user_cache) (window as any)._user_cache = {};
    if ((window as any)._user_cache[userId]) {
      setName((window as any)._user_cache[userId].displayName || (window as any)._user_cache[userId].username || fallback);
      return;
    }

    getDoc(doc(db, 'users', userId)).then(snap => {
      if (snap.exists()) {
        const data = snap.data();
        (window as any)._user_cache[userId] = data;
        setName(data.displayName || data.username || fallback);
      }
    });
  }, [userId, fallback]);

  return <span className={className}>{name}</span>;
}

function ChatWindow({ chat, currentUser, currentUserData, privateKey, onBack, onViewProfile, onContextMenu }: any) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [aiIsTyping, setAiIsTyping] = useState(false);
  const [showCall, setShowCall] = useState(false);
  const [imgQuality, setImgQuality] = useState<AIQuality>('Standard');
  const [aiComplexity, setAiComplexity] = useState<'fast' | 'general' | 'complex'>('general');
  const [isApiKeySelected, setIsApiKeySelected] = useState(false);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [showGroupProfile, setShowGroupProfile] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [otherUserData, setOtherUserData] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const otherId = chat.participants?.find((p: any) => p !== currentUser?.uid);
  const nickname = otherId ? currentUserData?.nicknames?.[otherId] : null;

  useEffect(() => {
    if (otherId) {
      if (!(window as any)._user_cache) (window as any)._user_cache = {};
      if ((window as any)._user_cache[otherId]) {
        setOtherUserData((window as any)._user_cache[otherId]);
      } else {
        getDoc(doc(db, 'users', otherId)).then(snap => {
          if (snap.exists()) {
            const data = snap.data();
            (window as any)._user_cache[otherId] = data;
            setOtherUserData(data);
          }
        });
      }
    }
  }, [otherId]);

  // Check for API key on load
  useEffect(() => {
    const checkKey = async () => {
      // If we have an ENV key, we might be able to skip the selective prompt for some models
      const hasEnvKey = !!process.env.GEMINI_API_KEY;
      if ((window as any).aistudio?.hasSelectedApiKey) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        setIsApiKeySelected(hasKey || hasEnvKey);
      } else {
        setIsApiKeySelected(true); 
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if ((window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
      setIsApiKeySelected(true);
    }
  };

  useEffect(() => {
    (window as any).triggerAnimate = (url: string) => {
        setInput(`Animate this image into a cinematic video sequence: ${url}`);
    };
    (window as any).triggerResource = (type: string) => {
        setInput(`Glacier, activate the Core ${type} repository. Synchronize all free neural assets for immediate deployment.`);
    };
    return () => { 
      delete (window as any).triggerAnimate; 
      delete (window as any).triggerResource; 
    };
  }, []);

  // Sync Messages
  useEffect(() => {
    const q = query(
      collection(db, 'conversations', chat.id, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );
    return onSnapshot(q, (snapshot) => {
      const uniqueMessages = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Message));
      // Defensive deduplication to prevent React key collisions during rapid sync
      const seen = new Set();
      const filtered = uniqueMessages.filter(msg => {
        if (seen.has(msg.id)) return false;
        seen.add(msg.id);
        return true;
      });
      setMessages(filtered);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, `conversations/${chat.id}/messages`);
    });
  }, [chat.id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const storageRef = ref(storage, `attachments/${chat.id}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      const type = file.type.startsWith('image/') ? 'image' : (file.type.startsWith('video/') ? 'video' : 'file');
      
      const messagesRef = collection(db, 'conversations', chat.id, 'messages');
      await addDoc(messagesRef, {
        conversationId: chat.id,
        senderId: currentUser.uid,
        contentEncrypted: `[${type.toUpperCase()}_SIGNAL_INGESTED]`,
        iv: 'attachment-iv',
        type,
        attachmentUrl: url,
        attachmentName: file.name,
        attachmentSize: file.size,
        createdAt: serverTimestamp()
      });
      
      await setDoc(doc(db, 'conversations', chat.id), {
        lastMessage: `📎 Attached: ${file.name}`,
        updatedAt: serverTimestamp()
      }, { merge: true });

    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAudioSend = async (blob: Blob) => {
    setIsUploading(true);
    try {
      const storageRef = ref(storage, `recordings/${chat.id}/${Date.now()}.webm`);
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);
      
      const messagesRef = collection(db, 'conversations', chat.id, 'messages');
      await addDoc(messagesRef, {
        conversationId: chat.id,
        senderId: currentUser.uid,
        contentEncrypted: "[VOICE_TRANSMISSION_SUCCESS]",
        iv: 'voice-iv',
        type: 'voice',
        attachmentUrl: url,
        attachmentName: 'Voice Message',
        createdAt: serverTimestamp()
      });
      
      await setDoc(doc(db, 'conversations', chat.id), {
        lastMessage: "🎤 Voice Message",
        updatedAt: serverTimestamp()
      }, { merge: true });

    } catch (err) {
      console.error("Audio transmission failed:", err);
    } finally {
      setIsUploading(false);
      setIsRecording(false);
    }
  };

  const handlePollSend = async (poll: Message['pollData']) => {
    try {
      const messagesRef = collection(db, 'conversations', chat.id, 'messages');
      await addDoc(messagesRef, {
        conversationId: chat.id,
        senderId: currentUser.uid,
        contentEncrypted: "[POLL_DEPLOYED]",
        iv: 'poll-iv',
        type: 'poll',
        pollData: poll,
        createdAt: serverTimestamp()
      });
      
      await setDoc(doc(db, 'conversations', chat.id), {
        lastMessage: "📊 Poll: " + poll?.question,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setShowPollCreator(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'messages/poll');
    }
  };

  const handleSend = async (e?: React.FormEvent, forceAIImage: boolean = false, overrideInput?: string) => {
    e?.preventDefault();
    const rawInput = (overrideInput || input).trim();
    if (!rawInput && !forceAIImage) return;

    if (!forceAIImage) setInput('');

    try {
      if (chat.isAI) {
        // AI Logic - No E2EE needed for AI chat in this version
        const msgData: Partial<Message> = {
          conversationId: chat.id,
          senderId: currentUser.uid,
          contentEncrypted: rawInput,
          iv: 'glacier-iv',
          type: 'text',
          createdAt: serverTimestamp() as any,
        };

        if (imagePreview) {
           msgData.type = 'image';
           msgData.attachmentUrl = imagePreview;
        }
        
        setPendingImage(null);
        setImagePreview(null);
        
        try {
          await setDoc(doc(db, 'conversations', chat.id), {
            participants: chat.participants,
            type: 'direct',
            updatedAt: serverTimestamp(),
            isAI: true
          }, { merge: true });
          await addDoc(collection(db, 'conversations', chat.id, 'messages'), msgData);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `conversations/${chat.id}/messages`);
        }
        
        setAiIsTyping(true);
        const history = messages
          .filter(m => m.type === 'text' && m.contentEncrypted) 
          .slice(-10)
          .map(m => ({
            role: m.senderId === 'glacier-ai' ? 'model' : 'user',
            parts: [{ text: (m as any).contentEncrypted || '' }]
          }));

        try {
          let aiResponseObj;
          const lastImageMsg = [...messages].reverse().find(m => m.type === 'image' && m.attachmentUrl);
          
          const imageKeywords = ['generate', 'create', 'draw', 'paint', 'image', 'picture', 'photo', 'sketch', 'visualize', 'rendering', 'photo', 'pic', 'dikhao', 'banao', 'image output', 'visualize', 'banana'];
          const videoKeywords = ['video', 'animate', 'motion', 'movie', 'film', 'chalao', 'video output'];
          const isImageRequest = forceAIImage || imageKeywords.some(kw => rawInput.toLowerCase().includes(kw));
          const isVideoRequest = videoKeywords.some(kw => rawInput.toLowerCase().includes(kw));

          if (isVideoRequest) {
            aiResponseObj = await glacierAI.generateVideo(rawInput, lastImageMsg?.attachmentUrl);
          } else if (isImageRequest) {
            const isEdit = rawInput.toLowerCase().includes('edit') || rawInput.toLowerCase().includes('change') || rawInput.toLowerCase().includes('modify');
            aiResponseObj = await glacierAI.generateImage(rawInput, imgQuality, isEdit ? lastImageMsg?.attachmentUrl : undefined);
          } else {
            aiResponseObj = await glacierAI.generateResponse(rawInput, history, aiComplexity);
          }
          
          let attachmentUrl = undefined;
          if (aiResponseObj.type === 'image' || aiResponseObj.type === 'video') {
             try {
                const response = await fetch(aiResponseObj.content);
                const blob = await response.blob();
                const storageRef = ref(storage, `ai-outputs/${chat.id}/${Date.now()}`);
                await uploadBytes(storageRef, blob);
                attachmentUrl = await getDownloadURL(storageRef);
             } catch (vErr) {
                attachmentUrl = aiResponseObj.content;
             }
          }

          const aiMsgData: any = {
            conversationId: chat.id,
            senderId: 'glacier-ai',
            contentEncrypted: aiResponseObj.type === 'text' ? aiResponseObj.content : (aiResponseObj.description || "Synthesis complete."),
            iv: 'glacier-iv',
            type: aiResponseObj.type,
            createdAt: serverTimestamp(),
          };
          if (attachmentUrl) aiMsgData.attachmentUrl = attachmentUrl;
          await addDoc(collection(db, 'conversations', chat.id, 'messages'), aiMsgData);
        } catch (genErr: any) {
          console.error("AI Error:", genErr);
        } finally {
          setAiIsTyping(false);
        }
        return;
      }

      // Multi-Participant Support
      const recipients = chat.participants.filter((p: string) => p !== currentUser.uid);
      const recipientKeys: { [uid: string]: string } = {};
      
      await Promise.all(recipients.map(async (uid: string) => {
        if ((window as any)._user_cache?.[uid]?.publicKey) {
          recipientKeys[uid] = (window as any)._user_cache[uid].publicKey;
        } else {
          try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            const pk = userDoc.data()?.publicKey;
            if (pk) {
              if (!(window as any)._user_cache) (window as any)._user_cache = {};
              (window as any)._user_cache[uid] = userDoc.data();
              recipientKeys[uid] = pk;
            }
          } catch (e) {}
        }
      }));

      const senderPublicKey = currentUser.publicKey;
      if (senderPublicKey) recipientKeys[currentUser.uid] = senderPublicKey;

      let finalContent = rawInput;
      let finalIv = 'plain-iv';
      let finalEncKeys: { [uid: string]: string } = {};

      // Only encrypt if we have participants and keys
      if (Object.keys(recipientKeys).length > 1 && privateKey) {
        try {
          const { encryptedContent, iv, encKeys } = await encryptContent(rawInput, recipientKeys);
          finalContent = encryptedContent;
          finalIv = iv;
          finalEncKeys = encKeys;
        } catch (cryptoErr) {
          console.error("Encryption failed, falling back to plain:", cryptoErr);
        }
      }

      const msgData: any = {
        conversationId: chat.id,
        senderId: currentUser.uid,
        contentEncrypted: finalContent,
        iv: finalIv,
        type: 'text',
        createdAt: serverTimestamp(),
      };

      if (finalEncKeys && Object.keys(finalEncKeys).length > 0) {
        msgData.encKeys = finalEncKeys;
      }

      await addDoc(collection(db, 'conversations', chat.id, 'messages'), msgData);
      await setDoc(doc(db, 'conversations', chat.id), { updatedAt: serverTimestamp() }, { merge: true });
      setInput('');
    } catch (err: any) {
      console.error("Transmission failed:", err);
    }
  };

  const handleResetAI = async () => {
    if (!chat.isAI) return;
    if (!window.confirm("Galaxyous System Wipe: This will purge all neural synchronization logs for this node. Continue?")) return;
    
    setAiIsTyping(true);
    try {
      const messagesRef = collection(db, 'conversations', chat.id, 'messages');
      const q = query(messagesRef);
      const snapshot = await getDocs(q);
      
      const batchSize = 20;
      for (let i = 0; i < snapshot.docs.length; i += batchSize) {
        const batch = snapshot.docs.slice(i, i + batchSize);
        await Promise.all(batch.map(d => deleteDoc(d.ref)));
      }
      
      await setDoc(doc(db, 'conversations', chat.id), { 
        updatedAt: serverTimestamp(),
        lastReset: serverTimestamp()
      }, { merge: true });

      // Add fresh welcome message
      await addDoc(messagesRef, {
        conversationId: chat.id,
        senderId: 'glacier-ai',
        contentEncrypted: "Neural Matrix Purged. Link established. I am Glacier AI, ready for advanced synthesis. How can I assist you today?",
        iv: 'glacier-iv',
        type: 'text',
        createdAt: serverTimestamp()
      });

    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `conversations/${chat.id}/messages`);
    } finally {
      setAiIsTyping(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn(
        "flex-1 flex flex-col h-full relative z-10 overflow-hidden",
        (window as any).currentTheme === 'nebula' && "meteorix-border overflow-visible"
      )}
    >
      {/* Chat Header */}
      <div className="p-4 md:p-6 flex items-center justify-between border-b border-white/5 glass shrink-0 bg-glacier-surface/40 pt-safe">
        <div className="flex items-center gap-2 md:gap-4 truncate">
          <button onClick={onBack} className="md:hidden p-2 text-glacier-primary hover:bg-white/5 rounded-xl transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div 
            onClick={() => {
              if (chat.isAI) {
                onViewProfile({
                  uid: 'glacier-ai',
                  displayName: 'Glacier AI',
                  username: '@glacier',
                  photoURL: '/glacier_ai.png',
                  bio: 'SENTIENT_AI_CORE. Sourced from the Meteorix Neural Matrix. System Intelligence Level: Omega.',
                  status: 'ONLINE_ACTIVE'
                } as any);
                return;
              }
              if (otherUserData) onViewProfile(otherUserData);
            }}
            className={cn(
              "w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center border shrink-0 bg-center bg-cover cursor-pointer hover:scale-105 transition-all shadow-xl",
              chat.isAI ? "border-glacier-primary/30 shadow-glacier-primary/10" : "bg-glacier-primary/10 border-glacier-primary/30 overflow-hidden"
            )} 
            style={{ 
              backgroundImage: chat.isAI 
                ? 'url(/glacier_ai.png)' 
                : (chat.type === 'group' ? `url(${chat.groupAvatar})` : (otherUserData?.photoURL ? `url(${otherUserData.photoURL})` : 'none'))
            }}
          >
            {chat.isAI ? null : (chat.type === 'group' ? (!chat.groupAvatar && <Users className="text-glacier-primary w-5 h-5 md:w-6 md:h-6" />) : (!otherUserData?.photoURL && <Users className="text-glacier-primary w-5 h-5 md:w-6 md:h-6" />))}
          </div>
          <div className="truncate cursor-pointer hover:opacity-80" 
               onClick={() => {
                 if (chat.type === 'group') {
                   setShowGroupProfile(true);
                   return;
                 }
                 if (otherUserData) onViewProfile(otherUserData);
               }}>
            <h2 className={cn("font-black tracking-tighter text-sm md:text-lg truncate uppercase", "color-changing")}>
              {chat.isAI ? 'Glacier AI' : (nickname || (chat.type === 'group' ? chat.groupName : (otherUserData?.displayName || otherUserData?.username || `Neural Link ${chat.id.slice(0, 4)}`)))}
            </h2>
            <div className="flex items-center gap-1.5 leading-none">
              <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse bg-glacier-primary shadow-[0_0_5px_rgba(88,166,255,0.8)]")} />
              <span className="text-[9px] md:text-[10px] font-black uppercase text-glacier-primary tracking-widest">{chat.isAI ? 'ACTIVE_CORE' : (chat.type === 'group' ? 'SECURE_NODE_GROUP' : 'SECURE_TRANS')}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              const messagesRef = collection(db, 'conversations', chat.id, 'messages');
              addDoc(messagesRef, {
                conversationId: chat.id,
                senderId: currentUser.uid,
                contentEncrypted: "[VOICE_CALL_SIGNAL_OUTGOING]",
                iv: 'call-iv',
                type: 'voice_call',
                createdAt: serverTimestamp()
              });
              setShowCall(true);
            }}
            className="p-3 rounded-xl hover:bg-white/5 text-glacier-text/40 hover:text-glacier-primary transition-all border border-white/5"
            title="Secure Voice Call"
          >
            <Phone className="w-5 h-5" />
          </button>
          <button 
            onClick={() => {
              const messagesRef = collection(db, 'conversations', chat.id, 'messages');
              addDoc(messagesRef, {
                conversationId: chat.id,
                senderId: currentUser.uid,
                contentEncrypted: "[VIDEO_CALL_SIGNAL_OUTGOING]",
                iv: 'call-iv',
                type: 'video_call',
                createdAt: serverTimestamp()
              });
              setShowCall(true);
            }}
            className="p-3 rounded-xl hover:bg-white/5 text-glacier-text/40 hover:text-glacier-primary transition-all border border-white/5"
            title="Secure Video Link"
          >
            <Video className="w-5 h-5" />
          </button>
          {chat.isAI && (
            <button 
              onClick={handleResetAI}
              className="p-3 rounded-xl hover:bg-red-500/10 text-red-500 transition-all border border-red-500/10 group active:scale-95 shadow-lg shadow-red-500/5"
              title="System Purge (Reset AI)"
            >
              <RotateCcw className="w-5 h-5 group-hover:-rotate-90 transition-transform duration-500" />
            </button>
          )}
          <button className="p-3 rounded-xl hover:bg-white/10 text-white/70 transition-all border border-white/5">
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
        {messages.map((msg, idx) => (
          <MessageItem 
            key={`msg-node-${msg.id || idx}-${idx}`} 
            message={msg} 
            isMe={msg.senderId === currentUser.uid} 
            privateKey={privateKey}
            currentUserId={currentUser.uid}
            onViewProfile={onViewProfile}
            onContextMenu={(e: React.MouseEvent) => {
              e.preventDefault();
              onContextMenu(e.clientX, e.clientY, 'message', msg);
            }}
            useLongPress={useLongPress}
          />
        ))}
        {aiIsTyping && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="glass p-4 rounded-3xl rounded-tl-none flex items-center gap-2 border border-meteor-primary/20">
               <div className="w-1.5 h-1.5 rounded-full bg-meteor-primary animate-bounce" />
               <div className="w-1.5 h-1.5 rounded-full bg-meteor-primary animate-bounce [animation-delay:0.2s]" />
               <div className="w-1.5 h-1.5 rounded-full bg-meteor-primary animate-bounce [animation-delay:0.4s]" />
               <span className="text-[9px] text-glacier-primary font-bold ml-2 tracking-widest uppercase">Glacier Thinking...</span>
            </div>
          </motion.div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <div className="p-4 md:p-6 bg-black/20 border-t border-white/5 shrink-0 pb-safe">
        {chat.isAI && imagePreview && (
          <div className="max-w-4xl mx-auto px-4 mb-2 flex justify-start">
             <div className="relative group animate-in slide-in-from-bottom-2 duration-300">
               <img src={imagePreview} alt="Pending" className="w-24 h-24 object-cover rounded-xl border border-glacier-primary/50 shadow-[0_0_15px_rgba(88,166,255,0.3)]" />
               <button 
                 onClick={() => { setPendingImage(null); setImagePreview(null); }}
                 className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-90 transition-transform"
               >
                 <X className="w-3.5 h-3.5" />
               </button>
               <div className="absolute inset-0 rounded-xl bg-glacier-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
             </div>
          </div>
        )}

        {isUploading && (
           <div className="max-w-4xl mx-auto px-4 mb-2">
              <div className="flex items-center gap-3">
                 <div className="w-4 h-4 border-2 border-glacier-primary border-t-transparent rounded-full animate-spin" />
                 <span className="text-[10px] font-black uppercase text-glacier-primary tracking-widest">Uploading Signal Matrix...</span>
              </div>
           </div>
        )}

        <div className="max-w-4xl mx-auto flex items-center gap-4">
          {isRecording ? (
             <AudioRecorder 
               onRecordingComplete={handleAudioSend} 
               onCancel={() => setIsRecording(false)} 
             />
          ) : (
            <form 
              onSubmit={handleSend}
              className="flex-1 glass-dark rounded-2xl md:rounded-3xl p-1.5 md:p-2 flex items-center gap-2 border border-white/10 shadow-2xl transition-all"
            >
              <div className="flex items-center gap-0.5 ml-1">
                <button 
                  type="button"
                  onClick={() => setShowPollCreator(true)}
                  className="p-2 md:p-3 rounded-xl hover:bg-white/10 text-meteor-text/40 transition-colors"
                  title="Create Poll"
                >
                  <BarChart3 className="w-5 h-5" />
                </button>
                <label className="p-2 md:p-3 rounded-xl hover:bg-white/10 text-meteor-text/40 cursor-pointer transition-colors" title="Attach Document/Media">
                  <Paperclip className="w-5 h-5" />
                  <input type="file" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
              
              <input 
                type="text" 
                placeholder="Enter neural signal..." 
                className="flex-1 bg-transparent border-none focus:outline-none px-2 md:px-4 text-sm text-white font-sans"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />

              <div className="flex items-center gap-2 mr-1">
                {!input.trim() && (
                  <button 
                    type="button"
                    onClick={() => setIsRecording(true)}
                    className="p-3 rounded-xl text-glacier-text/40 hover:text-red-500 hover:bg-red-500/10 transition-all"
                    title="Voice Record"
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                )}

                {chat.isAI && (
                  <button 
                    type="button"
                    onClick={() => handleSend(undefined, true)}
                    disabled={!input.trim() || aiIsTyping}
                    className="p-3 glass rounded-xl text-meteor-primary hover:bg-meteor-primary/10 transition-all border border-meteor-primary/20 group relative overflow-hidden active:scale-95 disabled:opacity-30"
                    title="AI Visualizer - Generate Image"
                  >
                    <Sparkles className={cn("w-5 h-5", aiIsTyping ? "animate-pulse" : "group-hover:rotate-12 transition-transform")} />
                    <div className="absolute inset-0 bg-meteor-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                )}
                
                {input.trim() && (
                  <button 
                    type="submit"
                    className="bg-meteor-primary text-meteor-bg p-3 md:p-4 rounded-xl md:rounded-2xl transition-all hover:scale-110 active:scale-90 shadow-[0_0_20px_rgba(0,242,255,0.3)] shrink-0"
                  >
                    <Send className="w-5 h-5 md:w-6 md:h-6 fill-current" />
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Group Profile Modal */}
      <AnimatePresence>
        {showGroupProfile && (
          <GroupProfileModal 
            chat={chat} 
            onClose={() => setShowGroupProfile(false)} 
            currentUser={currentUser} 
          />
        )}
      </AnimatePresence>

      {/* Video Call Modal */}
      <AnimatePresence>
        {showCall && chat && (
          <VideoCallModal chat={chat} onClose={() => setShowCall(false)} />
        )}
      </AnimatePresence>

      {/* Poll Creator Modal */}
      <AnimatePresence>
        {showPollCreator && (
          <PollCreator onCreate={handlePollSend} onCancel={() => setShowPollCreator(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface MessageItemProps {
  message: Message;
  isMe: boolean;
  privateKey: CryptoKey | null;
  currentUserId: string;
  onViewProfile?: (user: any) => void;
  onContextMenu: (e: any) => void;
  useLongPress: any;
}

function PollMessage({ poll, isMe, messageId }: { poll: Message['pollData'], isMe: boolean, messageId: string }) {
  const [votedId, setVotedId] = useState<number | null>(null);
  if (!poll) return null;

  const totalVotes = poll.options.reduce((acc, opt) => acc + opt.votes.length, 0);

  return (
    <div className="space-y-4 min-w-[240px]">
      <h4 className="font-black text-xs uppercase tracking-tight mb-2 text-inherit opacity-90">{poll.question}</h4>
      <div className="space-y-2">
        {poll.options.map((opt, i) => {
          const percent = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
          return (
            <button 
              key={i}
              onClick={() => setVotedId(i)}
              className="w-full relative group p-3 rounded-2xl border border-white/10 bg-white/5 overflow-hidden transition-all hover:border-glacier-primary/50 text-left"
            >
              <div 
                className={cn(
                  "absolute inset-y-0 left-0 transition-all duration-500",
                  isMe ? "bg-black/10" : "bg-glacier-primary/10"
                )} 
                style={{ width: `${percent}%` }} 
              />
              <div className="relative z-10 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                <span className="truncate pr-4">{opt.text}</span>
                <span className="shrink-0">{percent}%</span>
              </div>
            </button>
          );
        })}
      </div>
      <div className="text-[8px] font-bold opacity-40 uppercase tracking-widest text-right">
        {totalVotes} Neural Responses
      </div>
    </div>
  );
}

function VoicePlayer({ url, isMe }: { url: string, isMe: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [progress, setProgress] = useState(0);

  const toggle = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex items-center gap-3 min-w-[200px] py-1">
      <audio 
        ref={audioRef} 
        src={url} 
        onTimeUpdate={(e: any) => setProgress((e.target.currentTime / e.target.duration) * 100)}
        onEnded={() => { setIsPlaying(false); setProgress(0); }}
        className="hidden" 
      />
      <button 
        onClick={toggle}
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0",
          isMe ? "bg-black text-glacier-primary" : "bg-glacier-primary text-black"
        )}
      >
        {isPlaying ? <CirclePause size={20} /> : <CirclePlay size={20} />}
      </button>
      <div className="flex-1 space-y-1.5">
        <div className={cn("h-1 rounded-full w-full relative overflow-hidden", isMe ? "bg-black/20" : "bg-white/20")}>
          <div 
            className={cn("absolute inset-y-0 left-0 transition-all duration-300", isMe ? "bg-black" : "bg-glacier-primary")} 
            style={{ width: `${progress}%` }} 
          />
        </div>
        <div className="flex justify-between items-center opacity-40 text-[8px] font-black tracking-widest">
           <span>VOICE_SIGNAL</span>
           <span>DECRYPTED</span>
        </div>
      </div>
      <Headphones size={14} className="opacity-40" />
    </div>
  );
}

const MessageItem: React.FC<MessageItemProps> = ({ message, isMe, privateKey, currentUserId, onViewProfile, onContextMenu }) => {
  const longPressHandlers = useLongPress((e: any) => onContextMenu(e));
  const [decrypted, setDecrypted] = useState<string>('Decrypting signal...');
  const [error, setError] = useState(false);

  // Parse mentions like @username
  const renderContent = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(@[A-Za-z0-9_-]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        const username = part.slice(1);
        return (
          <span 
            key={`mention-${i}-${username}`} 
            className={cn(
               "font-black cursor-pointer hover:underline transition-all filter drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]",
               "color-changing"
            )}
            onClick={async (e) => {
               e.stopPropagation();
               try {
                 const usersRef = collection(db, 'users');
                 const qLower = query(usersRef, where('username', '==', part.toLowerCase().trim()));
                 const snapshot = await getDocs(qLower);
                 
                 if (!snapshot.empty) {
                    onViewProfile?.(snapshot.docs[0].data());
                 } else {
                    // Try by display name if username match fails
                    const q2 = query(usersRef, where('displayName', '==', username));
                    const snapshot2 = await getDocs(q2);
                    if (!snapshot2.empty) {
                       onViewProfile?.(snapshot2.docs[0].data());
                    }
                 }
               } catch (err) {
                 console.error("Mention search failed:", err);
               }
            }}
          >
            {part}
          </span>
        );
      }
      return <span key={`text-${i}`}>{part}</span>;
    });
  };

  useEffect(() => {
    async function decrypt() {
      if (message.senderId === 'glacier-ai' || message.senderId === 'system' || message.type === 'poll' || message.type === 'voice' || message.type === 'voice_call' || message.type === 'video_call') {
        setDecrypted((message as any).contentEncrypted || '');
        return;
      }
      
      if (message.iv === 'plain-iv' || message.iv === 'attachment-iv' || message.iv === 'voice-iv' || message.iv === 'call-iv') {
          setDecrypted(message.contentEncrypted);
          return;
      }

      const myEncKey = message.encKeys?.[currentUserId];

      if (message.conversationId.startsWith('ai-') && isMe) {
          setDecrypted((message as any).contentEncrypted || '');
          return;
      }

      if (!privateKey) {
          setDecrypted("Signal Locked (Waiting for Keys)"); 
          return;
      }
      
      try {
        if (myEncKey) {
          const text = await decryptContent(message.contentEncrypted, myEncKey, message.iv, privateKey);
          setDecrypted(text);
        } else {
          setDecrypted(message.contentEncrypted.slice(0, 20) + "...");
          setError(true);
        }
      } catch (err) {
        if (message.contentEncrypted.length > 30) {
           setDecrypted(message.contentEncrypted.slice(0, 20) + "...");
        } else {
           setDecrypted(message.contentEncrypted);
        }
        setError(true);
      }
    }
    decrypt();
  }, [message, privateKey, currentUserId]);

  const renderMessageBody = () => {
    switch (message.type) {
      case 'image':
        return (
          <div className="rounded-2xl overflow-hidden border border-white/10 group relative shadow-2xl">
            <img src={message.attachmentUrl} alt="Signal Attachment" className="w-full max-h-96 object-cover" />
            <a href={message.attachmentUrl} target="_blank" download={message.attachmentName} className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowDownToLine size={16} />
            </a>
          </div>
        );
      case 'video':
        return (
          <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            <video src={message.attachmentUrl} className="w-full aspect-video object-cover" controls />
          </div>
        );
      case 'file':
        return (
          <div className={cn(
            "p-3 rounded-2xl border flex items-center gap-4 transition-all hover:bg-white/10",
            isMe ? "border-black/10 bg-black/5" : "border-white/10 bg-white/5"
          )}>
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", isMe ? "bg-black/20" : "bg-glacier-primary/20")}>
              <FileText className={isMe ? "text-black" : "text-glacier-primary"} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-tighter truncate">{message.attachmentName}</p>
              <p className="text-[8px] opacity-40 uppercase font-mono">{Math.round((message.attachmentSize || 0) / 1024)} KB Signal</p>
            </div>
            <a href={message.attachmentUrl} download={message.attachmentName} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <ArrowDownToLine size={16} />
            </a>
          </div>
        );
      case 'voice':
        return <VoicePlayer url={message.attachmentUrl!} isMe={isMe} />;
      case 'poll':
        return <PollMessage poll={message.pollData!} isMe={isMe} messageId={message.id} />;
      case 'voice_call':
      case 'video_call':
        return (
          <div className="flex items-center gap-3 py-1 opacity-80">
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", isMe ? "bg-black/10" : "bg-white/10")}>
              {message.type === 'video_call' ? <Video size={16} /> : <PhoneCall size={16} />}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest">
                {isMe ? 'Signal Outbound' : 'Incoming Neural Frequency'}
              </span>
              <span className="text-[8px] font-bold opacity-40 uppercase tracking-tighter">
                {message.type === 'video_call' ? 'VIDEO_LINK' : 'VOICE_STREAM'} • {format(message.createdAt?.toDate() || new Date(), 'HH:mm')}
              </span>
            </div>
          </div>
        );
      default:
        return (
          <p className={cn(
            "text-sm leading-relaxed whitespace-pre-wrap break-words",
            message.senderId === 'glacier-ai' && "font-mono text-[13px] pl-3"
          )}>
            {renderContent(decrypted)}
          </p>
        );
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      onContextMenu={onContextMenu}
      {...longPressHandlers}
      className={cn(
        "flex w-full mb-3",
        isMe ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn(
        "max-w-[85%] p-4 rounded-3xl relative overflow-hidden",
        isMe 
          ? "bg-glacier-primary text-black rounded-tr-none shadow-[0_4px_15px_rgba(88,166,255,0.4)]" 
          : "glass text-white rounded-tl-none border border-white/5",
        message.senderId === 'glacier-ai' && "border-glacier-primary/30 shadow-[0_0_25px_rgba(88,166,255,0.2)]"
      )}>
        {/* Sender Identity for P2P */}
        {!isMe && message.senderId !== 'glacier-ai' && message.senderId !== 'system' && (
           <div className="flex items-center gap-1.5 mb-2 opacity-60">
              <div className="w-1.5 h-1.5 rounded-full bg-meteor-primary animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-meteor-primary font-sans">
                <ResolvedName userId={message.senderId} fallback={`Station-${message.senderId.slice(0, 6)}`} />
              </span>
           </div>
        )}

        {message.senderId === 'glacier-ai' && (
           <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/5">
              <div className="w-6 h-6 rounded-lg bg-glacier-primary/20 flex items-center justify-center border border-glacier-primary/30 overflow-hidden">
                <img src="/glacier_ai.png" alt="" className="w-full h-full object-cover" />
              </div>
              <span className="text-[10px] font-bold tracking-widest text-glacier-primary uppercase">Glacier AI Core</span>
           </div>
        )}

        <div className="relative">
          {message.senderId === 'glacier-ai' && (
             <div className="absolute -left-1 top-0 bottom-0 w-[2px] bg-glacier-primary/20" />
          )}
          {renderMessageBody()}
        </div>

        <div className={cn(
          "flex items-center gap-1 mt-2 text-[8px] uppercase font-bold tracking-tighter opacity-40",
          isMe ? "justify-end" : "justify-start"
        )}>
          {message.createdAt && format(message.createdAt.toDate(), 'HH:mm')}
          <ShieldCheck className="w-2.5 h-2.5" />
        </div>
        
        {/* Disappearing pulse if applicable */}
        {message.disappearsAt && (
           <div className="absolute -top-1 -right-1">
             <div className="w-2 h-2 rounded-full bg-meteor-secondary animate-ping" />
           </div>
        )}
      </div>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-10 text-white">
      <MeteorixLogo size={120} className="mb-8 opacity-20" />
      <h2 className="text-3xl font-sans font-black mb-2 uppercase tracking-tighter color-changing">Meteorix Messaging</h2>
      <p className="max-w-xs text-sm opacity-40">Select a contact to begin an end-to-end encrypted conversation.</p>
    </div>
  );
}

function VideoCallModal({ onClose, chat }: { onClose: () => void, chat: Conversation }) {
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setDuration(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-3xl flex flex-col items-center justify-center p-6"
    >
      <div className="relative w-full max-w-4xl aspect-[16/9] bg-[#0a0a0c] rounded-[3rem] overflow-hidden border border-glacier-primary/30 shadow-[0_0_100px_rgba(88,166,255,0.15)] flex flex-col items-center justify-center">
         <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />
         
         <div className="relative z-10 flex flex-col items-center gap-8">
            <motion.div 
              animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="w-40 h-40 rounded-[2.5rem] border-4 border-glacier-primary/40 p-1 bg-glacier-bg shadow-[0_0_50px_rgba(88,166,255,0.3)]"
            >
               <img 
                 src={chat.isAI ? '/glacier_ai.png' : (chat.groupAvatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${chat.id}`)} 
                 alt="" 
                 className="w-full h-full object-cover rounded-[2.2rem]"
               />
            </motion.div>

            <div className="text-center space-y-2">
               <h2 className="text-3xl font-black tracking-tighter text-white uppercase">{chat.isAI ? 'Glacier AI Core' : chat.groupName || 'Neural User'}</h2>
               <div className="flex items-center justify-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-mono font-bold text-glacier-primary tracking-widest uppercase">{formatDuration(duration)} | FREQUENCY_STABLE</span>
               </div>
            </div>
         </div>

         <div className="absolute top-8 left-8 flex flex-col gap-2">
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/5">
                <ShieldCheck className="w-3 h-3 text-glacier-primary" />
                <span className="text-[8px] font-black uppercase text-white/60 tracking-widest">E2EE_ENCRYPTED_STREAM</span>
            </div>
         </div>

         <div className="absolute bottom-12 flex gap-6 z-20">
            <button className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-white">
               <MicOff className="w-6 h-6" />
            </button>
            <button 
              onClick={onClose}
              className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-all text-white shadow-[0_0_30px_rgba(239,68,68,0.5)] active:scale-95"
            >
               <PhoneOff className="w-6 h-6" />
            </button>
            <button className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-white">
               <VideoOff className="w-6 h-6" />
            </button>
         </div>
      </div>
    </motion.div>
  );
}

