'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Send, Plus, Trash2, Mic, Copy, Check, Bot } from 'lucide-react';

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
  const [copied, setCopied] = useState<string | null>(null);
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
    const remaining = chats.filter((chat) => chat.id !== id);
    setChats(remaining);
    if (currentChatId === id) {
      setCurrentChatId(remaining.length > 0 ? remaining[0].id : null);
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
    if (!input.trim()) return;

    let activeChatId = currentChatId;

    if (!activeChatId) {
      const newChat: Chat = {
        id: Date.now().toString(),
        title: input.substring(0, 30),
        messages: [],
      };
      setChats((prev) => [newChat, ...prev]);
      activeChatId = newChat.id;
      setCurrentChatId(activeChatId);
    }

    const userMessage: Message = { role: 'user', content: input };
    const messageToSend = input;
    setInput('');
    setLoading(true);

    setChats((prevChats) => {
      const exists = prevChats.find((c) => c.id === activeChatId);
      if (exists) {
        return prevChats.map((chat) =>
          chat.id === activeChatId
            ? {
                ...chat,
                title: chat.messages.length === 0 ? messageToSend.substring(0, 30) : chat.title,
                messages: [...chat.messages, userMessage],
              }
            : chat
        );
      }
      return [
        { id: activeChatId as string, title: messageToSend.substring(0, 30), messages: [userMessage] },
        ...prevChats,
      ];
    });

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageToSend }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const data = await response.json();
      const assistantMessage: Message = { role: 'assistant', content: data.reply };

      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === activeChatId
            ? { ...chat, messages: [...chat.messages, assistantMessage] }
            : chat
        )
      );
    } catch (error) {
      console.error('Error:', error);
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === activeChatId
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

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const activeChat = getCurrentChat();

  // Shared full-screen layout wrapper — same on both login and chat
  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">

      {/* Sidebar — always visible on both login and chat */}
      <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        <div className="px-4 pt-5 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <Bot size={20} className="text-blue-400 shrink-0" />
            <span className="text-base font-semibold text-white">NEURO-OS</span>
          </div>
          {!showAuth && (
            <button
              onClick={createNewChat}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors"
            >
              <Plus size={16} /> New Chat
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {showAuth ? (
            <p className="text-xs text-slate-700 text-center mt-8 px-4">
              Sign in to start chatting
            </p>
          ) : chats.length === 0 ? (
            <p className="text-xs text-slate-600 text-center mt-8 px-4">
              No conversations yet
            </p>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                className={`group mx-2 px-3 py-2 rounded-lg cursor-pointer transition-colors mb-0.5 ${
                  currentChatId === chat.id
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
                onClick={() => setCurrentChatId(chat.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm truncate flex-1">
                    {chat.messages.length === 0 ? 'New conversation' : chat.title}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChat(chat.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 hover:text-red-400"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-3 border-t border-slate-800">
          {!showAuth && (
            <>
              <div className="text-xs text-slate-600 truncate mb-1">{user?.email}</div>
              <button
                onClick={handleLogout}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Sign out
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main content area — same position on both pages */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar — same height on both pages */}
        <div className="h-14 border-b border-slate-800 px-6 flex items-center shrink-0">
          <span className="text-sm font-medium text-slate-400">
            {showAuth
              ? 'Welcome'
              : activeChat?.messages.length
              ? activeChat.title
              : 'New Chat'}
          </span>
        </div>

        {/* Content area */}
        {showAuth ? (
          // Login card centered in main content area
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-center gap-3 mb-1">
                <Bot size={28} className="text-blue-400" />
                <h1 className="text-2xl font-bold text-white">NEURO-OS</h1>
              </div>
              <p className="text-slate-500 text-center mb-6 text-xs">
                Advanced AI Chatbot Platform
              </p>
              <form onSubmit={handleLogin} className="space-y-3">
                <input
                  type="email"
                  placeholder="Email address"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-all"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition-all"
                />
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm mt-1"
                >
                  Continue →
                </button>
              </form>
              <p className="text-center text-xs text-slate-700 mt-4">
                Any credentials work — local session only
              </p>
            </div>
          </div>
        ) : (
          // Chat interface
          <>
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-2xl mx-auto px-4 py-8">
                {(!activeChat || activeChat.messages.length === 0) && (
                  <div className="flex flex-col items-center justify-center h-96 text-center">
                    <Bot size={48} className="text-slate-700 mb-4" />
                    <h2 className="text-2xl font-semibold text-slate-300 mb-2">
                      How can I help you today?
                    </h2>
                    <p className="text-slate-600 text-sm">
                      Type a message below or use the Voice button
                    </p>
                  </div>
                )}

                <div className="space-y-6">
                  {activeChat?.messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                          <Bot size={14} />
                        </div>
                      )}
                      <div
                        className={`max-w-xl rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white rounded-br-sm'
                            : 'bg-slate-800 text-slate-100 rounded-bl-sm'
                        }`}
                      >
                        <div className="markdown prose prose-invert prose-sm max-w-none">
                          <ReactMarkdown
                            components={{
                              code({ className, children, ...props }: any) {
                                const match = /language-(\w+)/.exec(className || '');
                                const codeId = `code-${idx}`;
                                return match ? (
                                  <div className="relative rounded-lg overflow-hidden my-3 bg-slate-950 border border-slate-700">
                                    <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-700">
                                      <span className="text-xs text-slate-500 font-mono">{match[1]}</span>
                                      <button
                                        onClick={() => copyToClipboard(String(children), codeId)}
                                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                                      >
                                        {copied === codeId ? (
                                          <><Check size={12} /> Copied</>
                                        ) : (
                                          <><Copy size={12} /> Copy</>
                                        )}
                                      </button>
                                    </div>
                                    <SyntaxHighlighter
                                      style={dracula}
                                      language={match[1]}
                                      PreTag="div"
                                      customStyle={{ margin: 0, background: 'transparent', padding: '1rem' }}
                                      {...props}
                                    >
                                      {String(children).replace(/\n$/, '')}
                                    </SyntaxHighlighter>
                                  </div>
                                ) : (
                                  <code className="bg-slate-900 px-1.5 py-0.5 rounded text-blue-300 font-mono text-xs" {...props}>
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
                      {msg.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                          {user?.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                  ))}

                  {loading && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                        <Bot size={14} />
                      </div>
                      <div className="bg-slate-800 rounded-2xl rounded-bl-sm px-4 py-3">
                        <div className="flex gap-1.5 items-center h-4">
                          <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                          <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                          <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800 px-4 py-4 shrink-0">
              <div className="max-w-2xl mx-auto">
                <div className="flex gap-2 items-center bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 focus-within:border-blue-500 transition-colors">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder="Message NEURO-OS..."
                    className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none"
                  />
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={toggleVoiceInput}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isListening ? 'text-red-400 bg-red-400/10' : 'text-slate-500 hover:text-slate-300'
                      }`}
                      title={isListening ? 'Stop listening' : 'Voice input'}
                    >
                      <Mic size={18} />
                    </button>
                    <button
                      onClick={handleSend}
                      disabled={loading || !input.trim()}
                      className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white p-1.5 rounded-lg transition-colors"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-center text-xs text-slate-700 mt-2">
                  NEURO-OS can make mistakes. Verify important information.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}