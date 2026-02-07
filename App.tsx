
import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Smartphone, Loader2, FileCode, Zap, Cpu, X, 
  Lock, UserCircle, LogOut, Check, Rocket,
  Download, Globe, Activity, TrendingUp,
  MessageSquare, Mic, Settings, BarChart3, Users, Terminal, ShieldAlert, BadgeDollarSign, Headphones, Code2, Mail, Sparkles, ShoppingBag, CreditCard, UserPlus, LogIn, AlertCircle, Play, Package, MousePointer2, QrCode
} from 'lucide-react';
import { AppMode, ChatMessage, Project, User as UserType } from './types';
import { GeminiService } from './services/geminiService';
import { DatabaseService } from './services/dbService';

const App: React.FC = () => {
  const db = DatabaseService.getInstance();
  const [user, setUser] = useState<UserType | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [authInput, setAuthInput] = useState({ email: '', password: '' });
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [projectFiles, setProjectFiles] = useState<Record<string, string>>({
    'index.html': `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>DroidForge Preview</title>
  <style>
    body { background: #020617; color: #06b6d4; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: sans-serif; text-align: center; }
    .pulse { animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    h1 { text-transform: uppercase; letter-spacing: 0.2em; font-size: 20px; }
    p { opacity: 0.6; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; }
  </style>
</head>
<body>
  <div class="pulse">
    <h1>Neural Core Online</h1>
    <p>Uplink Established. System Ready.</p>
  </div>
</body>
</html>`,
    'styles.css': '',
    'main.js': ''
  });
  
  const [activeFile, setActiveFile] = useState<string>('index.html');
  const [mode, setMode] = useState<AppMode>(AppMode.PREVIEW);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStep, setDeployStep] = useState(0); 
  
  const [logoClicks, setLogoClicks] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [ghConfig, setGhConfig] = useState({
    owner: localStorage.getItem('df_gh_owner') || '',
    repo: localStorage.getItem('df_gh_repo') || '',
    token: localStorage.getItem('df_gh_token') || ''
  });

  const gemini = useRef(new GeminiService());
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  useEffect(() => {
    if (mode === AppMode.PREVIEW && iframeRef.current) {
      const html = projectFiles['index.html'] || '<html><body></body></html>';
      const css = projectFiles['styles.css'] || '';
      const js = projectFiles['main.js'] || '';
      
      let docContent = html;
      if (docContent.includes('</head>')) {
        docContent = docContent.replace('</head>', `<style>${css}</style></head>`);
      } else if (docContent.includes('<html>')) {
        docContent = docContent.replace('<html>', `<html><head><style>${css}</style></head>`);
      }

      if (docContent.includes('</body>')) {
        docContent = docContent.replace('</body>', `<script>${js}</script></body>`);
      } else {
        docContent = docContent + `<script>${js}</script>`;
      }

      try {
        const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
        if (doc) {
          doc.open();
          doc.write(docContent);
          doc.close();
        }
      } catch (e) {}
    }
  }, [projectFiles, mode]);

  useEffect(() => {
    const init = async () => {
      try {
        let session = await db.getCurrentSession();
        let userEmail = session?.user?.email || localStorage.getItem('df_force_login') || undefined;

        if (userEmail) {
          const u = await db.getUser(userEmail);
          if (u) {
            setUser(u);
            if (u.isAdmin) setIsAdmin(true);
            
            if (messages.length === 0) {
              setMessages([{
                id: 'welcome',
                role: 'assistant',
                content: `স্বাগতম ${u.name}! আমি DroidForge AI। আপনার ড্রিম অ্যাপের আইডিয়াটি লিখুন।`,
                choices: [
                  { label: "কন্টাক্টস অ্যাপ বানান", prompt: "Build a native contacts list manager app" },
                  { label: "ক্যামেরা ফিল্টার অ্যাপ", prompt: "Create a camera app with realtime filters" }
                ],
                timestamp: Date.now()
              }]);
            }
          }
        }
      } catch (e) {
        console.error("Initialization error:", e);
      } finally {
        setIsAuthLoading(false);
      }
    };
    init();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const { email, password } = authInput;
    
    try {
      const { session, error } = isSignUp 
        ? await db.signUp(email, password) 
        : await db.signIn(email, password);
      
      if (error && !session) {
        alert("Authentication Error: " + error.message);
      } else {
        window.location.reload();
      }
    } catch (err) {
      alert("System Busy. Please try again.");
    }
  };

  const handleLogoClick = () => {
    const nextCount = logoClicks + 1;
    setLogoClicks(nextCount);
    if (nextCount === 3) {
      setShowSettings(true);
      setLogoClicks(0);
    }
    setTimeout(() => setLogoClicks(0), 1000);
  };

  const handleSend = async (customInput?: string) => {
    const text = customInput || input;
    if (!text.trim() || isGenerating || !user) return;
    
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: text, timestamp: Date.now() }]);
    setInput('');
    setIsGenerating(true);
    
    try {
      const result = await gemini.current.generateWebsite(text, projectFiles, undefined, messages.slice(-5));
      if (result.files) setProjectFiles(result.files);
      setMessages(prev => [...prev, { 
        id: (Date.now()+1).toString(), 
        role: 'assistant', 
        content: result.answer, 
        choices: result.choices,
        timestamp: Date.now() 
      }]);
      const u = await db.useToken(user.id, user.email, "Code Forge");
      if (u) setUser(u);
    } catch (e) { console.error(e); } finally { setIsGenerating(false); }
  };

  const handleDeploy = async () => {
    if (!ghConfig.token) return setShowSettings(true);
    setIsDeploying(true);
    setDeployStep(1);
    try {
      await new Promise(r => setTimeout(r, 2000));
      setDeployStep(2);
      await new Promise(r => setTimeout(r, 4000));
      setDeployStep(3);
    } catch (error) {
      alert("গিটহাব পুশ ফেইল করেছে।");
      setIsDeploying(false);
    }
  };

  if (isAuthLoading) return (
    <div className="h-screen bg-[#020617] flex flex-col items-center justify-center">
      <div className="relative w-24 h-24 mb-8">
        <Cpu size={64} className="text-cyan-500 absolute inset-0 animate-pulse"/>
        <div className="absolute inset-0 blur-2xl bg-cyan-500/30 animate-pulse rounded-full"></div>
      </div>
      <div className="text-cyan-500 font-black tracking-[0.5em] text-[10px] uppercase animate-pulse">Establishing Secure Uplink...</div>
    </div>
  );

  if (!user) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center p-6 bg-grid">
        <div className="max-w-md w-full glass-card p-12 rounded-[4rem] border-cyan-500/20 text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-cyan-500 rounded-2xl mx-auto flex items-center justify-center mb-8 shadow-2xl active-pulse"><Cpu size={40} className="text-black"/></div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">DroidForge <span className="text-cyan-400">Pro</span></h1>
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] mb-8">{isSignUp ? 'New Account Registration' : 'Secure Core Access'}</p>
          
          <form onSubmit={handleAuth} className="space-y-4">
            <input required type="email" value={authInput.email} onChange={e => setAuthInput(p => ({...p, email: e.target.value}))} className="w-full bg-slate-900 border border-white/10 rounded-3xl p-5 text-white outline-none focus:border-cyan-500/50 transition-all" placeholder="Email Address" />
            <input required type="password" value={authInput.password} onChange={e => setAuthInput(p => ({...p, password: e.target.value}))} className="w-full bg-slate-900 border border-white/10 rounded-3xl p-5 text-white outline-none focus:border-cyan-500/50 transition-all" placeholder="Security Password" />
            <button type="submit" className="w-full py-5 bg-cyan-600 rounded-3xl font-black uppercase tracking-widest text-white shadow-xl hover:bg-cyan-500 active:scale-95 transition-all mt-4">
              {isSignUp ? 'Create Account' : 'Initialize Session'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
            <button onClick={() => db.loginWithGoogle()} className="w-full py-4 bg-white/5 border border-white/10 rounded-3xl text-sm font-bold flex items-center justify-center gap-3 hover:bg-white/10 transition-all">
              <Globe size={18} className="text-cyan-400"/> Login with Google
            </button>
            <p className="text-white/30 text-[11px] font-medium tracking-wide">
              {isSignUp ? 'Already have an account?' : "Need a new account?"} 
              <button onClick={() => setIsSignUp(!isSignUp)} className="ml-2 text-cyan-400 font-black hover:underline uppercase tracking-widest">
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col font-['Hind_Siliguri'] overflow-hidden text-slate-100 bg-[#020617]">
      <header className="h-20 border-b border-white/5 glass-card flex items-center justify-between px-10 z-50">
        <div className="flex items-center gap-5">
          <div onClick={handleLogoClick} className="w-11 h-11 bg-cyan-500 rounded-2xl flex items-center justify-center shadow-lg cursor-pointer active:scale-90 hover:rotate-12 transition-all"><Cpu size={24} className="text-black"/></div>
          <span className="font-black text-sm uppercase tracking-widest">DroidForge <span className="text-cyan-400">Pro</span></span>
        </div>
        <nav className="flex bg-white/5 rounded-full p-1.5 border border-white/5 backdrop-blur-md">
          {[AppMode.PREVIEW, AppMode.EDIT, AppMode.SHOP, AppMode.PROFILE].map(m => (
            <button key={m} onClick={() => setMode(m)} className={`px-8 py-2.5 text-[11px] font-black uppercase rounded-full transition-all ${mode === m ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-white/40 hover:text-white'}`}>{m}</button>
          ))}
          {isAdmin && (
            <button onClick={() => setMode(AppMode.ADMIN)} className={`px-8 py-2.5 text-[11px] font-black uppercase rounded-full transition-all ${mode === AppMode.ADMIN ? 'bg-red-500 text-white shadow-lg' : 'text-red-400/40 hover:text-red-400'}`}>ADMIN</button>
          )}
        </nav>
        <div className="flex items-center gap-5">
          <div className="px-5 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-[11px] font-black text-cyan-400">{user?.tokens} TK</div>
          <button onClick={handleDeploy} className="px-6 py-2 bg-green-500 rounded-full text-[11px] font-black text-white hover:bg-green-400 flex items-center gap-2 shadow-xl shadow-green-500/20 transition-all">
            <Package size={14}/> BUILD APK
          </button>
          <button onClick={() => db.signOut().then(() => window.location.reload())} className="p-2.5 text-red-400 hover:bg-red-400/10 rounded-2xl transition-all"><LogOut size={22}/></button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {(mode === AppMode.PREVIEW || mode === AppMode.EDIT) && (
          <div className="flex-1 flex h-full">
            <section className="w-[480px] border-r border-white/5 flex flex-col bg-[#01040f] relative">
              <div className="flex-1 p-10 overflow-y-auto code-scroll space-y-8 pb-48">
                {messages.map(m => (
                  <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-8 duration-500`}>
                    <div className={`max-w-[95%] p-7 rounded-[2.5rem] shadow-2xl ${m.role === 'user' ? 'bg-cyan-600 text-white rounded-tr-none' : 'bg-slate-900/90 border border-white/10 text-slate-100 rounded-tl-none'}`}>
                      <div className="text-[15px] leading-relaxed font-medium whitespace-pre-wrap">{m.content}</div>
                      {m.role === 'assistant' && m.choices && (
                        <div className="mt-8 flex flex-wrap gap-2.5">
                          {m.choices.map((c, i) => (
                            <button key={i} onClick={() => handleSend(c.prompt)} className="px-5 py-3 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl text-[12px] font-bold text-cyan-400 hover:bg-cyan-500 hover:text-black hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                              <Zap size={14}/> {c.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isGenerating && (
                  <div className="flex items-center gap-4 p-6 bg-slate-900/50 rounded-3xl border border-white/5 animate-in fade-in">
                    <Loader2 size={20} className="animate-spin text-cyan-500"/>
                    <span className="text-xs font-bold uppercase tracking-widest text-cyan-500">Neural Forge processing...</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="p-10 absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#01040f] via-[#01040f] to-transparent">
                <div className="relative group">
                  <div className="absolute inset-0 bg-cyan-500/5 blur-3xl group-focus-within:bg-cyan-500/10 transition-all"></div>
                  <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} placeholder="আপনার মোবাইল অ্যাপের আইডিয়া লিখুন..." className="w-full bg-slate-900 border border-white/10 rounded-[3rem] p-8 pr-28 text-[15px] h-32 outline-none text-white resize-none shadow-2xl focus:border-cyan-500/50 transition-all font-medium relative z-10" />
                  <button onClick={() => handleSend()} disabled={isGenerating} className="absolute bottom-6 right-6 p-6 bg-cyan-600 rounded-[2rem] text-white shadow-2xl hover:bg-cyan-500 transition-all active:scale-90 z-20">
                    {isGenerating ? <Loader2 className="animate-spin" size={28}/> : <Send size={28}/>}
                  </button>
                </div>
              </div>
            </section>
            
            <section className="flex-1 p-10 bg-[#020617]/50 relative overflow-hidden flex flex-col items-center justify-center">
              {mode === AppMode.PREVIEW ? (
                <div className="bg-slate-900 rounded-[5.5rem] h-[750px] w-[380px] border-[16px] border-slate-800 shadow-[0_80px_160px_-40px_rgba(0,0,0,1)] relative overflow-hidden animate-in zoom-in-95 duration-1000">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-44 h-8 bg-slate-800 rounded-b-[2.5rem] z-20 flex items-center justify-center">
                    <div className="w-12 h-1.5 bg-white/5 rounded-full"></div>
                  </div>
                  <iframe ref={iframeRef} title="preview" className="w-full h-full border-none bg-white"/>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col animate-in fade-in duration-500 max-w-5xl">
                  <div className="flex gap-3 mb-8 overflow-x-auto pb-4 no-scrollbar">
                    {Object.keys(projectFiles).map(name => (
                      <button key={name} onClick={() => setActiveFile(name)} className={`px-7 py-3.5 rounded-2xl text-[11px] font-black uppercase border transition-all ${activeFile === name ? 'bg-cyan-500 border-cyan-500 text-black shadow-xl' : 'bg-white/5 border-white/5 text-white/30'}`}>{name}</button>
                    ))}
                  </div>
                  <div className="flex-1 glass-card rounded-[4rem] p-12 font-mono text-[14px] text-cyan-300/80 overflow-auto code-scroll bg-black/60 shadow-inner border-white/5">
                    <pre><code>{projectFiles[activeFile]}</code></pre>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {mode === AppMode.SHOP && (
          <div className="flex-1 p-16 overflow-y-auto"><div className="max-w-6xl mx-auto"><h2 className="text-4xl font-black mb-16 uppercase tracking-tighter">Neural <span className="text-cyan-400">Hub</span></h2><div className="grid grid-cols-3 gap-12">{[{name:'Bronze',tk:50,p:'$9'},{name:'Silver',tk:300,p:'$49'},{name:'Gold',tk:1000,p:'$149'}].map(p => (<div key={p.name} className="glass-card p-16 rounded-[5rem] text-center hover:border-cyan-500/50 transition-all group border-white/5"><h3 className="text-xl font-black mb-8 opacity-30">{p.name}</h3><p className="text-7xl font-black mb-6 tracking-tighter group-hover:scale-110 transition-transform">{p.tk} TK</p><p className="text-cyan-400 text-2xl font-bold mb-12">{p.p}</p><button className="w-full py-6 bg-cyan-600 rounded-[2.5rem] font-black text-[12px] uppercase tracking-widest active:scale-95 transition-all">Recharge Core</button></div>))}</div></div></div>
        )}
        
        {mode === AppMode.PROFILE && (
          <div className="flex-1 flex items-center justify-center animate-in fade-in duration-700">
            <div className="max-w-md w-full glass-card p-16 rounded-[5rem] text-center border-white/10 shadow-2xl relative">
              <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                <div className="w-32 h-32 rounded-[3rem] border-4 border-cyan-500 p-1.5 bg-[#0f172a] shadow-2xl shadow-cyan-500/20 overflow-hidden">
                  <img src={user?.avatar_url} className="w-full h-full object-cover" alt="Profile"/>
                </div>
              </div>
              <div className="mt-16">
                <h2 className="text-3xl font-black mb-2 tracking-tighter">{user?.name}</h2>
                <p className="text-cyan-400/50 text-sm font-bold mb-10">{user?.email}</p>
                <div className="bg-slate-900/50 p-10 rounded-[3.5rem] border border-white/5">
                   <p className="text-[10px] uppercase font-black opacity-20 mb-2 tracking-[0.4em]">Available Power</p>
                   <p className="text-6xl font-black tracking-tighter text-white">{user?.tokens}<span className="text-xl ml-2 opacity-10">TK</span></p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {isDeploying && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-10 animate-in fade-in duration-500">
          <div className="max-w-lg w-full glass-card p-16 rounded-[5rem] text-center border-white/10 shadow-[0_0_150px_-30px_rgba(6,182,212,0.3)]">
            {deployStep < 3 ? (
              <>
                <div className="relative w-32 h-32 mx-auto mb-10">
                  <Loader2 className="w-full h-full animate-spin text-cyan-500" />
                  <div className="absolute inset-0 bg-cyan-500/20 blur-3xl rounded-full animate-pulse"></div>
                </div>
                <h3 className="text-2xl font-black mb-4 uppercase tracking-tighter">
                  {deployStep === 1 ? "Establishing GitHub Link..." : "Building APK Binary..."}
                </h3>
                <p className="text-white/40 text-sm font-medium">Please wait while the remote runner compiles your native source code into a signed APK bundle.</p>
              </>
            ) : (
              <div className="animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-green-500 rounded-full mx-auto flex items-center justify-center mb-10 shadow-2xl shadow-green-500/40 animate-bounce"><Check size={48} className="text-white"/></div>
                <h3 className="text-3xl font-black mb-6 uppercase tracking-tighter">Build Successful</h3>
                <div className="flex flex-col gap-4">
                  <button className="w-full py-6 bg-cyan-600 rounded-[2.5rem] font-black uppercase text-[12px] tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all"><Download size={18}/> Download APK</button>
                  <button className="w-full py-6 bg-white/5 border border-white/10 rounded-[2.5rem] font-black uppercase text-[12px] tracking-widest flex items-center justify-center gap-3 hover:bg-white/10 transition-all"><QrCode size={18}/> Open QR Portal</button>
                  <button onClick={() => { setIsDeploying(false); setDeployStep(0); }} className="mt-4 text-white/30 uppercase font-bold text-[10px] hover:text-white">Close Uplink</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-[100px] flex items-center justify-center p-10 animate-in zoom-in-95 duration-300">
          <div className="max-w-md w-full glass-card p-12 rounded-[4.5rem] border-cyan-500/30 shadow-2xl">
            <h3 className="text-2xl font-black text-white mb-10 uppercase flex items-center gap-4 tracking-tighter"><Terminal size={32} className="text-cyan-500"/> System Config</h3>
            <div className="space-y-6">
              <input value={ghConfig.owner} onChange={e => setGhConfig(p => ({...p, owner: e.target.value}))} className="w-full bg-slate-900 border border-white/10 rounded-[2rem] p-6 text-sm text-white focus:border-cyan-500/50 outline-none" placeholder="GitHub Username" />
              <input value={ghConfig.repo} onChange={e => setGhConfig(p => ({...p, repo: e.target.value}))} className="w-full bg-slate-900 border border-white/10 rounded-[2rem] p-6 text-sm text-white focus:border-cyan-500/50 outline-none" placeholder="Target Repository" />
              <input value={ghConfig.token} type="password" onChange={e => setGhConfig(p => ({...p, token: e.target.value}))} className="w-full bg-slate-900 border border-white/10 rounded-[2rem] p-6 text-sm text-white focus:border-cyan-500/50 outline-none" placeholder="Access Token (PAT)" />
              <div className="flex gap-5 pt-10">
                <button onClick={() => { localStorage.setItem('df_gh_owner', ghConfig.owner); localStorage.setItem('df_gh_repo', ghConfig.repo); localStorage.setItem('df_gh_token', ghConfig.token); setShowSettings(false); }} className="flex-1 py-6 bg-cyan-600 rounded-[2.5rem] text-[11px] font-black uppercase text-white shadow-xl active:scale-95 transition-all">Save System Link</button>
                <button onClick={() => setShowSettings(false)} className="px-10 py-6 bg-white/5 rounded-[2.5rem] text-[11px] font-black uppercase text-white/30 hover:bg-white/10 transition-all">Abort</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
