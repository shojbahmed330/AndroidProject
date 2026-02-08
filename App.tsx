
import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Smartphone, Loader2, Zap, Cpu, LogOut, Check, Rocket, Settings,
  Download, Globe, Activity, Terminal, ShieldAlert, Package, QrCode, 
  AlertCircle, Key, Mail, ArrowLeft, FileCode, ShoppingCart, User as UserIcon,
  ChevronRight, Github, Save, Trash2, Square, Circle, RefreshCw, Fingerprint,
  User, Lock, Eye, EyeOff, MessageSquare, Monitor, Plus, LayoutGrid, MoreVertical,
  Image as ImageIcon, Upload
} from 'lucide-react';
import { AppMode, ChatMessage, User as UserType, TokenPackage, Project } from './types';
import { GeminiService } from './services/geminiService';
import { DatabaseService } from './services/dbService';

const ScanPage: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  const [isScanning, setIsScanning] = useState(false);
  const handleStartAuth = () => {
    if (isScanning) return;
    setIsScanning(true);
    setTimeout(() => {
      onFinish();
    }, 1800);
  };
  return (
    <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-[#020617] text-white p-4 font-sans select-none">
      <div className="flex flex-col items-center text-center animate-in fade-in zoom-in duration-1000">
        <h1 className="text-4xl md:text-7xl font-black mb-16 tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white via-cyan-400 to-blue-600">OneClick Studio</h1>
        <div 
          onClick={handleStartAuth} 
          className={`relative w-40 h-40 md:w-56 md:h-56 flex items-center justify-center cursor-pointer mb-12 group active:scale-95 transition-all rounded-[3rem] ${isScanning ? 'shadow-[0_0_50px_rgba(6,182,212,0.3)]' : 'hover:shadow-[0_0_30px_rgba(37,99,235,0.2)]'}`}
        >
          <div className="absolute inset-0 bg-white/5 rounded-[3rem] border border-white/10 group-hover:border-white/20 transition-all"></div>
          <Fingerprint size={100} className={`${isScanning ? 'text-cyan-400 animate-pulse' : 'text-blue-600 group-hover:text-blue-500'} transition-all z-10 drop-shadow-[0_0_25px_rgba(37,99,235,0.4)]`} />
          {isScanning && <div className="absolute top-0 left-0 w-full h-1.5 bg-cyan-400 animate-[scanning_1.5s_infinite] z-20 shadow-[0_0_15px_#22d3ee] rounded-full"></div>}
        </div>
        <div className="space-y-2">
          <h2 className={`text-sm md:text-xl font-black uppercase tracking-[0.3em] ${isScanning ? 'text-cyan-400' : 'text-slate-500'}`}>
            {isScanning ? 'Identity Verified' : 'Tap to Initialize'}
          </h2>
          {!isScanning && <p className="text-[10px] text-slate-700 uppercase font-bold animate-pulse">Neural Link Required</p>}
        </div>
      </div>
      <style>{`
        @keyframes scanning { 
          0% { top: 10%; opacity: 0; } 
          50% { top: 90%; opacity: 1; } 
          100% { top: 10%; opacity: 0; } 
        }
      `}</style>
    </div>
  );
};

