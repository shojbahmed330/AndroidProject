
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
import { GithubService } from './services/githubService';

const ScanPage: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  const [isScanning, setIsScanning] = useState(false);
  const handleStartAuth = () => {
    setIsScanning(true);
    setTimeout(() => onFinish(), 2000);
  };
  return (
    <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-[#0f172a] text-white p-4 font-sans">
      <div className="flex flex-col items-center text-center animate-in fade-in zoom-in duration-700">
        <h1 className="text-3xl md:text-6xl font-black mb-12 tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white via-cyan-400 to-blue-600">OneClick Studio</h1>
        <div onClick={!isScanning ? handleStartAuth : undefined} className="relative w-32 h-32 md:w-48 md:h-48 flex items-center justify-center cursor-pointer mb-12 group">
          <Fingerprint size={80} className={`${isScanning ? 'text-cyan-400 animate-pulse' : 'text-blue-600 animate-[float_3s_ease-in-out_infinite]'} transition-all z-10 drop-shadow-[0_0_25px_rgba(6,182,212,0.6)]`} />
          {isScanning && <div className="absolute top-0 left-0 w-full h-1 bg-cyan-400 animate-[scanning_1.5s_infinite] z-20 shadow-[0_0_15px_#22d3ee]"></div>}
        </div>
        <h2 className={`text-xs md:text-xl font-bold uppercase tracking-widest ${isScanning ? 'text-cyan-400' : 'text-slate-400'}`}>{isScanning ? 'Scanning Identity...' : 'Touch to Access'}</h2>
      </div>
      <style>{`@keyframes scanning { 0% { top: 0; } 50% { top: 100%; } 100% { top: 0; } } @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }`}</style>
    </div>
  );
};

