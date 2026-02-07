
import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Smartphone, Loader2, Zap, Cpu, LogOut, Check, Rocket, Settings,
  Download, Globe, Activity, Terminal, ShieldAlert, Package, QrCode, 
  AlertCircle, Key, Mail, ArrowLeft, FileCode, ShoppingCart, User as UserIcon,
  ChevronRight, Github, Save, Trash2, Square, Circle, RefreshCw
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
  isLoggedIn: true,
  joinedAt: Date.now()
};

const App: React.FC = () => {
  const [user, setUser] = useState<UserType>(DEFAULT_USER);
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
    setBuildStatus('pushing');
    try {
      await githubService.current.pushToGithub(github, projectFiles);
      setBuildStatus('building');
      
      const poll = async () => {
        const result = await githubService.current.getLatestApk(github);
        if (result && typeof result === 'object') {
          setApkUrl(result);
          setBuildStatus('done');
        } else {
          setTimeout(poll, 10000); // Poll every 10 seconds
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
      setUser(prev => ({ ...prev, tokens: prev.tokens - 1 }));
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

  return (
    <div className="h-screen flex flex-col font-['Hind_Siliguri'] text-slate-100 bg-[#020617] overflow-hidden">
      {/* Header */}
      <header className="h-20 border-b border-white/5 glass-card flex items-center justify-between px-8 z-50">
        <div className="flex items-center gap-4">
          <div 
            onClick={handleLogoClick}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className={`w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center shadow-lg transition-transform active:scale-90 ${logoClicks > 0 ? 'animate-pulse' : ''}`}>
              <Cpu size={22} className="text-black"/>
            </div>
            <span className="font-black text-sm uppercase tracking-tighter group-hover:text-cyan-400 transition-colors">OneClick <span className="text-cyan-400">Studio</span></span>
          </div>
        </div>

        <nav className="flex bg-slate-900/50 rounded-2xl p-1 border border-white/5">
          {[AppMode.PREVIEW, AppMode.EDIT, AppMode.SHOP, AppMode.PROFILE].map(m => (
            <button key={m} onClick={() => setMode(m)} className={`px-6 py-2 text-[11px] font-black uppercase rounded-xl transition-all ${mode === m ? 'bg-cyan-500 text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}>
              {m === AppMode.EDIT ? <FileCode size={16} className="inline mr-2"/> : null}
              {m}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <button 
            onClick={handleBuildAPK}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all"
          >
            {buildStatus === 'idle' ? <Rocket size={16}/> : <RefreshCw size={16} className="animate-spin"/>}
            {buildStatus === 'idle' ? 'Build APK' : buildStatus.toUpperCase() + '...'}
          </button>
          <div className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-xs font-bold text-cyan-400">{user.tokens} Tokens</div>
          <button className="p-2.5 text-red-400 hover:bg-red-400/10 rounded-xl"><LogOut size={20}/></button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {mode === AppMode.PREVIEW || mode === AppMode.EDIT ? (
          <>
            <section className="w-[450px] border-r border-white/5 flex flex-col bg-[#01040f] relative">
              <div className="flex-1 p-8 overflow-y-auto code-scroll space-y-6 pb-40">
                {/* Build Status Alert */}
                {buildStatus !== 'idle' && (
                   <div className="p-5 bg-cyan-500/10 border border-cyan-500/20 rounded-3xl mb-4">
                      <div className="flex items-center gap-3 mb-2">
                         <Activity size={16} className={`text-cyan-400 ${buildStatus !== 'done' ? 'animate-pulse' : ''}`}/>
                         <span className="text-xs font-black uppercase tracking-widest text-cyan-400">
                           {buildStatus === 'done' ? 'Build Successful' : 'GitHub Build Pipeline Active'}
                         </span>
                      </div>
                      <p className="text-xs text-slate-400 mb-4">
                        {buildStatus === 'done' 
                          ? 'আপনার অ্যান্ড্রয়েড এপিকে তৈরি হয়েছে। সরাসরি মোবাইলে ডাউনলোড করতে স্ক্যান করুন।' 
                          : 'আপনার প্রজেক্ট গিটহাবে পুশ করা হচ্ছে এবং APK বিল্ড শুরু হয়েছে। এতে ১-২ মিনিট সময় লাগতে পারে।'}
                      </p>
                      
                      {buildStatus === 'done' && (
                        <div className="bg-slate-900/50 p-6 rounded-[2.5rem] border border-white/5 shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in-95">
                           <div className="bg-white p-4 rounded-3xl shadow-xl overflow-hidden">
                             <div ref={qrRef}></div>
                           </div>
                           <div className="text-center">
                             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 mb-3 flex items-center justify-center gap-2">
                               <QrCode size={12}/> Scan for Mobile Install
                             </p>
                             <button 
                                onClick={handleDownload}
                                className="w-full py-3.5 px-8 bg-cyan-500 text-black font-black uppercase text-[10px] rounded-2xl flex items-center justify-center gap-2 hover:bg-cyan-400 shadow-lg active:scale-95 transition-all"
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
                    <div className={`max-w-[90%] p-5 rounded-3xl shadow-xl ${m.role === 'user' ? 'bg-cyan-600 text-white rounded-tr-none' : 'bg-slate-900/80 border border-white/5 text-slate-100 rounded-tl-none'}`}>
                      <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{m.content}</p>
                      
                      {m.role === 'assistant' && m.options && idx === messages.length - 1 && (
                        <div className="mt-5 space-y-3">
                          <p className="text-[10px] font-black text-cyan-400/50 uppercase tracking-widest px-2">
                            {m.inputType === 'single' ? 'একটি অপশন বেছে নিন' : 'একাধিক ফিচার সিলেক্ট করুন'}
                          </p>
                          <div className="space-y-2">
                            {m.options.map((opt, i) => {
                              const isSelected = selectedOptions.includes(opt.value);
                              return (
                                <button key={i} 
                                  onClick={() => toggleOption(opt.value, m.inputType)}
                                  className={`w-full p-4 rounded-2xl border text-left text-xs transition-all flex items-center justify-between group ${isSelected ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400' : 'bg-black/40 border-white/5 hover:border-white/20'}`}
                                >
                                  <div className="flex items-center gap-3">
                                    {m.inputType === 'single' ? (
                                      isSelected ? <Circle className="fill-current" size={14}/> : <Circle size={14} className="opacity-20"/>
                                    ) : (
                                      isSelected ? <Check size={14} className="bg-cyan-500 text-black rounded-sm"/> : <Square size={14} className="opacity-20"/>
                                    )}
                                    <span className="font-medium">{opt.label}</span>
                                  </div>
                                  {isSelected && <Zap size={14} className="animate-pulse"/>}
                                </button>
                              );
                            })}
                          </div>
                          
                          <button 
                            disabled={selectedOptions.length === 0}
                            onClick={() => handleSend(`আমার নির্বাচন: ${selectedOptions.join(', ')}`)}
                            className="w-full mt-4 py-4 bg-cyan-500 text-black font-black uppercase text-[11px] rounded-2xl tracking-widest hover:bg-cyan-400 transition-all shadow-lg active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                          >
                            CONFIRM SELECTION
                          </button>
                        </div>
                      )}

                      {m.role === 'assistant' && m.choices && (
                        <div className="mt-6 flex flex-wrap gap-2">
                          {m.choices.map((c, i) => (
                            <button key={i} onClick={() => handleSend(c.prompt)} className="px-4 py-2 bg-white/5 hover:bg-cyan-500/20 border border-white/5 hover:border-cyan-500/50 rounded-xl text-[11px] font-bold text-slate-300 hover:text-cyan-400 transition-all">
                              {c.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isGenerating && <div className="flex items-center gap-3 text-cyan-500 text-xs font-black uppercase tracking-widest animate-pulse"><Loader2 size={16} className="animate-spin"/> AI DEVELOPER WORKING...</div>}
                <div ref={chatEndRef} />
              </div>

              <div className="p-8 absolute bottom-0 w-full bg-gradient-to-t from-[#01040f] via-[#01040f] to-transparent">
                <div className="relative group">
                  <textarea 
                    value={input} 
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                    placeholder="আপনার প্রজেক্টের পরবর্তী ফিচার বা পরিবর্তন লিখুন..." 
                    className="w-full bg-slate-900 border border-white/10 rounded-[2.5rem] p-6 pr-20 text-sm h-32 outline-none text-white focus:border-cyan-500/50 transition-all resize-none shadow-2xl placeholder:opacity-30"
                  />
                  <button onClick={() => handleSend()} disabled={isGenerating} className="absolute bottom-6 right-6 p-4 bg-cyan-600 rounded-3xl text-white shadow-2xl hover:bg-cyan-500 transition-all active:scale-90 disabled:opacity-50">
                    {isGenerating ? <Loader2 size={24} className="animate-spin"/> : <Send size={24}/>}
                  </button>
                </div>
              </div>
            </section>

            <section className="flex-1 flex flex-col bg-[#020617]">
              {mode === AppMode.EDIT ? (
                <div className="flex-1 flex overflow-hidden animate-in fade-in duration-500">
                  <div className="w-72 border-r border-white/5 bg-black/30 p-8 space-y-2 overflow-y-auto code-scroll">
                    <p className="text-[10px] uppercase font-black text-slate-500 mb-6 tracking-[0.3em] opacity-40">Project Architecture</p>
                    {Object.keys(projectFiles).map(name => (
                      <button key={name} onClick={() => setSelectedFile(name)} className={`w-full text-left px-5 py-3 rounded-2xl text-[11px] font-bold flex items-center gap-3 transition-all ${selectedFile === name ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-inner' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'}`}>
                        <FileCode size={14}/> {name}
                      </button>
                    ))}
                  </div>
                  <div className="flex-1 p-8 overflow-hidden flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-3">
                        <Terminal size={14} className="text-cyan-500"/>
                        <span className="text-xs font-mono text-slate-500 tracking-wider">{selectedFile}</span>
                      </div>
                      <button className="flex items-center gap-2 px-6 py-2.5 bg-cyan-500 text-black rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-cyan-400 shadow-lg active:scale-95 transition-all"><Save size={14}/> Save Source</button>
                    </div>
                    <pre className="flex-1 bg-slate-900/40 rounded-[2.5rem] p-10 border border-white/5 overflow-auto text-[13px] font-mono text-cyan-100/70 code-scroll leading-relaxed shadow-inner">
                      {projectFiles[selectedFile]}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center p-10 relative">
                  <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none"></div>
                  <div className="bg-slate-900 rounded-[4.5rem] h-[780px] w-[380px] border-[14px] border-slate-800 shadow-[0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden group">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-44 h-8 bg-slate-800 rounded-b-3xl z-20 flex items-center justify-center"><div className="w-12 h-1 bg-white/5 rounded-full"></div></div>
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
          <div className="flex-1 p-20 overflow-y-auto animate-in slide-in-from-top-4 duration-700">
             <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                   <h1 className="text-6xl font-black mb-4 tracking-tighter">Token <span className="text-cyan-400">Vault</span></h1>
                   <p className="text-slate-400 text-lg">আপনার প্রফেশনাল প্রজেক্টকে এগিয়ে নিতে টোকেন রিচার্জ করুন</p>
                </div>
                <div className="grid grid-cols-3 gap-10">
                  {[
                    { name: 'Developer Starter', tk: 50, price: '৳ ৫০০', color: 'cyan', icon: <Package/> },
                    { name: 'Pro Builder', tk: 250, price: '৳ ১৫০০', color: 'purple', popular: true, icon: <Rocket/> },
                    { name: 'Agency Master', tk: 1200, price: '৳ ৫০০০', color: 'amber', icon: <Cpu/> }
                  ].map((pkg, i) => (
                    <div key={i} className={`glass-card p-12 rounded-[4rem] border-white/10 relative transition-all hover:scale-[1.03] group ${pkg.popular ? 'border-cyan-500/40 bg-cyan-500/5' : ''}`}>
                       {pkg.popular && <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-8 py-2.5 bg-cyan-500 text-black text-[10px] font-black uppercase rounded-full tracking-[0.3em] shadow-2xl">Elite Choice</div>}
                       <div className="mb-8 p-5 bg-white/5 w-fit rounded-3xl group-hover:text-cyan-400 transition-colors">{pkg.icon}</div>
                       <h3 className="text-2xl font-black mb-2">{pkg.name}</h3>
                       <div className="text-6xl font-black text-white mb-6 mt-10 tracking-tighter">{pkg.tk} <span className="text-xl opacity-20 ml-1">TK</span></div>
                       <p className="text-slate-400 mb-12 text-[14px] leading-relaxed">হাই-এন্ড এপিকে জেনারেশন এবং ক্লাউড বিল্ড সাপোর্টের জন্য উপযুক্ত।</p>
                       <button className="w-full py-5 bg-white/5 border border-white/10 rounded-3xl font-black text-xl hover:bg-cyan-500 hover:text-black hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all active:scale-95">{pkg.price}</button>
                    </div>
                  ))}
                </div>
             </div>
          </div>
        ) : mode === AppMode.SETTINGS ? (
          <div className="flex-1 flex items-center justify-center p-10 bg-grid">
            <div className="max-w-xl w-full glass-card p-14 rounded-[4.5rem] border-white/10 shadow-2xl animate-in zoom-in-95 duration-500">
               <div className="flex items-center gap-5 mb-12">
                 <div className="p-5 bg-cyan-500/10 rounded-3xl text-cyan-400"><Github size={36}/></div>
                 <div>
                   <h2 className="text-3xl font-black tracking-tight">Cloud Sync</h2>
                   <p className="text-slate-500 text-[13px] font-medium">আপনার সোর্স কোড সরাসরি গিটহাবে পুশ করুন</p>
                 </div>
               </div>
               <div className="space-y-8">
                 <div className="group">
                   <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 ml-5 mb-3 block group-hover:text-cyan-400 transition-colors">GitHub Personal Access Token</label>
                   <div className="relative">
                     <input type="password" value={github.token} onChange={e => setGithub({...github, token: e.target.value})} className="w-full bg-slate-900/50 border border-white/5 rounded-3xl p-5 pl-14 text-sm outline-none focus:border-cyan-500/50 transition-all" placeholder="ghp_xxxxxxxxxxxx"/>
                     <Key className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={18}/>
                   </div>
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="group">
                      <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 ml-5 mb-3 block">Username</label>
                      <input type="text" value={github.owner} onChange={e => setGithub({...github, owner: e.target.value})} className="w-full bg-slate-900/50 border border-white/5 rounded-3xl p-5 text-sm outline-none focus:border-cyan-500/50" placeholder="username"/>
                    </div>
                    <div className="group">
                      <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 ml-5 mb-3 block">Repository</label>
                      <input type="text" value={github.repo} onChange={e => setGithub({...github, repo: e.target.value})} className="w-full bg-slate-900/50 border border-white/5 rounded-3xl p-5 text-sm outline-none focus:border-cyan-500/50" placeholder="my-app"/>
                    </div>
                 </div>
                 <button 
                  onClick={() => {
                    alert("গিটহাব সেটিংস সেভ হয়েছে। এখন 'Build APK' বাটনে ক্লিক করুন।");
                    setMode(AppMode.PREVIEW);
                  }}
                  className="w-full py-5 bg-cyan-600 rounded-3xl font-black uppercase tracking-[0.2em] text-white mt-4 shadow-2xl hover:bg-cyan-500 hover:shadow-[0_0_40px_rgba(6,182,212,0.3)] transition-all active:scale-95"
                 >
                   SAVE SETTINGS
                 </button>
               </div>
               <button onClick={() => setMode(AppMode.PREVIEW)} className="w-full mt-10 text-slate-500 text-[11px] font-black uppercase tracking-widest hover:text-white flex items-center justify-center gap-3 transition-colors"><ArrowLeft size={16}/> Return to Terminal</button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-20 animate-in fade-in duration-1000">
            <div className="max-w-md w-full glass-card p-16 rounded-[5.5rem] text-center border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.5)]">
              <div className="w-36 h-36 rounded-[3.5rem] border-4 border-cyan-500 mx-auto mb-10 p-2 bg-[#0f172a] overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                <img src={user.avatar_url} className="w-full h-full object-cover" alt="Profile"/>
              </div>
              <h2 className="text-4xl font-black mb-3 tracking-tighter">{user.name}</h2>
              <p className="text-cyan-400/50 text-sm font-bold mb-12 uppercase tracking-widest">{user.email}</p>
              <div className="bg-slate-900/80 p-12 rounded-[4rem] border border-white/5 shadow-inner">
                <p className="text-[10px] uppercase font-black opacity-20 mb-3 tracking-[0.5em]">Neural Tokens</p>
                <p className="text-7xl font-black tracking-tighter text-white">{user.tokens}<span className="text-2xl ml-2 opacity-10">UNIT</span></p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
