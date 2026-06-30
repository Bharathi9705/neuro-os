'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Send, Plus, Trash2, Mic, Copy, Check } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
}

export default function Home() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [showAuth, setShowAuth] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
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
  }, [chats, currentChatId]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (authEmail && authPassword) {
      setUser({ id: Date.now().toString(), email: authEmail });
      setShowAuth(false);
      setAuthEmail('');
      setAuthPassword('');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setShowAuth(true);
    setChats([]);
    setCurrentChatId(null);
  };

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
    };
    setChats([newChat, ...chats]);
    setCurrentChatId(newChat.id);
  };

  const deleteChat = (id: string) => {
    setChats(chats.filter((chat) => chat.id !== id));
    if (currentChatId === id) {
      setCurrentChatId(chats.length > 1 ? chats[0].id : null);
    }
  };

  const getCurrentChat = () => chats.find((chat) => chat.id === currentChatId);

  const toggleVoiceInput = () => {
    if (recognitionRef.current) {
      if (isListening) {
        recognitionRef.current.stop();
      } else {
        recognitionRef.current.start();
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !currentChatId) return;

    const currentChat = getCurrentChat();
    if (!currentChat) return;

    const userMessage: Message = { role: 'user', content: input };
    const updatedMessages = [...currentChat.messages, userMessage];

    const updatedChats = chats.map((chat) =>
      chat.id === currentChatId
        ? {
            ...chat,
            title: chat.messages.length === 0 ? input.substring(0, 30) : chat.title,
            messages: updatedMessages,
          }
        : chat
    );
    setChats(updatedChats);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const data = await response.json();
      const assistantMessage: Message = { role: 'assistant', content: data.reply };

      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === currentChatId
            ? { ...chat, messages: [...chat.messages, assistantMessage] }
            : chat
        )
      );
    } catch (error) {
      console.error('Error:', error);
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === currentChatId
            ? {
                ...chat,
                messages: [
                  ...chat.messages,
                  { role: 'assistant', content: 'Error: could not reach the server.' },
                ],
              }
            : chat
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (showAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 w-full max-w-md shadow-2xl">
          <h1 className="text-4xl font-bold gradient-text mb-2 text-center">NEURO-OS</h1>
          <p className="text-slate-300 text-center mb-8">Advanced AI Chatbot Platform</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
            <input
              type="password"
              placeholder="Password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              Login / Sign Up
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-64 bg-slate-900/50 backdrop-blur-xl border-r border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10">
          <button
            onClick={createNewChat}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2 rounded-lg transition-all duration-200"
          >
            <Plus size={20} /> New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`group p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                currentChatId === chat.id
                  ? 'bg-blue-600/30 border border-blue-500/50'
                  : 'hover:bg-white/5 border border-transparent'
              }`}
              onClick={() => setCurrentChatId(chat.id)}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-white truncate flex-1">{chat.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChat(chat.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={16} className="text-red-400 hover:text-red-300" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full text-sm text-slate-400 hover:text-white transition-colors py-2"
          >
            Logout ({user?.email})
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="bg-slate-900/50 backdrop-blur-xl border-b border-white/10 p-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold gradient-text">NEURO-OS</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {currentChatId && getCurrentChat()?.messages.length === 0 && (
            <div className="h-full flex items-center justify-center text-center">
              <div>
                <h2 className="text-3xl font-bold gradient-text mb-2">Start a Conversation</h2>
                <p className="text-slate-400">Ask me anything, or use voice input!</p>
              </div>
            </div>
          )}

          {getCurrentChat()?.messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              <div
                className={`max-w-2xl p-4 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                    : 'bg-white/10 border border-white/20 text-slate-100'
                }`}
              >
                <div className="markdown prose prose-invert max-w-none">
                  <ReactMarkdown
                    components={{
                      code({ className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        return match ? (
                          <div className="relative bg-slate-950 rounded-lg overflow-hidden my-4">
                            <button
                              onClick={() => copyToClipboard(String(children))}
                              className="absolute top-2 right-2 bg-slate-700 hover:bg-slate-600 text-white p-2 rounded transition-colors"
                            >
                              {copied ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                            <SyntaxHighlighter style={dracula} language={match[1]} PreTag="div" {...props}>
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          </div>
                        ) : (
                          <code className="bg-slate-950 px-2 py-1 rounded text-yellow-300" {...props}>
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/10 border border-white/20 text-slate-100 p-4 rounded-2xl">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border-t border-white/10 p-4">
          <div className="flex gap-2 mb-2">
            <button
              onClick={toggleVoiceInput}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                isListening ? 'bg-red-600 text-white' : 'bg-white/10 hover:bg-white/20 text-slate-300'
              }`}
            >
              <Mic size={20} /> {isListening ? 'Listening...' : 'Voice'}
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..."
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all duration-200"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold p-3 rounded-lg transition-all duration-200 disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}