const AuthPage: React.FC<{ onLoginSuccess: (user: UserType) => void, initialUpdateMode?: boolean }> = ({ onLoginSuccess, initialUpdateMode = false }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', name: '', confirmPassword: '' });
  const [isLoading, setIsLoading] = useState(false);
  const db = DatabaseService.getInstance();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = isRegister ? await db.signUp(formData.email, formData.password, formData.name) : await db.signIn(formData.email, formData.password);
      if (res.error) throw res.error;
      if (isRegister) { alert("Registration successful! Check email."); setIsRegister(false); return; }
      const userData = await db.getUser(formData.email, res.data.user?.id);
      if (userData) onLoginSuccess(userData);
    } catch (error: any) { alert(error.message || "Auth Failed"); } finally { setIsLoading(false); }
  };

  return (
    <div className="h-[100dvh] w-full flex items-center justify-center bg-[#0f172a] text-white p-4">
      <div className="w-full max-w-[400px] glass-card p-8 rounded-[2rem] shadow-2xl">
        <h2 className="text-2xl font-black mb-6 text-cyan-400">{isRegister ? 'New Registry' : 'System Login'}</h2>
        <form onSubmit={handleAuth} className="space-y-4">
          {isRegister && <input type="text" placeholder="Full Name" required className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-sm" onChange={e => setFormData({...formData, name: e.target.value})} />}
          <input type="email" placeholder="Email" required className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-sm" onChange={e => setFormData({...formData, email: e.target.value})} />
          <input type="password" placeholder="Password" required className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-sm" onChange={e => setFormData({...formData, password: e.target.value})} />
          <button className="w-full py-4 bg-blue-600 rounded-xl font-black uppercase text-xs tracking-widest">{isLoading ? <Loader2 className="animate-spin mx-auto"/> : isRegister ? 'Register' : 'Execute Login'}</button>
        </form>
        <button onClick={() => setIsRegister(!isRegister)} className="mt-4 text-xs text-cyan-400 font-bold hover:underline">{isRegister ? 'Already have account? Login' : 'No account? Register'}</button>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<UserType | null>(null);
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
      const session = await db.getCurrentSession();
      if (session?.user) {
        const userData = await db.getUser(session.user.email || '');
        if (userData) {
          setUser(userData);
          const userProjects = await db.getProjects(userData.id);
          setProjects(userProjects);
        }
      }
      // Fetch dynamic prices
      const packages = await db.getTokenPackages();
      setTokenPackages(packages);
    };
    init();
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

  if (!user) return <ScanPage onFinish={() => setUser(DEFAULT_USER)} />;
  if (user.id === 'dev-mode' && !user.isLoggedIn) return <AuthPage onLoginSuccess={(u) => { setUser(u); db.getProjects(u.id).then(setProjects); }} />;

  return (
    <div className="h-[100dvh] flex flex-col text-slate-100 bg-[#020617] overflow-hidden font-['Hind_Siliguri']">
      <header className="h-16 md:h-20 border-b border-white/5 glass-card flex items-center justify-between px-4 md:px-8 z-50">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-cyan-500 rounded-xl flex items-center justify-center"><Cpu size={18} className="text-black"/></div>
          <span className="font-black text-xs md:text-sm uppercase tracking-tighter">OneClick <span className="text-cyan-400">Studio</span></span>
        </div>
        <nav className="flex bg-slate-900/50 rounded-xl p-1 border border-white/5">
          {[AppMode.PROJECTS, AppMode.PREVIEW, AppMode.EDIT, AppMode.SHOP, AppMode.PROFILE].map(m => (
            <button key={m} onClick={() => setMode(m)} className={`px-3 md:px-5 py-1.5 text-[9px] md:text-[11px] font-black uppercase rounded-lg transition-all ${mode === m ? 'bg-cyan-500 text-black' : 'text-slate-400 hover:text-white'}`}>{m}</button>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-4 text-xs font-bold text-cyan-400">{user.tokens} Tokens</div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {mode === AppMode.PROJECTS ? (
          <div className="flex-1 p-6 md:p-12 overflow-y-auto bg-grid">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-10">
                <h1 className="text-3xl md:text-5xl font-black tracking-tighter">My <span className="text-cyan-400">Apps Dashboard</span></h1>
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
                    <p className="text-[10px] text-slate-500 uppercase font-black mb-6">Updated: {new Date(project.updated_at).toLocaleDateString()}</p>
                    <button onClick={() => switchProject(project.id)} className={`w-full py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeProjectId === project.id ? 'bg-cyan-500 text-black' : 'bg-white/5 hover:bg-white/10'}`}>Open Project</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (mode === AppMode.PREVIEW || mode === AppMode.EDIT) ? (
          <>
            <section className="w-full lg:w-[450px] border-r border-white/5 flex flex-col bg-[#01040f] relative">
              <div className="p-4 border-b border-white/5 bg-slate-900/20 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 truncate max-w-[200px]">{activeProject?.name || "No Project"}</span>
                <div className="flex items-center gap-2">
                  <input type="file" ref={fileInputRef} onChange={handleAssetUpload} className="hidden" accept="image/*" />
                  <button onClick={() => fileInputRef.current?.click()} disabled={isUploading || !activeProjectId} className="p-2 text-slate-400 hover:text-cyan-400 transition-colors disabled:opacity-30">
                    {isUploading ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                  </button>
                  <button onClick={() => setMode(AppMode.PROJECTS)} className="text-[9px] font-black uppercase text-slate-500 hover:text-white">Switch App</button>
                </div>
              </div>
              <div className="flex-1 p-6 overflow-y-auto space-y-4 pb-32">
                {messages.map(m => (
                  <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2`}>
                    <div className={`max-w-[90%] p-4 rounded-2xl ${m.role === 'user' ? 'bg-cyan-600 rounded-tr-none' : 'bg-slate-900 border border-white/5 rounded-tl-none'}`}>
                      <p className="text-xs md:text-sm leading-relaxed">{m.content}</p>
                    </div>
                  </div>
                ))}
                {isGenerating && <div className="text-cyan-500 text-[10px] font-black uppercase animate-pulse">AI is building...</div>}
                <div ref={chatEndRef} />
              </div>
              <div className="p-6 absolute bottom-0 w-full bg-gradient-to-t from-[#01040f] to-transparent">
                <div className="relative">
                  <textarea value={input} onChange={e => setInput(e.target.value)} disabled={!activeProjectId} placeholder={activeProjectId ? "Describe changes..." : "Select a project first"} className="w-full bg-slate-900 border border-white/10 rounded-2xl p-4 pr-14 text-sm h-24 outline-none focus:border-cyan-500/50 transition-all resize-none shadow-2xl" />
                  <button onClick={handleSend} className="absolute bottom-4 right-4 p-3 bg-cyan-600 rounded-xl text-white shadow-2xl hover:bg-cyan-500 active:scale-90 disabled:opacity-30"><Send size={18}/></button>
                </div>
              </div>
            </section>
            <section className="flex-1 bg-[#020617] h-full overflow-hidden flex flex-col">
              {mode === AppMode.EDIT ? (
                <div className="flex-1 flex overflow-hidden">
                  <div className="w-64 border-r border-white/5 bg-black/20 p-6 space-y-2">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-4">Files</p>
                    {Object.keys(projectFiles).map(name => (
                      <button key={name} onClick={() => setSelectedFile(name)} className={`w-full text-left px-4 py-2 rounded-xl text-[11px] font-bold flex items-center gap-2 transition-all ${selectedFile === name ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-500 hover:bg-white/5'}`}><FileCode size={14}/> {name}</button>
                    ))}
                  </div>
                  <div className="flex-1 p-8 overflow-hidden flex flex-col">
                    <pre className="flex-1 bg-slate-900/40 rounded-3xl p-8 border border-white/5 overflow-auto text-[13px] font-mono text-cyan-100/60 leading-relaxed shadow-inner">{projectFiles[selectedFile]}</pre>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center p-10 relative">
                  <div className="bg-slate-900 rounded-[4.5rem] h-[780px] w-[380px] border-[14px] border-slate-800 shadow-2xl relative overflow-hidden">
                    <iframe key={activeProjectId + JSON.stringify(projectFiles)} srcDoc={projectFiles['index.html']} className="w-full h-full border-none bg-white" />
                  </div>
                </div>
              )}
            </section>
          </>
        ) : mode === AppMode.SHOP ? (
          <div className="flex-1 p-6 md:p-20 overflow-y-auto bg-grid">
             <div className="max-w-6xl mx-auto text-center mb-16">
               <h1 className="text-4xl md:text-6xl font-black mb-4">Token <span className="text-cyan-400">Vault</span></h1>
               <p className="text-slate-400">Select a package to upgrade your AI capacity</p>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 max-w-6xl mx-auto">
               {tokenPackages.length > 0 ? tokenPackages.map((pkg) => (
                 <div key={pkg.id} className={`glass-card p-8 md:p-12 rounded-[2.5rem] md:rounded-[4rem] border-white/10 relative transition-all hover:scale-105 ${pkg.is_popular ? 'border-cyan-500/40 bg-cyan-500/5' : ''}`}>
                   {pkg.is_popular && <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-cyan-500 text-black text-[9px] font-black uppercase rounded-full">Popular</div>}
                   <h3 className="text-xl md:text-2xl font-black mb-6 md:mb-8">{pkg.name} Package</h3>
                   <div className="text-4xl md:text-6xl font-black text-white mb-6 md:mb-8">{pkg.token_count} <span className="text-lg md:text-xl opacity-20">Tokens</span></div>
                   <button onClick={() => alert(`Payment system integration coming soon for ৳${pkg.price_bdt}`)} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-sm md:text-lg hover:bg-cyan-500 hover:text-black transition-all">৳ {pkg.price_bdt}</button>
                 </div>
               )) : (
                 <div className="col-span-full text-center p-20 glass-card rounded-[3rem]">
                   <Loader2 className="animate-spin mx-auto mb-4 text-cyan-400" size={32} />
                   <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading Price List...</p>
                 </div>
               )}
             </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-20 animate-in fade-in">
            <div className="max-w-md w-full glass-card p-16 rounded-[5.5rem] text-center shadow-2xl">
              <div className="w-36 h-36 rounded-[3.5rem] border-4 border-cyan-500 mx-auto mb-10 p-1.5 bg-[#0f172a] overflow-hidden">
                <img src={user.avatar_url} className="w-full h-full object-cover" alt="Profile"/>
              </div>
              <h2 className="text-4xl font-black mb-2 tracking-tighter">{user.name}</h2>
              <p className="text-cyan-400 text-sm font-bold mb-12 uppercase tracking-widest">{user.email}</p>
              <div className="bg-slate-900 p-12 rounded-[4rem] border border-white/5"><p className="text-[9px] uppercase font-black opacity-20 mb-2">Neural Tokens</p><p className="text-7xl font-black tracking-tighter">{user.tokens}</p></div>
              <button onClick={() => db.signOut().then(() => setUser(null))} className="mt-12 flex items-center justify-center gap-2 w-full py-4 bg-red-500/10 text-red-400 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-red-500 hover:text-white transition-all"><LogOut size={16}/> Sign Out</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const DEFAULT_USER: UserType = { id: 'dev-mode', email: 'dev@oneclick.studio', tokens: 500, isLoggedIn: false, joinedAt: Date.now() };

export default App;
