
import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Smartphone, Loader2, Zap, Cpu, LogOut, Check, Rocket, Settings,
  Download, Globe, Activity, Terminal, ShieldAlert, Package, QrCode, 
  AlertCircle, Key, Mail, ArrowLeft, FileCode, ShoppingCart, User as UserIcon,
  ChevronRight, Github, Save, Trash2, Square, Circle, RefreshCw, Fingerprint,
  User, Lock, Eye, EyeOff
} from 'lucide-react';
import { AppMode, ChatMessage, User as UserType, GithubConfig } from './types';
import { GeminiService } from './services/geminiService';
import { DatabaseService } from './services/dbService';
import { GithubService } from './services/githubService';

const DEFAULT_USER: UserType = {
  id: 'dev-mode',
  email: 'dev@oneclick.studio',
  name: 'OneClick Developer',
  avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=OneClick',
  tokens: 500,
  isLoggedIn: false,
  joinedAt: Date.now()
};

// --- Login Page Component ---
const LoginPage: React.FC<{ onLoginSuccess: (user: UserType) => void }> = ({ onLoginSuccess }) => {
  const [step, setStep] = useState<'scan' | 'auth'>('scan');
  const [isScanning, setIsScanning] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [isLoading, setIsLoading] = useState(false);
  const db = DatabaseService.getInstance();

  const handleStartAuth = () => {
    setIsScanning(true);
    setTimeout(() => {
      setStep('auth');
      setIsScanning(false);
    }, 2000);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = isRegister 
        ? await db.signUp(formData.email, formData.password)
        : await db.signIn(formData.email, formData.password);

      if (res.error) throw res.error;
      
      const userData = await db.getUser(formData.email, res.data.user?.id);
      if (userData) {
        onLoginSuccess(userData);
      }
    } catch (error: any) {
      alert(error.message || "Authentication Failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col items-center justify-start pt-16 md:justify-center md:pt-0 bg-[#0f172a] text-white relative overflow-hidden font-sans p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent opacity-50"></div>
      
      {step === 'scan' ? (
        <div className="flex flex-col items-center text-center animate-in fade-in zoom-in duration-700">
          {/* Welcome Message */}
          <div className="mb-10 md:mb-12 space-y-3 animate-in fade-in slide-in-from-top-8 duration-1000">
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white via-cyan-400 to-blue-600 drop-shadow-[0_0_20px_rgba(6,182,212,0.3)] px-4">
              Welcome to OneClick Studio
            </h1>
            <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-slate-500 opacity-60">
              Uplink initiated • AI Developer Interface
            </p>
          </div>

          <div 
            onClick={!isScanning ? handleStartAuth : undefined}
            className={`relative w-36 h-36 md:w-48 md:h-48 flex items-center justify-center cursor-pointer transition-transform active:scale-95 group mb-8 md:mb-12`}
          >
            <div className={`absolute inset-0 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all ${!isScanning ? 'animate-pulse' : ''}`}></div>
            
            <Fingerprint 
              size={isScanning ? 100 : 90} 
              className={`
                ${isScanning ? 'text-cyan-400 scale-110' : 'text-blue-600'} 
                transition-all duration-500 relative z-10 
                drop-shadow-[0_0_25px_rgba(6,182,212,0.6)]
                ${!isScanning ? 'animate-[float_3s_ease-in-out_infinite]' : 'animate-pulse'}
              `} 
            />
            
            {isScanning && (
              <div className="absolute top-0 left-0 w-full h-1 bg-cyan-400 shadow-[0_0_25px_#22d3ee] rounded-full animate-[scanning_1.5s_infinite] z-20"></div>
            )}
          </div>

          <h2 className={`text-sm md:text-xl font-bold tracking-widest uppercase transition-colors duration-500 ${isScanning ? 'text-cyan-400' : 'text-slate-400'}`}>
            {isScanning ? 'Identity Scanning...' : 'Touch sensor to access system'}
          </h2>

          <style>{`
            @keyframes scanning {
              0% { top: 0; } 50% { top: 100%; } 100% { top: 0; }
            }
            @keyframes float {
              0%, 100% { transform: translateY(0) rotate(0deg); }
              50% { transform: translateY(-15px) rotate(3deg); }
            }
          `}</style>
        </div>
      ) : (
        <div className="relative w-full max-w-[400px] h-[500px] [perspective:1200px] animate-in fade-in zoom-in-95 duration-500 mt-4 md:mt-0">
          <div className={`relative w-full h-full transition-transform duration-1000 [transform-style:preserve-3d] ${isRegister ? '[transform:rotateY(-90deg)]' : ''}`}>
            {/* Login Face */}
            <div className="absolute inset-0 [backface-visibility:hidden] bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 flex flex-col justify-center shadow-2xl [transform:translateZ(150px)] md:[transform:translateZ(200px)]">
              <h2 className="text-2xl md:text-3xl font-black mb-8 tracking-tight">System <span className="text-cyan-400">Login</span></h2>
              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Access Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input 
                      type="email" 
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 pl-12 outline-none focus:border-cyan-500/50 transition-all text-sm" 
                      placeholder="dev@oneclick.studio"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Access Token</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input 
                      type="password" 
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 pl-12 outline-none focus:border-cyan-500/50 transition-all text-sm" 
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <button 
                  disabled={isLoading}
                  className="w-full py-4 bg-blue-600 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:bg-blue-500 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : 'Execute Login'}
                </button>
              </form>
              <button 
                onClick={() => setIsRegister(true)}
                className="mt-6 text-xs text-cyan-400 font-bold hover:underline"
              >
                No account? Create system entry
              </button>
            </div>

            {/* Register Face */}
            <div className="absolute inset-0 [backface-visibility:hidden] bg-blue-600/10 backdrop-blur-xl border border-blue-500/20 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 flex flex-col justify-center shadow-2xl [transform:rotateY(90deg)_translateZ(150px)] md:[transform:rotateY(90deg)_translateZ(200px)]">
              <h2 className="text-2xl md:text-3xl font-black mb-8 tracking-tight text-cyan-400">New <span className="text-white">Registry</span></h2>
              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Full Name</label>
                   <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 outline-none focus:border-cyan-500/50 transition-all text-sm" 
                    placeholder="Enter full name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Email</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 outline-none focus:border-cyan-500/50 transition-all text-sm" 
                    placeholder="dev@oneclick.studio"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-4">Create Password</label>
                  <input 
                    type="password" 
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 outline-none focus:border-cyan-500/50 transition-all text-sm" 
                    placeholder="••••••••"
                  />
                </div>
                <button 
                  disabled={isLoading}
                  className="w-full py-4 bg-cyan-500 text-black font-black uppercase tracking-widest text-sm shadow-xl hover:bg-cyan-400 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : 'Register Now'}
                </button>
              </form>
              <button 
                onClick={() => setIsRegister(false)}
                className="mt-6 text-xs text-slate-400 font-bold hover:text-white"
              >
                Already registered? Login instead
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<UserType | null>(null);
  const [path, setPath] = useState(window.location.pathname);
  const [mode, setMode] = useState<AppMode>(AppMode.PREVIEW);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [projectFiles, setProjectFiles] = useState<Record<string, string>>({
    'index.html': '<h1 style="color:cyan; text-align:center; padding:50px; font-family:sans-serif;">OneClick Studio Ready</h1>',
    'main.js': '// Logic goes here'
  });
  const [selectedFile, setSelectedFile] = useState('index.html');
  const [github, setGithub] = useState<GithubConfig>({ token: '', repo: '', owner: '' });
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [logoClicks, setLogoClicks] = useState(0);
  const [buildStatus, setBuildStatus] = useState<'idle' | 'pushing' | 'building' | 'done'>('idle');
  const [apkUrl, setApkUrl] = useState<{downloadUrl: string, webUrl: string} | null>(null);
  
  const gemini = useRef(new GeminiService());
  const githubService = useRef(new GithubService());
  const chatEndRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const db = DatabaseService.getInstance();

  // Basic Routing Effect
  useEffect(() => {
    const handleLocationChange = () => {
      setPath(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Auth Sync
  useEffect(() => {
    const checkAuth = async () => {
      const session = await db.getCurrentSession();
      if (session?.user) {
        const userData = await db.getUser(session.user.email || '');
        if (userData) {
          setUser(userData);
          if (window.location.pathname === '/login') {
            navigate('/dashboard');
          }
        }
      } else if (window.location.pathname === '/dashboard') {
        navigate('/login');
      }
    };
    checkAuth();
  }, []);

  const navigate = (to: string) => {
    window.history.pushState({}, '', to);
    setPath(to);
  };

  const handleLoginSuccess = (userData: UserType) => {
    setUser(userData);
    navigate('/dashboard');
  };

  const handleLogout = async () => {
    await db.signOut();
    setUser(null);
    navigate('/login');
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'start',
        role: 'assistant',
        content: 'স্বাগতম OneClick Studio-তে! আমি আপনার লিড অ্যাপ ডেভেলপার। আপনি কি ধরনের অ্যাপ তৈরি করতে চান? আপনার আইডিয়াটি বিস্তারিত লিখুন।',
        timestamp: Date.now()
      }]);
    }
  }, []);

  useEffect(() => {
    if (logoClicks > 0) {
      const timer = setTimeout(() => setLogoClicks(0), 2000);
      return () => clearTimeout(timer);
    }
  }, [logoClicks]);

  useEffect(() => {
    if (buildStatus === 'done' && apkUrl && qrRef.current && (window as any).QRCode) {
      qrRef.current.innerHTML = '';
      try {
        new (window as any).QRCode(qrRef.current, {
          text: apkUrl.webUrl,
          width: 140,
          height: 140,
          colorDark: "#020617",
          colorLight: "#ffffff",
          correctLevel: (window as any).QRCode.CorrectLevel.H
        });
      } catch (e) {
        console.error("QR Generation error", e);
      }
    }
  }, [buildStatus, apkUrl]);

  const handleLogoClick = () => {
    const nextClicks = logoClicks + 1;
    if (nextClicks >= 3) {
      setMode(AppMode.SETTINGS);
      setLogoClicks(0);
    } else {
      setLogoClicks(nextClicks);
    }
  };

  const handleBuildAPK = async () => {
    if (!github.token || !github.owner || !github.repo) {
      alert("দয়া করে আগে লোগোতে ৩ বার ক্লিক করে গিটহাব সেটিংস ঠিক করুন।");
      return;
    }
    
    setApkUrl(null);
    setBuildStatus('pushing');
    
    try {
      await githubService.current.pushToGithub(github, projectFiles);
      setBuildStatus('building');
      
      const poll = async () => {
        const result = await githubService.current.getLatestApk(github);
        if (result && typeof result === 'object' && result.downloadUrl) {
          setApkUrl(result);
          setBuildStatus('done');
        } else {
          setTimeout(poll, 10000);
        }
      };
      poll();
    } catch (e) {
      alert("Error: " + (e as Error).message);
      setBuildStatus('idle');
    }
  };

  const handleDownload = async () => {
    if (!apkUrl) return;
    try {
      const blob = await githubService.current.downloadArtifact(github, apkUrl.downloadUrl);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${github.repo}-bundle.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      alert("Error during download: " + (e as Error).message);
    }
  };

  const handleSend = async (customInput?: string) => {
    const text = customInput || input;
    if (!text.trim() || isGenerating) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSelectedOptions([]); 
    setIsGenerating(true);

    try {
      const res = await gemini.current.generateWebsite(text, projectFiles, messages);
      if (res.files) setProjectFiles(prev => ({ ...prev, ...res.files }));
      
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.answer,
        timestamp: Date.now(),
        inputType: res.inputType || 'text',
        options: res.options,
        choices: res.choices
      };
      setMessages(prev => [...prev, assistantMsg]);
      if (user) setUser(prev => prev ? { ...prev, tokens: prev.tokens - 1 } : null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleOption = (val: string, type: 'single' | 'multiple' | 'text' = 'text') => {
    if (type === 'single') {
      setSelectedOptions([val]);
    } else if (type === 'multiple') {
      setSelectedOptions(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
    }
  };

  // Render Login Page if on /login or not logged in
  if (path === '/login' || (!user && path !== '/login')) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Dashboard UI
  return (
    <div className="h-screen flex flex-col font-['Hind_Siliguri'] text-slate-100 bg-[#020617] overflow-hidden">
      {/* Header */}
      <header className="h-auto min-h-[5rem] border-b border-white/5 glass-card flex flex-col md:flex-row items-center justify-between px-4 md:px-8 py-4 md:py-0 z-50 gap-4 md:gap-0">
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
          <div 
            onClick={handleLogoClick}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className={`w-8 h-8 md:w-10 md:h-10 bg-cyan-500 rounded-xl flex items-center justify-center shadow-lg transition-transform active:scale-90 ${logoClicks > 0 ? 'animate-pulse' : ''}`}>
              <Cpu size={20} className="text-black"/>
            </div>
            <span className="font-black text-xs md:text-sm uppercase tracking-tighter group-hover:text-cyan-400 transition-colors">OneClick <span className="text-cyan-400">Studio</span></span>
          </div>
          <div className="flex items-center gap-2 md:hidden">
             <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-[10px] font-bold text-cyan-400">{user?.tokens || 0} T</div>
             <button onClick={handleLogout} className="p-2 text-red-400 bg-red-400/5 rounded-lg"><LogOut size={16}/></button>
          </div>
        </div>

        <nav className="flex bg-slate-900/50 rounded-2xl p-1 border border-white/5 overflow-x-auto max-w-full no-scrollbar">
          {[AppMode.PREVIEW, AppMode.EDIT, AppMode.SHOP, AppMode.PROFILE].map(m => (
            <button key={m} onClick={() => setMode(m)} className={`whitespace-nowrap px-4 md:px-6 py-2 text-[10px] md:text-[11px] font-black uppercase rounded-xl transition-all ${mode === m ? 'bg-cyan-500 text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}>
              {m === AppMode.EDIT ? <FileCode size={14} className="inline mr-1 md:mr-2"/> : null}
              {m}
            </button>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <button 
            onClick={handleBuildAPK}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all"
          >
            {buildStatus === 'idle' ? <Rocket size={16}/> : <RefreshCw size={16} className="animate-spin"/>}
            {buildStatus === 'idle' ? 'Build APK' : buildStatus.toUpperCase() + '...'}
          </button>
          <div className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-xs font-bold text-cyan-400">{user?.tokens || 0} Tokens</div>
          <button onClick={handleLogout} className="p-2.5 text-red-400 hover:bg-red-400/10 rounded-xl transition-colors"><LogOut size={20}/></button>
        </div>
        
        <button 
          onClick={handleBuildAPK}
          className="md:hidden w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95"
        >
          {buildStatus === 'idle' ? <Rocket size={14}/> : <RefreshCw size={14} className="animate-spin"/>}
          {buildStatus === 'idle' ? 'Build APK' : buildStatus.toUpperCase() + '...'}
        </button>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {mode === AppMode.PREVIEW || mode === AppMode.EDIT ? (
          <>
            <section className="w-full lg:w-[450px] border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col bg-[#01040f] relative h-[60%] lg:h-full order-2 lg:order-1">
              <div className="flex-1 p-4 md:p-8 overflow-y-auto code-scroll space-y-6 pb-40">
                {/* Build Status Alert */}
                {buildStatus !== 'idle' && (
                   <div className="p-4 md:p-5 bg-cyan-500/10 border border-cyan-500/20 rounded-3xl mb-4">
                      <div className="flex items-center gap-3 mb-2">
                         <Activity size={16} className={`text-cyan-400 ${buildStatus !== 'done' ? 'animate-pulse' : ''}`}/>
                         <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-cyan-400">
                           {buildStatus === 'done' ? 'Build Successful' : 'GitHub Build Active'}
                         </span>
                      </div>
                      <p className="text-[10px] md:text-xs text-slate-400 mb-4">
                        {buildStatus === 'done' 
                          ? 'আপনার অ্যান্ড্রয়েড এপিকে তৈরি হয়েছে। স্ক্যান করে ডাউনলোড করুন।' 
                          : 'গিটহাব বিল্ড শুরু হয়েছে। এতে ১-২ মিনিট সময় লাগতে পারে।'}
                      </p>
                      
                      {buildStatus === 'done' && (
                        <div className="bg-slate-900/50 p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] border border-white/5 shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in-95">
                           <div className="bg-white p-3 md:p-4 rounded-2xl md:rounded-3xl shadow-xl overflow-hidden scale-90 md:scale-100">
                             <div ref={qrRef}></div>
                           </div>
                           <div className="text-center w-full">
                             <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 mb-3 flex items-center justify-center gap-2">
                               <QrCode size={12}/> Scan for Mobile Install
                             </p>
                             <button 
                                onClick={handleDownload}
                                className="w-full py-3 md:py-3.5 px-6 md:px-8 bg-cyan-500 text-black font-black uppercase text-[10px] rounded-2xl flex items-center justify-center gap-2 hover:bg-cyan-400 shadow-lg active:scale-95 transition-all"
                              >
                                <Download size={14}/> Download Link
                              </button>
                           </div>
                        </div>
                      )}
                   </div>
                )}

                {messages.map((m, idx) => (
                  <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-4`}>
                    <div className={`max-w-[90%] p-4 md:p-5 rounded-2xl md:rounded-3xl shadow-xl ${m.role === 'user' ? 'bg-cyan-600 text-white rounded-tr-none' : 'bg-slate-900/80 border border-white/5 text-slate-100 rounded-tl-none'}`}>
                      <p className="text-[13px] md:text-[14px] leading-relaxed whitespace-pre-wrap">{m.content}</p>
                      
                      {m.role === 'assistant' && m.options && idx === messages.length - 1 && (
                        <div className="mt-5 space-y-3">
                          <p className="text-[9px] md:text-[10px] font-black text-cyan-400/50 uppercase tracking-widest px-2">
                            {m.inputType === 'single' ? 'একটি অপশন বেছে নিন' : 'একাধিক ফিচার সিলেক্ট করুন'}
                          </p>
                          <div className="space-y-2">
                            {m.options.map((opt, i) => {
                              const isSelected = selectedOptions.includes(opt.value);
                              return (
                                <button key={i} 
                                  onClick={() => toggleOption(opt.value, m.inputType)}
                                  className={`w-full p-3 md:p-4 rounded-2xl border text-left text-[11px] md:text-xs transition-all flex items-center justify-between group ${isSelected ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400' : 'bg-black/40 border-white/5 hover:border-white/20'}`}
                                >
                                  <div className="flex items-center gap-3">
                                    {m.inputType === 'single' ? (
                                      isSelected ? <Circle className="fill-current" size={12}/> : <Circle size={12} className="opacity-20"/>
                                    ) : (
                                      isSelected ? <Check size={12} className="bg-cyan-500 text-black rounded-sm"/> : <Square size={12} className="opacity-20"/>
                                    )}
                                    <span className="font-medium">{opt.label}</span>
                                  </div>
                                  {isSelected && <Zap size={12} className="animate-pulse"/>}
                                </button>
                              );
                            })}
                          </div>
                          
                          <button 
                            disabled={selectedOptions.length === 0}
                            onClick={() => handleSend(`আমার নির্বাচন: ${selectedOptions.join(', ')}`)}
                            className="w-full mt-4 py-3 md:py-4 bg-cyan-500 text-black font-black uppercase text-[10px] md:text-[11px] rounded-2xl tracking-widest hover:bg-cyan-400 transition-all shadow-lg active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                          >
                            CONFIRM SELECTION
                          </button>
                        </div>
                      )}

                      {m.role === 'assistant' && m.choices && (
                        <div className="mt-6 flex flex-wrap gap-2">
                          {m.choices.map((c, i) => (
                            <button key={i} onClick={() => handleSend(c.prompt)} className="px-3 md:px-4 py-2 bg-white/5 hover:bg-cyan-500/20 border border-white/5 hover:border-cyan-500/50 rounded-xl text-[10px] md:text-[11px] font-bold text-slate-300 hover:text-cyan-400 transition-all">
                              {c.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isGenerating && <div className="flex items-center gap-3 text-cyan-500 text-[10px] md:text-xs font-black uppercase tracking-widest animate-pulse"><Loader2 size={14} className="animate-spin"/> AI WORKING...</div>}
                <div ref={chatEndRef} />
              </div>

              <div className="p-4 md:p-8 absolute bottom-0 w-full bg-gradient-to-t from-[#01040f] via-[#01040f] to-transparent z-10">
                <div className="relative group">
                  <textarea 
                    value={input} 
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                    placeholder="আপনার প্রজেক্টের পরিবর্তন লিখুন..." 
                    className="w-full bg-slate-900 border border-white/10 rounded-3xl md:rounded-[2.5rem] p-4 md:p-6 pr-16 md:pr-20 text-xs md:text-sm h-24 md:h-32 outline-none text-white focus:border-cyan-500/50 transition-all resize-none shadow-2xl placeholder:opacity-30"
                  />
                  <button onClick={() => handleSend()} disabled={isGenerating} className="absolute bottom-4 right-4 md:bottom-6 md:right-6 p-3 md:p-4 bg-cyan-600 rounded-2xl md:rounded-3xl text-white shadow-2xl hover:bg-cyan-500 transition-all active:scale-90 disabled:opacity-50">
                    {isGenerating ? <Loader2 size={20} className="animate-spin"/> : <Send size={20}/>}
                  </button>
                </div>
              </div>
            </section>

            <section className="flex-1 flex flex-col bg-[#020617] h-[40%] lg:h-full order-1 lg:order-2">
              {mode === AppMode.EDIT ? (
                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden animate-in fade-in duration-500">
                  <div className="w-full lg:w-72 border-b lg:border-b-0 lg:border-r border-white/5 bg-black/30 p-4 lg:p-8 space-y-2 overflow-y-auto overflow-x-hidden lg:overflow-y-auto no-scrollbar">
                    <p className="text-[9px] uppercase font-black text-slate-500 mb-4 lg:mb-6 tracking-[0.3em] opacity-40">Project Architecture</p>
                    <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
                      {Object.keys(projectFiles).map(name => (
                        <button key={name} onClick={() => setSelectedFile(name)} className={`whitespace-nowrap flex-shrink-0 text-left px-4 lg:px-5 py-2 lg:py-3 rounded-xl lg:rounded-2xl text-[10px] md:text-[11px] font-bold flex items-center gap-3 transition-all ${selectedFile === name ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-inner' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'}`}>
                          <FileCode size={14}/> {name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 p-4 lg:p-8 overflow-hidden flex flex-col">
                    <div className="flex justify-between items-center mb-4 lg:mb-6">
                      <div className="flex items-center gap-2 lg:gap-3">
                        <Terminal size={14} className="text-cyan-500"/>
                        <span className="text-[10px] md:text-xs font-mono text-slate-500 tracking-wider truncate max-w-[150px]">{selectedFile}</span>
                      </div>
                      <button className="flex items-center gap-2 px-4 lg:px-6 py-2 lg:py-2.5 bg-cyan-500 text-black rounded-xl lg:rounded-2xl text-[10px] md:text-[11px] font-black uppercase tracking-widest hover:bg-cyan-400 transition-all"><Save size={14}/> Save</button>
                    </div>
                    <pre className="flex-1 bg-slate-900/40 rounded-2xl md:rounded-[2.5rem] p-6 lg:p-10 border border-white/5 overflow-auto text-[11px] md:text-[13px] font-mono text-cyan-100/70 code-scroll leading-relaxed shadow-inner">
                      {projectFiles[selectedFile]}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center p-4 lg:p-10 relative overflow-hidden">
                  <div className="absolute inset-0 bg-grid opacity-10 lg:opacity-20 pointer-events-none"></div>
                  <div className="bg-slate-900 rounded-[2.5rem] lg:rounded-[4.5rem] h-full max-h-[600px] lg:h-[780px] aspect-[9/19] lg:w-[380px] border-[8px] lg:border-[14px] border-slate-800 shadow-[0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden group">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 lg:w-44 h-4 lg:h-8 bg-slate-800 rounded-b-2xl lg:rounded-b-3xl z-20 flex items-center justify-center"><div className="w-8 lg:w-12 h-1 bg-white/5 rounded-full"></div></div>
                    <iframe 
                      key={JSON.stringify(projectFiles)}
                      srcDoc={projectFiles['index.html']}
                      title="preview" 
                      className="w-full h-full border-none bg-white shadow-inner"
                    />
                  </div>
                </div>
              )}
            </section>
          </>
        ) : mode === AppMode.SHOP ? (
          <div className="flex-1 p-6 md:p-20 overflow-y-auto animate-in slide-in-from-top-4 duration-700">
             <div className="max-w-6xl mx-auto">
                <div className="text-center mb-10 md:mb-16">
                   <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter">Token <span className="text-cyan-400">Vault</span></h1>
                   <p className="text-slate-400 text-sm md:text-lg">পছন্দের প্যাকেজ বেছে নিন</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
                  {[
                    { name: 'Developer Starter', tk: 50, price: '৳ ৫০০', color: 'cyan', icon: <Package/> },
                    { name: 'Pro Builder', tk: 250, price: '৳ ১৫০০', color: 'purple', popular: true, icon: <Rocket/> },
                    { name: 'Agency Master', tk: 1200, price: '৳ ৫০০০', color: 'amber', icon: <Cpu/> }
                  ].map((pkg, i) => (
                    <div key={i} className={`glass-card p-8 md:p-12 rounded-[2.5rem] md:rounded-[4rem] border-white/10 relative transition-all hover:scale-[1.03] group ${pkg.popular ? 'border-cyan-500/40 bg-cyan-500/5' : ''}`}>
                       {pkg.popular && <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-cyan-500 text-black text-[9px] font-black uppercase rounded-full tracking-widest shadow-2xl">Elite Choice</div>}
                       <div className="mb-6 p-4 bg-white/5 w-fit rounded-2xl group-hover:text-cyan-400 transition-colors">{pkg.icon}</div>
                       <h3 className="text-xl md:text-2xl font-black mb-2">{pkg.name}</h3>
                       <div className="text-4xl md:text-6xl font-black text-white mb-6 mt-8 tracking-tighter">{pkg.tk} <span className="text-lg opacity-20 ml-1">TK</span></div>
                       <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl font-black text-lg hover:bg-cyan-500 hover:text-black transition-all active:scale-95">{pkg.price}</button>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        ) : mode === AppMode.SETTINGS ? (
          <div className="flex-1 flex items-center justify-center p-4 lg:p-10 bg-grid">
            <div className="max-w-xl w-full glass-card p-8 md:p-14 rounded-[2.5rem] md:rounded-[4.5rem] border-white/10 shadow-2xl animate-in zoom-in-95 duration-500">
               <div className="flex items-center gap-4 md:gap-5 mb-8 md:mb-12">
                 <div className="p-4 bg-cyan-500/10 rounded-2xl md:rounded-3xl text-cyan-400"><Github size={28}/></div>
                 <div>
                   <h2 className="text-xl md:text-3xl font-black tracking-tight">Cloud Sync</h2>
                   <p className="text-slate-500 text-[11px] md:text-[13px] font-medium">গিটহাব কানেক্ট করুন</p>
                 </div>
               </div>
               <div className="space-y-6 md:space-y-8">
                 <div className="group">
                   <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-5 mb-3 block group-hover:text-cyan-400 transition-colors">GitHub Token</label>
                   <div className="relative">
                     <input type="password" value={github.token} onChange={e => setGithub({...github, token: e.target.value})} className="w-full bg-slate-900/50 border border-white/5 rounded-2xl md:rounded-3xl p-4 pl-12 md:p-5 md:pl-14 text-sm outline-none focus:border-cyan-500/50 transition-all" placeholder="ghp_xxxx"/>
                     <Key className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 text-slate-600" size={16}/>
                   </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="group">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-5 mb-3 block">Username</label>
                      <input type="text" value={github.owner} onChange={e => setGithub({...github, owner: e.target.value})} className="w-full bg-slate-900/50 border border-white/5 rounded-2xl md:rounded-3xl p-4 md:p-5 text-sm outline-none focus:border-cyan-500/50" placeholder="username"/>
                    </div>
                    <div className="group">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-5 mb-3 block">Repository</label>
                      <input type="text" value={github.repo} onChange={e => setGithub({...github, repo: e.target.value})} className="w-full bg-slate-900/50 border border-white/5 rounded-2xl md:rounded-3xl p-4 md:p-5 text-sm outline-none focus:border-cyan-500/50" placeholder="repo-name"/>
                    </div>
                 </div>
                 <button 
                  onClick={() => {
                    alert("গিটহাব সেটিংস সেভ হয়েছে।");
                    setMode(AppMode.PREVIEW);
                  }}
                  className="w-full py-4 md:py-5 bg-cyan-600 rounded-2xl md:rounded-3xl font-black uppercase tracking-[0.2em] text-white mt-4 shadow-2xl hover:bg-cyan-500 transition-all active:scale-95"
                 >
                   SAVE SETTINGS
                 </button>
               </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6 md:p-20 animate-in fade-in duration-1000">
            <div className="max-w-md w-full glass-card p-10 md:p-16 rounded-[3.5rem] md:rounded-[5.5rem] text-center border-white/10 shadow-2xl">
              <div className="w-24 h-24 md:w-36 md:h-36 rounded-[2rem] md:rounded-[3.5rem] border-4 border-cyan-500 mx-auto mb-8 md:mb-10 p-1.5 bg-[#0f172a] overflow-hidden shadow-2xl">
                <img src={user?.avatar_url} className="w-full h-full object-cover" alt="Profile"/>
              </div>
              <h2 className="text-2xl md:text-4xl font-black mb-2 md:mb-3 tracking-tighter">{user?.name}</h2>
              <p className="text-cyan-400/50 text-xs md:text-sm font-bold mb-8 md:mb-12 uppercase tracking-widest">{user?.email}</p>
              <div className="bg-slate-900/80 p-8 md:p-12 rounded-[3rem] md:rounded-[4rem] border border-white/5 shadow-inner">
                <p className="text-[9px] uppercase font-black opacity-20 mb-2 tracking-[0.4em]">Neural Tokens</p>
                <p className="text-5xl md:text-7xl font-black tracking-tighter text-white">{user?.tokens}<span className="text-xl ml-2 opacity-10">UNIT</span></p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
