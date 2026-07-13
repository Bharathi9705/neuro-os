'use client';

import { useState, useRef, useEffect } from 'react';
import { signIn, useSession, signOut } from 'next-auth/react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Send, Plus, Trash2, Mic, Image as ImageIcon, Copy, Check, Settings, Sparkles, User, Bot, Loader2, Menu, X, Eye, EyeOff, Paperclip } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'image';
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
}

export default function Home() {
  const { data: session } = useSession();

  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [agent, setAgent] = useState('general');
  const [isListening, setIsListening] = useState(false);
  const [showImageGen, setShowImageGen] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [showAuth, setShowAuth] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSignupMode, setIsSignupMode] = useState(false); // NEW: toggle login/signup
  const [authError, setAuthError] = useState(''); // NEW: shows backend errors
  const [authLoading, setAuthLoading] = useState(false); // NEW: disables button while checking
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [customApiUrl, setCustomApiUrl] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize from LocalStorage
  useEffect(() => {
    const savedChats = localStorage.getItem('neuro_chats');
    const savedUrl = localStorage.getItem('neuro_api_url');
    const savedUser = localStorage.getItem('neuro_user');

    if (savedChats) setChats(JSON.parse(savedChats));
    if (savedUrl) setCustomApiUrl(savedUrl);
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setShowAuth(false);
    }
  }, []);

  // Sync Google OAuth session into app state
  useEffect(() => {
    if (session?.user) {
      setUser({ id: session.user.email || 'google-user', email: session.user.email || '' });
      setShowAuth(false);
    }
  }, [session]);

  // Lock body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  // Save to LocalStorage
  useEffect(() => {
    if (chats.length > 0) localStorage.setItem('neuro_chats', JSON.stringify(chats));
    if (customApiUrl) localStorage.setItem('neuro_api_url', customApiUrl);
    if (user && rememberMe) localStorage.setItem('neuro_user', JSON.stringify(user));
  }, [chats, customApiUrl, user, rememberMe]);

  // Determine API URL
  const getApiUrl = () => {
    if (customApiUrl) return customApiUrl;
    return process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001';
  };

  // Initialize Web Speech API
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.onstart = () => setIsListening(true);
        recognitionRef.current.onend = () => setIsListening(false);
        recognitionRef.current.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join('');
          setInput(transcript);
        };
      }
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, currentChatId, loading]);

  // Real login/signup — calls backend, validates password properly
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!authEmail || !authPassword) {
      setAuthError('Email and password are required');
      return;
    }

    setAuthLoading(true);
    try {
      const endpoint = isSignupMode ? '/auth/signup' : '/auth/login';
      const response = await fetch(`${getApiUrl()}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAuthError(data.detail || 'Something went wrong. Please try again.');
        setAuthLoading(false);
        return;
      }

      const newUser = { id: data.email, email: data.email };
      setUser(newUser);
      setShowAuth(false);
      if (rememberMe) {
        localStorage.setItem('neuro_user', JSON.stringify(newUser));
      }
    } catch (error) {
      setAuthError('Could not reach the backend. Make sure it is running at ' + getApiUrl());
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    signIn('google');
  };

  const handleLogout = () => {
    setUser(null);
    setShowAuth(true);
    setChats([]);
    setCurrentChatId(null);
    setAuthEmail('');
    setAuthPassword('');
    setAuthError('');
    localStorage.removeItem('neuro_user');
    localStorage.removeItem('neuro_chats');
    signOut();
  };

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: 'New Conversation',
      messages: [],
    };
    setChats([newChat, ...chats]);
    setCurrentChatId(newChat.id);
    setSidebarOpen(false);
  };

  const deleteChat = (id: string) => {
    const updated = chats.filter((chat) => chat.id !== id);
    setChats(updated);
    if (currentChatId === id) {
      setCurrentChatId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const getCurrentChat = () => chats.find((chat) => chat.id === currentChatId);

  const toggleVoiceInput = () => {
    if (recognitionRef.current) {
      if (isListening) recognitionRef.current.stop();
      else recognitionRef.current.start();
    }
  };
   
  const speakText = (text: string) => {
  if (typeof window === 'undefined') return;
  window.speechSynthesis.cancel(); // stop any ongoing speech first
  const utterance = new SpeechSynthesisUtterance(text.replace(/[*#`]/g, '')); // strip markdown symbols
  utterance.rate = 1;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
};

  const generateImage = async () => {
    if (!imagePrompt.trim()) return;
    setLoading(true);

    let chatId = currentChatId;
    if (!chatId) {
      chatId = Date.now().toString();
      const newChat: Chat = { id: chatId, title: `Image: ${imagePrompt.substring(0, 20)}`, messages: [] };
      setChats([newChat, ...chats]);
      setCurrentChatId(chatId);
    }

    try {
      const encodedPrompt = encodeURIComponent(imagePrompt);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;

      const assistantMessage: Message = {
        role: 'assistant',
        content: `![Generated Image](${imageUrl})\n\n**Prompt:** ${imagePrompt}`,
        type: 'image'
      };

      setChats(prev => prev.map(chat =>
        chat.id === chatId ? { ...chat, messages: [...chat.messages, { role: 'user', content: `Generate image: ${imagePrompt}` }, assistantMessage] } : chat
      ));

      setImagePrompt('');
      setShowImageGen(false);
    } catch (error) {
      alert("Failed to generate image.");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    const content = input.trim();
    if (!content || loading) return;

    let chatId = currentChatId;
    let updatedChats = [...chats];

    if (!chatId) {
      chatId = Date.now().toString();
      const newChat: Chat = { id: chatId, title: content.substring(0, 30), messages: [] };
      updatedChats = [newChat, ...chats];
      setChats(updatedChats);
      setCurrentChatId(chatId);
    }

    const userMsg: Message = { role: 'user', content };
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: [...c.messages, userMsg], title: c.messages.length === 0 ? content.substring(0, 30) : c.title } : c));
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(`${getApiUrl()}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, agent }),
      });

      if (!response.ok) throw new Error();
      const data = await response.json();

      const assistantMsg: Message = { role: 'assistant', content: data.response };
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: [...c.messages, assistantMsg] } : c));
    } catch (error) {
      alert("Connection Error: Make sure your backend is running at " + getApiUrl());
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportChat = () => {
    const chat = getCurrentChat();
    if (!chat) return;

    let content = `NEURO-OS Chat Export\n${chat.title}\n${new Date().toLocaleString()}\n${'='.repeat(40)}\n\n`;
    chat.messages.forEach((msg) => {
      const speaker = msg.role === 'user' ? 'OPERATOR' : 'NEURO-OS';
      content += `${speaker}:\n${msg.content}\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${chat.title.replace(/[^a-z0-9]/gi, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let chatId = currentChatId;
    if (!chatId) {
      chatId = Date.now().toString();
      const newChat: Chat = { id: chatId, title: `File: ${file.name.substring(0, 20)}`, messages: [] };
      setChats(prev => [newChat, ...prev]);
      setCurrentChatId(chatId);
    }

    const userMsg: Message = { role: 'user', content: `📎 Uploaded: ${file.name}` };
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: [...c.messages, userMsg] } : c));
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${getApiUrl()}/analyze-file`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error();
      const data = await response.json();

      const assistantMsg: Message = { role: 'assistant', content: data.response };
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: [...c.messages, assistantMsg] } : c));
    } catch (error) {
      alert("Failed to analyze file. Make sure your backend is running at " + getApiUrl());
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (showAuth) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md space-y-6 bg-[#111] p-6 sm:p-10 rounded-3xl border border-white/5 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="inline-block p-4 bg-blue-600/10 rounded-2xl mb-4">
              <Sparkles className="w-8 h-8 text-blue-500" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">NEURO-OS</h1>
            <p className="text-white/40 font-medium">Next-Generation AI Interface</p>
          </div>

          {/* Google Sign-in */}
          <button
            onClick={handleGoogleLogin}
            type="button"
            className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-3.5 rounded-2xl hover:bg-white/90 transition-all active:scale-[0.98] shadow-lg"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Login / Signup toggle */}
          <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10">
            <button
              type="button"
              onClick={() => { setIsSignupMode(false); setAuthError(''); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${!isSignupMode ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => { setIsSignupMode(true); setAuthError(''); }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${isSignupMode ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/30 uppercase tracking-widest ml-1">Access Email</label>
              <input type="email" placeholder="name@example.com" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-white/20" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/30 uppercase tracking-widest ml-1">Security Key</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={isSignupMode ? 'At least 6 characters' : '••••••••'}
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-white/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-all"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {authError && (
              <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                {authError}
              </div>
            )}

            <label className="flex items-center gap-2 cursor-pointer select-none ml-1">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded accent-blue-500 bg-white/5 border-white/10 cursor-pointer"
              />
              <span className="text-xs font-medium text-white/40">Remember me</span>
            </label>

            <button type="submit" disabled={authLoading} className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-white/90 transition-all active:scale-[0.98] shadow-xl shadow-white/5 disabled:opacity-50 flex items-center justify-center gap-2">
              {authLoading ? <Loader2 size={18} className="animate-spin" /> : null}
              {isSignupMode ? 'Create Account' : 'Initialize System'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] md:h-screen w-screen bg-[#050505] text-white font-sans selection:bg-blue-500/30 overflow-hidden">

      {/* Backdrop — mobile only, click to close sidebar */}
      <div
        onClick={() => setSidebarOpen(false)}
        className={`
          fixed inset-0 bg-black/70 backdrop-blur-sm z-40
          transition-opacity duration-300 ease-in-out
          md:hidden
          ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
      />

      {/* Sidebar */}
      <div
        className={`
          bg-[#0A0A0A] border-r border-white/5 flex flex-col
          fixed md:static inset-y-0 left-0 z-50
          w-[80vw] max-w-[320px] h-[100dvh] md:h-screen md:w-72
          transition-transform duration-300 ease-in-out will-change-transform
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}
      >
        <div className="p-6 flex-shrink-0">
          <button onClick={createNewChat} className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-2xl border border-white/10 transition-all active:scale-95 group">
            <Plus size={18} className="group-hover:rotate-90 transition-transform" /> New Conversation
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 space-y-2 custom-scrollbar">
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-4 ml-2">Recent Logs</p>
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => { setCurrentChatId(chat.id); setSidebarOpen(false); }}
              className={`group relative p-4 rounded-2xl cursor-pointer transition-all ${currentChatId === chat.id ? 'bg-white/10 border border-white/10 shadow-lg' : 'hover:bg-white/5 border border-transparent'}`}
            >
              <div className="flex items-center justify-between gap-3 min-w-0">
                <span className="text-sm font-medium truncate opacity-80 group-hover:opacity-100 min-w-0">{chat.title}</span>
                <button onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }} className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded-lg transition-all"><Trash2 size={14} className="text-white/40 hover:text-red-400" /></button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex-shrink-0 p-6 space-y-3 border-t border-white/5 bg-[#0A0A0A]">
          <button onClick={() => setShowSettings(true)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-all text-white/60 hover:text-white">
            <Settings size={18} /> <span className="text-sm font-bold">System Config</span>
          </button>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/5 min-w-0">
            <div className="w-8 h-8 flex-shrink-0 rounded-full bg-blue-500/20 flex items-center justify-center"><User size={16} className="text-blue-400" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-white/30 uppercase">Operator</p>
              <p className="text-xs font-bold truncate">{user?.email}</p>
            </div>
            <button onClick={handleLogout} className="flex-shrink-0 text-[10px] font-black text-red-500/50 hover:text-red-500 uppercase tracking-tighter">Exit</button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative overflow-hidden min-w-0 w-full">
        {/* Top Header */}
        <header className="h-16 md:h-20 flex items-center justify-between px-4 md:px-8 border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl z-30 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden relative w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-all active:scale-90"
              aria-label="Toggle sidebar"
            >
              <Menu size={20} className={`absolute transition-all duration-200 ${sidebarOpen ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`} />
              <X size={20} className={`absolute transition-all duration-200 ${sidebarOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`} />
            </button>
            <h1 className="text-lg md:text-xl font-black tracking-tighter italic truncate">NEURO<span className="text-blue-500">.</span>OS</h1>
            <div className="hidden sm:block flex-shrink-0 px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-[10px] font-black text-blue-400 tracking-widest uppercase">v2.0 PRO</div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
  {currentChatId && (
    <button onClick={exportChat} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all" aria-label="Export chat">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
    </button>
  )}
  <select value={agent} onChange={(e) => setAgent(e.target.value)} className="flex-shrink-0 bg-white/5 border border-white/10 rounded-xl px-2 md:px-4 py-2 text-[10px] md:text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none cursor-pointer hover:bg-white/10 max-w-[42%] md:max-w-none truncate">
    <option value="general">CORE INTELLIGENCE</option>
    <option value="coding">SYNTAX ENGINE</option>
    <option value="research">KNOWLEDGE ARCHIVE</option>
  </select>
</div>
        </header>

        {/* Chat Space */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:px-6 md:py-8 space-y-8 custom-scrollbar">
          {!currentChatId && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 max-w-3xl mx-auto">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-blue-600/10 flex items-center justify-center border border-blue-500/20 animate-pulse">
                <Sparkles size={32} className="text-blue-500 md:w-10 md:h-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl md:text-4xl font-black tracking-tighter">System Online.</h2>
                <p className="text-white/40 font-medium text-base md:text-lg leading-relaxed px-2">Awaiting operator input. I can process complex logic, generate high-fidelity visual assets, and execute research protocols.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 w-full">
                {['Explain Quantum Computing', 'Generate a Cyberpunk City', 'Write a React Hook', 'Analyze Market Trends'].map(item => (
                  <button key={item} onClick={() => { setInput(item); }} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/20 transition-all text-sm font-bold text-white/60 hover:text-white text-left">{item}</button>
                ))}
              </div>
            </div>
          )}

          {getCurrentChat()?.messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 md:gap-6 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex-shrink-0 flex items-center justify-center border ${msg.role === 'user' ? 'bg-white text-black border-white' : 'bg-blue-600/10 border-blue-500/20 text-blue-500'}`}>
                {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
              </div>
              <div className={`flex-1 min-w-0 space-y-2 ${msg.role === 'user' ? 'text-right' : ''}`}>
                <div className="flex items-center gap-2">
  <p className="text-[10px] font-black uppercase tracking-widest opacity-30">{msg.role === 'assistant' ? 'NEURO-OS' : 'OPERATOR'}</p>
  {msg.role === 'assistant' && (
    <button onClick={() => speakText(msg.content)} className="text-white/20 hover:text-blue-400 transition-all" aria-label="Read aloud">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
    </button>
  )}
</div>
                <div className={`inline-block text-left p-4 md:p-6 rounded-3xl leading-relaxed max-w-full ${msg.role === 'user' ? 'bg-[#111] border border-white/10 rounded-tr-none' : 'bg-white/5 border border-white/5 rounded-tl-none'}`}>
                  <div className="markdown prose prose-invert prose-sm md:prose-base max-w-none prose-p:leading-relaxed prose-pre:bg-[#050505] prose-pre:border prose-pre:border-white/10 prose-code:text-blue-400">
                    <ReactMarkdown components={{
                      code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <div className="relative group/code overflow-x-auto">
                            <button onClick={() => copyToClipboard(String(children))} className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-lg opacity-0 group-hover/code:opacity-100 transition-all border border-white/10">{copied ? <Check size={14} /> : <Copy size={14} />}</button>
                            <SyntaxHighlighter style={dracula} language={match[1]} PreTag="div" className="!rounded-2xl !p-4 md:!p-6 !my-4 !bg-[#050505] !border !border-white/10 !text-xs md:!text-sm">{String(children).replace(/\n$/, '')}</SyntaxHighlighter>
                          </div>
                        ) : <code className="bg-white/10 px-2 py-0.5 rounded text-blue-300 font-bold break-words" {...props}>{children}</code>;
                      },
                      img({ src, alt }) {
                        return <div className="my-6 rounded-3xl overflow-hidden border border-white/10 shadow-2xl group/img relative">
                          <img src={src} alt={alt} className="w-full h-auto" />
                          <a href={src} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-all font-bold text-sm tracking-widest uppercase">View Original</a>
                        </div>;
                      }
                    }}>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 md:gap-6 max-w-7xl mx-auto">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center"><Loader2 size={18} className="text-blue-500 animate-spin" /></div>
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-30">PROCESSING...</p>
                <div className="w-12 h-6 bg-white/5 rounded-full flex items-center justify-center gap-1 animate-pulse"><div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></div><div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{animationDelay:'0.2s'}}></div><div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{animationDelay:'0.4s'}}></div></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-32" />
        </main>

        {/* Input Dock */}
        <div className="absolute bottom-0 inset-x-0 p-3 sm:p-4 md:p-8 bg-gradient-to-t from-[#050505] via-[#050505] to-transparent">
          <div className="max-w-7xl mx-auto relative group">
            {showImageGen && (
              <div className="absolute bottom-full left-0 right-0 mb-4 p-4 md:p-6 bg-[#111] border border-white/10 rounded-3xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-blue-400 font-black text-xs uppercase tracking-widest"><ImageIcon size={14} /> Visual Synthesis</div>
                  <button onClick={() => setShowImageGen(false)} className="text-white/20 hover:text-white transition-all text-xs font-bold uppercase">Cancel</button>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input type="text" placeholder="Describe the visual asset to generate..." value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && generateImage()} className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" />
                  <button onClick={generateImage} disabled={loading || !imagePrompt.trim()} className="bg-white text-black font-black px-8 py-3 sm:py-0 rounded-2xl hover:bg-white/90 transition-all disabled:opacity-50">SYNTHESIZE</button>
                </div>
              </div>
            )}

            <div className="bg-[#111] border border-white/10 rounded-[2rem] md:rounded-[2.5rem] p-2 md:p-3 flex items-center gap-1 md:gap-3 shadow-2xl focus-within:border-white/20 transition-all">
              <button onClick={toggleVoiceInput} className={`p-3 md:p-4 rounded-2xl md:rounded-3xl transition-all flex-shrink-0 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white/5 hover:bg-white/10 text-white/40 hover:text-white'}`}><Mic size={18} /></button>
              <button onClick={() => setShowImageGen(!showImageGen)} className={`p-3 md:p-4 rounded-2xl md:rounded-3xl transition-all flex-shrink-0 ${showImageGen ? 'bg-blue-500 text-white' : 'bg-white/5 hover:bg-white/10 text-white/40 hover:text-white'}`}><ImageIcon size={18} /></button>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf,image/*" className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="p-3 md:p-4 rounded-2xl md:rounded-3xl transition-all flex-shrink-0 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white" aria-label="Upload file"><Paperclip size={18} /></button>
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder="Enter command..." className="flex-1 min-w-0 bg-transparent border-none focus:ring-0 text-white placeholder:text-white/20 font-medium px-2 md:px-4 text-sm md:text-base" />
              <button onClick={handleSend} disabled={loading || !input.trim()} className={`p-3 md:p-4 rounded-xl md:rounded-[1.8rem] transition-all flex items-center justify-center flex-shrink-0 ${input.trim() ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 text-white/20'}`}><Send size={18} /></button>
            </div>
            <p className="text-center mt-3 md:mt-4 text-[9px] md:text-[10px] font-black text-white/10 uppercase tracking-[0.2em] md:tracking-[0.3em]">Neural Link Status: <span className="text-green-500/50">Optimal</span></p>
          </div>
        </div>

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-lg bg-[#111] border border-white/10 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 shadow-2xl space-y-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3"><Settings className="text-blue-500" /> <h3 className="text-xl md:text-2xl font-black tracking-tighter">System Configuration</h3></div>
                <button onClick={() => setShowSettings(false)} className="text-white/20 hover:text-white transition-all font-bold uppercase text-xs">Close</button>
              </div>
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Backend Uplink URL</label>
                  <input type="text" placeholder="https://your-backend.onrender.com" value={customApiUrl} onChange={(e) => setCustomApiUrl(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-white/10" />
                  <p className="text-[10px] text-white/20 ml-1 break-all">Current: {getApiUrl()}</p>
                </div>
                <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl space-y-2">
                  <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest">Network Protocol</h4>
                  <p className="text-xs text-white/40 leading-relaxed font-medium">By default, the system attempts to connect to your local environment. Enter your Render URL above to enable remote operations.</p>
                </div>
              </div>
              <button onClick={() => { setShowSettings(false); window.location.reload(); }} className="w-full bg-white text-black font-black py-4 rounded-2xl hover:bg-white/90 transition-all shadow-xl shadow-white/5">Update Link & Restart</button>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
        .gradient-text { background: linear-gradient(to right, #fff, rgba(255,255,255,0.5)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      `}</style>
    </div>
  );
}