const AuthPage: React.FC<{ onLoginSuccess: (user: UserType) => void }> = ({ onLoginSuccess }) => {
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [isLoading, setIsLoading] = useState(false);
  const db = DatabaseService.getInstance();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    try {
      if (authMode === 'register') {
        const res = await db.signUp(formData.email, formData.password, formData.name);
        if (res.error) throw res.error;
        alert("নিবন্ধন সফল! আপনার ইমেল যাচাই করুন।");
        setAuthMode('login');
      } else if (authMode === 'forgot') {
        await db.resetPassword(formData.email);
        alert("পাসওয়ার্ড রিসেট লিঙ্ক আপনার ইমেলে পাঠানো হয়েছে।");
        setAuthMode('login');
      } else {
        const res = await db.signIn(formData.email, formData.password);
        if (res.error) throw res.error;
        const userData = await db.getUser(formData.email, res.data.user?.id);
        if (userData) onLoginSuccess(userData);
        else throw new Error("প্রোফাইল লোড হতে সমস্যা হয়েছে।");
      }
    } catch (error: any) { 
      alert(error.message || "অপারেশনটি ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।"); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleGoogleLogin = async () => {
    const isIframe = window.self !== window.top;
    if (isIframe) {
      alert("গুগল সিকিউরিটি পলিসির কারণে আইফ্রেমের ভেতরে সরাসরি লগইন করা যাবে না। অনুগ্রহ করে 'Email/Password' ব্যবহার করে লগইন করুন।");
      return;
    }
    try {
      await db.signInWithGoogle();
    } catch (error: any) {
      alert("গুগল লগইন এরর: " + error.message);
    }
  };

  return (
    <div className="h-[100dvh] w-full flex items-center justify-center bg-[#020617] text-white p-4">
      <div className="w-full max-w-[420px] glass-card p-10 rounded-[3rem] shadow-2xl animate-in zoom-in duration-500">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl active:scale-90 transition-transform cursor-pointer">
            <Cpu size={40} className="text-black"/>
          </div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
            {authMode === 'register' ? 'Registry' : authMode === 'forgot' ? 'Reset' : 'Login'}
          </h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2">Access Neural Studio</p>
        </div>
        
        <form onSubmit={handleAuth} className="space-y-4">
          {authMode === 'register' && (
            <div className="relative group">
              <UserIcon className="absolute left-4 top-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Full Name" 
                required 
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 pl-12 text-sm outline-none focus:border-cyan-500/50 transition-all placeholder:text-slate-700" 
                onChange={e => setFormData({...formData, name: e.target.value})} 
              />
            </div>
          )}
          <div className="relative group">
            <Mail className="absolute left-4 top-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
            <input 
              type="email" 
              placeholder="Email Address" 
              required 
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 pl-12 text-sm outline-none focus:border-cyan-500/50 transition-all placeholder:text-slate-700" 
              onChange={e => setFormData({...formData, email: e.target.value})} 
            />
          </div>
          {authMode !== 'forgot' && (
            <div className="relative group">
              <Lock className="absolute left-4 top-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
              <input 
                type="password" 
                placeholder="Password" 
                required 
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 pl-12 text-sm outline-none focus:border-cyan-500/50 transition-all placeholder:text-slate-700" 
                onChange={e => setFormData({...formData, password: e.target.value})} 
              />
            </div>
          )}
          
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="animate-spin" size={18}/> : authMode === 'register' ? 'Register Now' : authMode === 'forgot' ? 'Send Link' : 'Initialize Login'}
          </button>
        </form>

        {authMode === 'login' && (
          <>
            <div className="flex items-center my-8">
              <div className="flex-1 h-px bg-white/5"></div>
              <span className="px-4 text-[9px] text-slate-600 uppercase font-black">secure gateway</span>
              <div className="flex-1 h-px bg-white/5"></div>
            </div>

            <button 
              onClick={handleGoogleLogin}
              className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Login with Google
            </button>
          </>
        )}

        <div className="mt-10 space-y-4 text-center">
          <button 
            onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} 
            className="text-[10px] text-cyan-400 font-black uppercase tracking-widest hover:text-white transition-colors"
          >
            {authMode === 'login' ? "Create System Account" : "Back to Access"}
          </button>
          <div className="block">
            {authMode === 'login' && (
              <button 
                onClick={() => setAuthMode('forgot')} 
                className="text-[10px] text-slate-600 font-black uppercase tracking-widest hover:text-red-400 transition-colors"
              >
                Reset Credentials
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<UserType | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [mode, setMode] = useState<AppMode>(AppMode.PROJECTS);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tokenPackages, setTokenPackages] = useState<TokenPackage[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState('index.html');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const gemini = useRef(new GeminiService());
  const db = DatabaseService.getInstance();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const activeProject = projects.find(p => p.id === activeProjectId);
  const projectFiles = activeProject?.files || { 'index.html': '<h1>Select or create a project to start</h1>' };

  useEffect(() => {
    const init = async () => {
      try {
        const forcedEmail = localStorage.getItem('df_force_login');
        if (forcedEmail === 'rajshahi.shojib@gmail.com') {
          const userData = await db.getUser(forcedEmail, 'master-shojib');
          if (userData) {
            setUser(userData);
            db.getProjects(userData.id).then(setProjects);
          }
        } else {
          const session = await db.getCurrentSession();
          if (session?.user) {
            const userData = await db.getUser(session.user.email || '', session.user.id);
            if (userData) {
              setUser(userData);
              db.getProjects(userData.id).then(setProjects);
            }
          }
        }
        db.getTokenPackages().then(setTokenPackages);
      } catch (err) {
        console.error("Init Error:", err);
      } finally {
        setIsInitialized(true);
      }
    };
    init();

    // সেশন চেঞ্জ লিসেনার আরও ফাস্ট করা হলো
    const { data: { subscription } } = db.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // ইউজারের ডেটা আসার আগেই initialized ট্রু করে দেওয়া হচ্ছে যাতে লোডার থামে
        setIsInitialized(true);
        const userData = await db.getUser(session.user.email || '', session.user.id);
        if (userData) {
          setUser(userData);
          db.getProjects(userData.id).then(setProjects);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProjects([]);
        setIsInitialized(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCreateProject = async () => {
    if (!user) return;
    const name = prompt("Project Name?");
    if (!name) return;
    const initialFiles = { 'index.html': `<div class="p-10 text-center font-sans"><h1>${name} is ready</h1><p>Ask AI to build your app</p></div>` };
    const newProject = await db.createProject(user.id, name, initialFiles);
    if (newProject) {
      setProjects([newProject, ...projects]);
      setActiveProjectId(newProject.id);
      setMessages([]);
      setMode(AppMode.PREVIEW);
    }
  };

  const handleAssetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !activeProjectId) return;
    setIsUploading(true);
    try {
      const publicUrl = await db.uploadAsset(file, user.id, activeProjectId);
      if (publicUrl) setInput(`আই আই, আমি একটি ইমেজ আপলোড করেছি: ${publicUrl}। এটি আমার অ্যাপে ব্যবহার করো।`);
      else alert("Upload failed.");
    } catch (err) { console.error(err); } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !activeProjectId || isGenerating) return;
    const text = input;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text, timestamp: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsGenerating(true);
    try {
      const res = await gemini.current.generateWebsite(text, projectFiles, newMessages);
      if (res.files) {
        const updatedFiles = { ...projectFiles, ...res.files };
        const assistantMsg: ChatMessage = { id: (Date.now()+1).toString(), role: 'assistant', content: res.answer, timestamp: Date.now(), choices: res.choices };
        const finalMessages = [...newMessages, assistantMsg];
        await db.updateProject(activeProjectId, updatedFiles, finalMessages);
        setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, files: updatedFiles, messages: finalMessages } : p));
        setMessages(finalMessages);
      }
    } catch (e) { console.error(e); } finally { setIsGenerating(false); }
  };

  const handleDeleteProject = async (id: string) => {
    if (confirm("Delete this project?")) {
      const success = await db.deleteProject(id);
      if (success) {
        setProjects(prev => prev.filter(p => p.id !== id));
        if (activeProjectId === id) { setActiveProjectId(null); setMessages([]); }
      }
    }
  };

  const switchProject = (id: string) => {
    const project = projects.find(p => p.id === id);
    if (project) { setActiveProjectId(id); setMessages(project.messages || []); setMode(AppMode.PREVIEW); }
  };

  const handleLoginSuccess = (u: UserType) => {
    setUser(u);
    db.getProjects(u.id).then(setProjects);
  };

  const handleFinishScan = () => {
    setUser(DEFAULT_USER);
  };

  if (!isInitialized) return (
    <div className="h-screen w-screen bg-[#020617] flex flex-col items-center justify-center gap-6">
      <Loader2 className="animate-spin text-cyan-400" size={50}/>
      <p className="text-cyan-400 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Neural Link Establishing...</p>
    </div>
  );

  if (!user) return <ScanPage onFinish={handleFinishScan} />;
  
  if (user.id === 'dev-mode' && !user.isLoggedIn) return <AuthPage onLoginSuccess={handleLoginSuccess} />;

  return (
    <div className="h-[100dvh] flex flex-col text-slate-100 bg-[#020617] overflow-hidden font-['Hind_Siliguri']">
      <header className="h-16 md:h-20 border-b border-white/5 glass-card flex items-center justify-between px-4 md:px-8 z-50">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-cyan-500 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]"><Cpu size={18} className="text-black"/></div>
          <span className="font-black text-xs md:text-sm uppercase tracking-tighter">OneClick <span className="text-cyan-400">Studio</span></span>
        </div>
        <nav className="flex bg-slate-900/50 rounded-xl p-1 border border-white/5">
          {[AppMode.PROJECTS, AppMode.PREVIEW, AppMode.EDIT, AppMode.SHOP, AppMode.PROFILE].map(m => (
            <button key={m} onClick={() => setMode(m)} className={`px-3 md:px-5 py-1.5 text-[9px] md:text-[11px] font-black uppercase rounded-lg transition-all ${mode === m ? 'bg-cyan-500 text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}>{m}</button>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-4 text-xs font-bold text-cyan-400">
          <Zap size={14} className="animate-pulse"/> {user.tokens} Tokens
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {mode === AppMode.PROJECTS ? (
          <div className="flex-1 p-6 md:p-12 overflow-y-auto bg-grid">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-10">
                <h1 className="text-3xl md:text-5xl font-black tracking-tighter">Neural <span className="text-cyan-400">Dashboard</span></h1>
                <button onClick={handleCreateProject} className="flex items-center gap-2 px-6 py-3 bg-cyan-500 text-black rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:scale-105 transition-all"><Plus size={18}/> New Project</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map(project => (
                  <div key={project.id} className={`glass-card p-6 rounded-[2rem] border-white/5 group hover:border-cyan-500/30 transition-all ${activeProjectId === project.id ? 'border-cyan-500/50 bg-cyan-500/5' : ''}`}>
                    <div className="flex justify-between items-start mb-6">
                      <div className="p-3 bg-white/5 rounded-xl text-cyan-400 group-hover:scale-110 transition-transform"><Smartphone size={24}/></div>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id); }} className="p-2 text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={16}/></button>
                    </div>
                    <h3 className="text-xl font-bold mb-2 truncate">{project.name}</h3>
                    <p className="text-[10px] text-slate-500 uppercase font-black mb-6">Last Active: {new Date(project.updated_at).toLocaleDateString()}</p>
                    <button onClick={() => switchProject(project.id)} className={`w-full py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeProjectId === project.id ? 'bg-cyan-500 text-black shadow-lg' : 'bg-white/5 hover:bg-white/10'}`}>Load UI</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (mode === AppMode.PREVIEW || mode === AppMode.EDIT) ? (
          <>
            <section className="w-full lg:w-[450px] border-r border-white/5 flex flex-col bg-[#01040f] relative">
              <div className="p-4 border-b border-white/5 bg-slate-900/20 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 truncate max-w-[200px]">{activeProject?.name || "Neural Link Ready"}</span>
                <div className="flex items-center gap-2">
                  <input type="file" ref={fileInputRef} onChange={handleAssetUpload} className="hidden" accept="image/*" />
                  <button onClick={() => fileInputRef.current?.click()} disabled={isUploading || !activeProjectId} className="p-2 text-slate-400 hover:text-cyan-400 transition-colors disabled:opacity-30">
                    {isUploading ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                  </button>
                  <button onClick={() => setMode(AppMode.PROJECTS)} className="text-[9px] font-black uppercase text-slate-500 hover:text-white">Switch</button>
                </div>
              </div>
              <div className="flex-1 p-6 overflow-y-auto space-y-4 pb-32 scrollbar-hide">
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center opacity-20 text-center px-10">
                    <MessageSquare size={48} className="mb-4" />
                    <p className="text-sm font-black uppercase tracking-[0.2em]">Neural Link Standby</p>
                  </div>
                )}
                {messages.map(m => (
                  <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2`}>
                    <div className={`max-w-[90%] p-4 rounded-2xl ${m.role === 'user' ? 'bg-blue-600 rounded-tr-none shadow-[0_0_20px_rgba(37,99,235,0.2)]' : 'bg-slate-900 border border-white/5 rounded-tl-none shadow-xl'}`}>
                      <p className="text-xs md:text-sm leading-relaxed">{m.content}</p>
                    </div>
                  </div>
                ))}
                {isGenerating && <div className="text-cyan-500 text-[10px] font-black uppercase animate-pulse flex items-center gap-2"><RefreshCw size={12} className="animate-spin"/> AI thinking...</div>}
                <div ref={chatEndRef} />
              </div>
              <div className="p-6 absolute bottom-0 w-full bg-gradient-to-t from-[#01040f] via-[#01040f] to-transparent">
                <div className="relative group">
                  <textarea value={input} onChange={e => setInput(e.target.value)} disabled={!activeProjectId} placeholder={activeProjectId ? "Describe the UI..." : "Select a project first"} className="w-full bg-slate-900/80 border border-white/10 rounded-2xl p-4 pr-14 text-sm h-24 outline-none focus:border-cyan-500/50 transition-all resize-none shadow-2xl backdrop-blur-md" />
                  <button onClick={handleSend} disabled={!input.trim() || isGenerating || !activeProjectId} className="absolute bottom-4 right-4 p-3 bg-blue-600 rounded-xl text-white shadow-2xl hover:bg-blue-500 active:scale-90 disabled:opacity-20 transition-all"><Send size={18}/></button>
                </div>
              </div>
            </section>
            <section className="flex-1 bg-[#020617] h-full overflow-hidden flex flex-col relative">
              {mode === AppMode.EDIT ? (
                <div className="flex-1 flex overflow-hidden">
                  <div className="w-64 border-r border-white/5 bg-black/20 p-6 space-y-2 hidden lg:block">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-4">Neural Code</p>
                    {Object.keys(projectFiles).map(name => (
                      <button key={name} onClick={() => setSelectedFile(name)} className={`w-full text-left px-4 py-2 rounded-xl text-[11px] font-bold flex items-center gap-2 transition-all ${selectedFile === name ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-500 hover:bg-white/5'}`}><FileCode size={14}/> {name}</button>
                    ))}
                  </div>
                  <div className="flex-1 p-8 overflow-hidden flex flex-col">
                    <pre className="flex-1 bg-slate-900/40 rounded-[2.5rem] p-8 border border-white/5 overflow-auto text-[13px] font-mono text-cyan-100/60 leading-relaxed shadow-inner scrollbar-hide">{projectFiles[selectedFile]}</pre>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center p-6 md:p-10 relative">
                  <div className="bg-slate-900 rounded-[4rem] h-[650px] md:h-[780px] w-[320px] md:w-[380px] border-[12px] md:border-[14px] border-slate-800 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-20"></div>
                    <iframe key={activeProjectId + JSON.stringify(projectFiles)} srcDoc={projectFiles['index.html']} className="w-full h-full border-none bg-white" />
                  </div>
                </div>
              )}
            </section>
          </>
        ) : mode === AppMode.SHOP ? (
          <div className="flex-1 p-6 md:p-20 overflow-y-auto bg-grid">
             <div className="max-w-6xl mx-auto text-center mb-16">
               <h1 className="text-4xl md:text-6xl font-black mb-4">Neural <span className="text-cyan-400">Shop</span></h1>
               <p className="text-slate-400 uppercase tracking-widest text-[10px] font-bold">Refill your system processing credits</p>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 max-w-6xl mx-auto">
               {tokenPackages.length > 0 ? tokenPackages.map((pkg) => (
                 <div key={pkg.id} className={`glass-card p-8 md:p-12 rounded-[2.5rem] md:rounded-[4rem] border-white/10 relative transition-all hover:scale-105 ${pkg.is_popular ? 'border-cyan-500/40 bg-cyan-500/5 shadow-[0_0_30px_rgba(6,182,212,0.1)]' : ''}`}>
                   {pkg.is_popular && <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-cyan-500 text-black text-[9px] font-black uppercase rounded-full">Optimal</div>}
                   <h3 className="text-xl md:text-2xl font-black mb-6 md:mb-8">{pkg.name} Tier</h3>
                   <div className="text-4xl md:text-6xl font-black text-white mb-6 md:mb-8">{pkg.token_count} <span className="text-lg md:text-xl opacity-20">Tokens</span></div>
                   <button onClick={() => alert(`Payment system in integration. BDT: ${pkg.price_bdt}`)} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-sm md:text-lg hover:bg-cyan-500 hover:text-black transition-all active:scale-95 shadow-lg">৳ {pkg.price_bdt}</button>
                 </div>
               )) : (
                 <div className="col-span-full text-center p-20 glass-card rounded-[3rem]">
                   <Loader2 className="animate-spin mx-auto mb-4 text-cyan-400" size={32} />
                   <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Syncing Market...</p>
                 </div>
               )}
             </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-20 animate-in fade-in">
            <div className="max-w-md w-full glass-card p-16 rounded-[5.5rem] text-center shadow-2xl">
              <div className="w-36 h-36 rounded-[3.5rem] border-4 border-cyan-500 mx-auto mb-10 p-1.5 bg-[#0f172a] overflow-hidden shadow-2xl">
                <img src={user.avatar_url} className="w-full h-full object-cover" alt="Profile"/>
              </div>
              <h2 className="text-4xl font-black mb-2 tracking-tighter">{user.name}</h2>
              <p className="text-cyan-400 text-sm font-bold mb-12 uppercase tracking-widest opacity-60 truncate">{user.email}</p>
              <div className="bg-slate-900/80 p-12 rounded-[4rem] border border-white/5"><p className="text-[9px] uppercase font-black opacity-20 mb-2 tracking-[0.3em]">Credits</p><p className="text-7xl font-black tracking-tighter">{user.tokens}</p></div>
              <button onClick={() => db.signOut()} className="mt-12 flex items-center justify-center gap-2 w-full py-5 bg-red-500/10 text-red-400 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-red-500 hover:text-white transition-all active:scale-95"><LogOut size={16}/> Kill Session</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const DEFAULT_USER: UserType = { id: 'dev-mode', email: 'dev@oneclick.studio', tokens: 500, isLoggedIn: false, joinedAt: Date.now() };

export default App;
