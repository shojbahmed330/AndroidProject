
import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Smartphone, Loader2, Zap, Cpu, LogOut, Check, Rocket,
  Download, Globe, Activity, Terminal, ShieldAlert, Package, QrCode
} from 'lucide-react';
import { AppMode, ChatMessage, User as UserType } from './types';
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
  const [mode, setMode] = useState<AppMode>(AppMode.PREVIEW);
  const [isGenerating, setIsGenerating] = useState(false);
  const [projectFiles, setProjectFiles] = useState<Record<string, string>>({
    'index.html': '<html><body style="background:#020617;color:cyan;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;"><h1>DroidForge System Active</h1></body></html>',
    'styles.css': '',
    'main.js': ''
  });
  
  const gemini = useRef(new GeminiService());
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync scroll on chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Auth Management
  useEffect(() => {
    const loadUser = async (email: string, id?: string) => {
      const u = await db.getUser(email, id);
      if (u) {
        setUser(u);
        setIsAdmin(!!u.isAdmin);
        if (messages.length === 0) {
          setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: `স্বাগতম ${u.name}! আমি DroidForge AI। আপনার অ্যাপ আইডিয়া দিন।`,
            choices: [
              { label: "কন্টাক্টস অ্যাপ বানান", prompt: "Build a native contacts manager" },
              { label: "ফ্ল্যাশলাইট অ্যাপ", prompt: "Build a native flashlight controller" }
            ],
            timestamp: Date.now()
          }]);
        }
      }
    };

    // ১. ইনিশিয়াল চেক
    const initAuth = async () => {
      try {
        const session = await db.getCurrentSession();
        const forceEmail = localStorage.getItem('df_force_login');
        const email = session?.user?.email || forceEmail;

        if (email) {
          await loadUser(email, session?.user?.id);
        }
      } catch (e) {
        console.error("Auth initialization failed");
      } finally {
        // যদি ইউআরএল এ সেশন টোকেন থাকে, তবে লিসেনার হ্যান্ডেল করবে। 
        // নাহলে লোডিং বন্ধ।
        if (!window.location.hash.includes('access_token')) {
          setIsAuthLoading(false);
        }
      }
    };

    // ২. রিয়েল টাইম অথ লিসেনার (Google Login এর জন্য জরুরি)
    const { data: { subscription } } = db.onAuthStateChange(async (event, session) => {
      console.log("Auth State Changed:", event);
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user?.email) {
        await loadUser(session.user.email, session.user.id);
        setIsAuthLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAdmin(false);
        setIsAuthLoading(false);
      }
    });

    initAuth();

    // সেফটি টাইমার (যদি সুপাবেস রেসপন্স না দেয়)
    const timer = setTimeout(() => setIsAuthLoading(false), 4000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    const { email, password } = authInput;
    
    try {
      const { session, error } = isSignUp ? await db.signUp(email, password) : await db.signIn(email, password);
      if (error) {
        alert(error.message);
        setIsAuthLoading(false);
      } else if (session) {
        // সাকসেসফুল লগইন লিসেনার এর মাধ্যমে হ্যান্ডেল হবে
      }
    } catch (err) {
      alert("System Busy.");
      setIsAuthLoading(false);
    }
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
      setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'assistant', content: result.answer, choices: result.choices, timestamp: Date.now() }]);
      const u = await db.useToken(user.id, user.email);
      if (u) setUser(u);
    } finally { setIsGenerating(false); }
  };

  if (isAuthLoading) return (
    <div className="h-screen bg-[#020617] flex flex-col items-center justify-center font-['Plus_Jakarta_Sans']">
      <div className="relative w-20 h-20 mb-6">
        <Cpu size={60} className="text-cyan-500 animate-pulse absolute inset-0"/>
        <div className="absolute inset-0 blur-xl bg-cyan-500/20 animate-pulse rounded-full"></div>
      </div>
      <div className="text-cyan-500 font-black tracking-[0.4em] text-[10px] uppercase animate-pulse">Syncing Secure Core...</div>
    </div>
  );

  if (!user) return (
    <div className="h-screen bg-slate-950 flex items-center justify-center p-6 bg-grid font-['Plus_Jakarta_Sans']">
      <div className="max-w-md w-full glass-card p-12 rounded-[4rem] border-cyan-500/20 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-cyan-500 rounded-2xl mx-auto flex items-center justify-center mb-8 shadow-2xl active-pulse"><Cpu size={40} className="text-black"/></div>
        <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">DroidForge <span className="text-cyan-400">Pro</span></h1>
        <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] mb-8">{isSignUp ? 'Registration Module' : 'System Authorization'}</p>
        <form onSubmit={handleAuth} className="space-y-4">
          <input required type="email" value={authInput.email} onChange={e => setAuthInput(p => ({...p, email: e.target.value}))} className="w-full bg-slate-900 border border-white/10 rounded-3xl p-5 text-white outline-none focus:border-cyan-500/50 transition-all" placeholder="Email Address" />
          <input required type="password" value={authInput.password} onChange={e => setAuthInput(p => ({...p, password: e.target.value}))} className="w-full bg-slate-900 border border-white/10 rounded-3xl p-5 text-white outline-none focus:border-cyan-500/50 transition-all" placeholder="Security Token (Pass)" />
          <button type="submit" className="w-full py-5 bg-cyan-600 rounded-3xl font-black uppercase tracking-widest text-white shadow-xl hover:bg-cyan-500 active:scale-95 transition-all mt-4">
            {isSignUp ? 'Generate Account' : 'Initialize Core'}
          </button>
        </form>
        <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
          <button onClick={() => db.loginWithGoogle()} className="w-full py-4 bg-white/5 border border-white/10 rounded-3xl text-sm font-bold flex items-center justify-center gap-3 hover:bg-white/10 transition-all">
            <Globe size={18} className="text-cyan-400"/> Google Neural Link
          </button>
          <p className="text-white/30 text-[11px] font-medium tracking-wide">
            {isSignUp ? 'Already have an ID?' : "Need a new access?"} 
            <button onClick={() => setIsSignUp(!isSignUp)} className="ml-2 text-cyan-400 font-black hover:underline uppercase tracking-widest">{isSignUp ? 'Sign In' : 'Sign Up'}</button>
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col font-['Hind_Siliguri'] overflow-hidden text-slate-100 bg-[#020617]">
      <header className="h-20 border-b border-white/5 glass-card flex items-center justify-between px-10 z-50">
        <div className="flex items-center gap-5">
          <div className="w-11 h-11 bg-cyan-500 rounded-2xl flex items-center justify-center shadow-lg"><Cpu size={24} className="text-black"/></div>
          <span className="font-black text-sm uppercase tracking-widest">DroidForge <span className="text-cyan-400">Pro</span></span>
        </div>
        <nav className="flex bg-white/5 rounded-full p-1.5 border border-white/5">
          {[AppMode.PREVIEW, AppMode.EDIT, AppMode.SHOP, AppMode.PROFILE].map(m => (
            <button key={m} onClick={() => setMode(m)} className={`px-8 py-2.5 text-[11px] font-black uppercase rounded-full transition-all ${mode === m ? 'bg-cyan-500 text-black shadow-lg' : 'text-white/40 hover:text-white'}`}>{m}</button>
          ))}
        </nav>
        <div className="flex items-center gap-5">
          <div className="px-5 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-[11px] font-black text-cyan-400">{user?.tokens} TK</div>
          <button onClick={() => db.signOut()} className="p-2.5 text-red-400 hover:bg-red-400/10 rounded-2xl transition-all"><LogOut size={22}/></button>
        </div>
      </header>
      
      <div className="flex-1 flex overflow-hidden">
        {mode === AppMode.PREVIEW || mode === AppMode.EDIT ? (
          <div className="flex-1 flex h-full">
            <section className="w-[480px] border-r border-white/5 flex flex-col bg-[#01040f] relative">
              <div className="flex-1 p-10 overflow-y-auto code-scroll space-y-8 pb-48">
                {messages.map(m => (
                  <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-8 duration-500`}>
                    <div className={`max-w-[95%] p-7 rounded-[2.5rem] shadow-2xl ${m.role === 'user' ? 'bg-cyan-600 text-white rounded-tr-none' : 'bg-slate-900/90 border border-white/10 text-slate-100 rounded-tl-none'}`}>
                      <div className="text-[15px] font-medium whitespace-pre-wrap">{m.content}</div>
                      {m.role === 'assistant' && m.choices && (
                        <div className="mt-8 flex flex-wrap gap-2.5">
                          {m.choices.map((c, i) => (
                            <button key={i} onClick={() => handleSend(c.prompt)} className="px-5 py-3 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl text-[12px] font-bold text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all flex items-center gap-2">
                              <Zap size={14}/> {c.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isGenerating && <div className="p-6 bg-slate-900/50 rounded-3xl border border-white/5 flex items-center gap-4 animate-pulse text-cyan-500 font-bold text-xs uppercase tracking-widest"><Loader2 className="animate-spin" size={20}/> AI is forging code...</div>}
                <div ref={chatEndRef} />
              </div>
              <div className="p-10 absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#01040f] via-[#01040f] to-transparent">
                <div className="relative group">
                  <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} placeholder="আপনার মোবাইল অ্যাপের আইডিয়া লিখুন..." className="w-full bg-slate-900 border border-white/10 rounded-[3rem] p-8 pr-28 text-[15px] h-32 outline-none text-white resize-none shadow-2xl focus:border-cyan-500/50 transition-all font-medium" />
                  <button onClick={() => handleSend()} disabled={isGenerating} className="absolute bottom-6 right-6 p-6 bg-cyan-600 rounded-[2rem] text-white shadow-2xl hover:bg-cyan-500 transition-all active:scale-90">
                    {isGenerating ? <Loader2 className="animate-spin" size={28}/> : <Send size={28}/>}
                  </button>
                </div>
              </div>
            </section>
            <section className="flex-1 p-10 bg-[#020617]/50 flex items-center justify-center">
              <div className="bg-slate-900 rounded-[5.5rem] h-[750px] w-[380px] border-[16px] border-slate-800 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-1000">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-44 h-8 bg-slate-800 rounded-b-[2.5rem] z-20 flex items-center justify-center"><div className="w-12 h-1.5 bg-white/5 rounded-full"></div></div>
                <iframe ref={iframeRef} title="preview" className="w-full h-full border-none bg-white"/>
              </div>
            </section>
          </div>
        ) : mode === AppMode.PROFILE ? (
          <div className="flex-1 flex items-center justify-center p-20">
            <div className="max-w-md w-full glass-card p-16 rounded-[5rem] text-center border-white/10">
              <div className="w-32 h-32 rounded-[3rem] border-4 border-cyan-500 mx-auto mb-8 p-1.5 bg-[#0f172a] overflow-hidden">
                <img src={user?.avatar_url} className="w-full h-full object-cover" alt="Profile"/>
              </div>
              <h2 className="text-3xl font-black mb-2 tracking-tighter">{user?.name}</h2>
              <p className="text-cyan-400/50 text-sm font-bold mb-10">{user?.email}</p>
              <div className="bg-slate-900/50 p-10 rounded-[3.5rem] border border-white/5">
                <p className="text-[10px] uppercase font-black opacity-20 mb-2 tracking-[0.4em]">Available Tokens</p>
                <p className="text-6xl font-black tracking-tighter text-white">{user?.tokens}<span className="text-xl ml-2 opacity-10">TK</span></p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default App;
