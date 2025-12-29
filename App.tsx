import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AnalysisResult } from './components/AnalysisResult';
import { analyzeProfileImage, analyzeChatImage } from './services/gemini';
import { Message, Session, ChatAdvice } from './types';
import { 
  Sparkles, 
  Send, 
  Image as ImageIcon, 
  Plus, 
  MessageSquare, 
  Menu, 
  X, 
  Loader2,
  Trash2,
  User,
  Pencil,
  Check,
  Info,
  GripVertical
} from 'lucide-react';

// Simple UUID generator fallback
const generateId = () => Math.random().toString(36).substring(2, 9);

export default function App() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false); // Right sidebar/Drawer for profile
  
  // Resizable Sidebar State
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  // Sidebar Editing State
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  
  // Input State
  const [inputText, setInputText] = useState('');
  const [inputImage, setInputImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentSession = sessions.find(s => s.id === currentSessionId);

  // Initialize new session on load if none
  useEffect(() => {
    if (sessions.length === 0) {
      createNewSession();
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages, isProcessing]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputText]);

  // Resizing Logic
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 250 && newWidth < 800) {
        setSidebarWidth(newWidth);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const createNewSession = () => {
    const newSession: Session = {
      id: generateId(),
      title: '新對話',
      messages: [],
      lastUpdated: Date.now(),
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setProfileOpen(false);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentSessionId === id) {
      const remaining = sessions.filter(s => s.id !== id);
      if (remaining.length > 0) {
        setCurrentSessionId(remaining[0].id);
      } else {
        createNewSession();
      }
    }
  };

  // Sidebar Title Editing
  const startEditing = (e: React.MouseEvent, session: Session) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
  };

  const saveTitle = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editingSessionId && editingTitle.trim()) {
      setSessions(prev => prev.map(s => 
        s.id === editingSessionId ? { ...s, title: editingTitle.trim() } : s
      ));
    }
    setEditingSessionId(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setInputImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async () => {
    if ((!inputText.trim() && !inputImage) || isProcessing || !currentSessionId) return;

    const base64Image = inputImage ? inputImage.split(',')[1] : undefined;
    const userMsgId = generateId();
    
    // 1. Add User Message
    const userMessage: Message = {
      id: userMsgId,
      role: 'user',
      type: 'text',
      content: inputText,
      image: inputImage || undefined,
      timestamp: Date.now()
    };

    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        return {
          ...s,
          messages: [...s.messages, userMessage],
          lastUpdated: Date.now()
        };
      }
      return s;
    }));

    // Clear input immediately
    setInputText('');
    setInputImage(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsProcessing(true);

    try {
      const activeSession = sessions.find(s => s.id === currentSessionId);
      const newMessages: Message[] = [];

      // CORE LOGIC: Profile vs Chat
      if (!activeSession?.activeProfile) {
        if (!base64Image) {
           throw new Error("請先上傳一張對方的個人檔案截圖 (Tinder/IG)，讓我建立她的性格側寫。");
        }
        
        const profileData = await analyzeProfileImage(base64Image, inputText);
        
        // Save profile AND update session title with her name
        const detectedName = profileData.basicInfo.name || '新對象';
        
        setSessions(prev => prev.map(s => {
          if (s.id === currentSessionId) {
            return { 
              ...s, 
              activeProfile: profileData,
              title: detectedName
            };
          }
          return s;
        }));

        // Automatically open the profile view
        setProfileOpen(true);

        // Message 1: The Profile Card
        newMessages.push({
          id: generateId(),
          role: 'model',
          type: 'profile_analysis',
          profileData: profileData,
          timestamp: Date.now()
        });

        // Message 2: Opening Lines (Separate Bubble)
        if (profileData.openingLines && profileData.openingLines.length > 0) {
          const openingLineAdvice: ChatAdvice = {
            situationAnalysis: `已成功建立 ${detectedName} 的檔案。根據她的興趣與性格，以下是幾個適合的開場白建議：`,
            suggestions: profileData.openingLines,
            coachTip: "第一句話很重要！觀察照片細節，選擇一個最自然的切入點。不要只說「嗨」，試著引發她的好奇心。"
          };

          newMessages.push({
            id: generateId(),
            role: 'model',
            type: 'chat_advice',
            chatAdvice: openingLineAdvice,
            timestamp: Date.now() + 100 // Slight offset
          });
        }

      } else {
        const chatAdvice = await analyzeChatImage(base64Image || null, activeSession.activeProfile, inputText);
        
        newMessages.push({
          id: generateId(),
          role: 'model',
          type: 'chat_advice',
          chatAdvice: chatAdvice,
          timestamp: Date.now()
        });
      }

      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          return {
            ...s,
            messages: [...s.messages, ...newMessages],
            lastUpdated: Date.now()
          };
        }
        return s;
      }));

    } catch (error: any) {
      console.error(error);
      const errorMsg: Message = {
        id: generateId(),
        role: 'model',
        type: 'error',
        content: error.message || "抱歉，分析過程中發生錯誤，請稍後再試。",
        timestamp: Date.now()
      };
      setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [...s.messages, errorMsg] } : s));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      
      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* LEFT SIDEBAR (Session History) */}
      <aside 
        className={`
          fixed md:relative z-30 flex-shrink-0 w-72 h-full bg-gray-50 border-r border-gray-200 transition-transform duration-300 ease-in-out flex flex-col
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:border-none overflow-hidden'}
        `}
      >
        <div className="p-4">
          <button 
            onClick={() => {
              createNewSession();
              if (window.innerWidth < 768) setSidebarOpen(false);
            }}
            className="w-full flex items-center justify-start space-x-3 px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-full text-sm font-medium text-gray-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>開啟新對話</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          <div className="px-4 py-2 text-xs font-semibold text-gray-500">最近的對話</div>
          {sessions.map(session => (
            <div 
              key={session.id}
              onClick={() => {
                setCurrentSessionId(session.id);
                setProfileOpen(false);
                if (window.innerWidth < 768) setSidebarOpen(false);
              }}
              className={`group flex items-center justify-between px-4 py-2 rounded-full cursor-pointer transition-colors text-sm relative
                ${currentSessionId === session.id ? 'bg-indigo-100 text-indigo-900' : 'hover:bg-gray-100 text-gray-700'}
              `}
            >
              {editingSessionId === session.id ? (
                <form onSubmit={saveTitle} className="flex-1 flex items-center" onClick={e => e.stopPropagation()}>
                  <input
                    autoFocus
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={() => saveTitle()}
                    className="w-full bg-white border border-indigo-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button type="submit" className="ml-2 text-green-600 hover:text-green-700">
                    <Check className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <>
                  <div className="flex items-center overflow-hidden flex-1">
                    <MessageSquare className="w-4 h-4 mr-3 flex-shrink-0 opacity-70" />
                    <span className="truncate">{session.title}</span>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className={`flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ${currentSessionId === session.id ? 'opacity-100' : ''}`}>
                    <button
                      onClick={(e) => startEditing(e, session)}
                      className="p-1 rounded-full hover:bg-white/50 text-gray-400 hover:text-indigo-600"
                      title="編輯標題"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => deleteSession(e, session.id)}
                      className="p-1 rounded-full hover:bg-white/50 text-gray-400 hover:text-red-500"
                      title="刪除對話"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-gray-200">
           <div className="flex items-center space-x-3 px-2">
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
               AI
             </div>
             <div className="text-sm font-medium text-gray-700">RizzCoach</div>
           </div>
        </div>
      </aside>

      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex h-full relative overflow-hidden">
        
        {/* Chat Content Column */}
        <main className="flex-1 flex flex-col h-full bg-white relative min-w-0">
          
          {/* Header */}
          <header className="h-16 flex items-center justify-between px-4 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center min-w-0">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 -ml-2 mr-2 rounded-full hover:bg-gray-100 text-gray-600"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-medium text-gray-800 flex items-center gap-2 truncate">
                {currentSession?.title}
              </h1>
            </div>
            
            <div className="flex items-center space-x-2">
               {/* Toggle Profile Drawer Button */}
               {currentSession?.activeProfile && (
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className={`flex items-center px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                      ${profileOpen 
                        ? 'bg-indigo-100 text-indigo-700 border-indigo-200' 
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}
                    `}
                  >
                     <User className="w-4 h-4 mr-1.5" />
                     {profileOpen ? '隱藏檔案' : '查看檔案'}
                  </button>
               )}
            </div>
          </header>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth">
            {currentSession && currentSession.messages.length === 0 && (
               <div className="h-full flex flex-col items-center justify-center text-center opacity-0 animate-fadeIn" style={{animationFillMode: 'forwards'}}>
                  <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-indigo-200">
                     <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">你好，我是你的 AI 社交教練。</h2>
                  <p className="text-gray-500 max-w-md">
                    首先，請上傳一張對方的 <span className="font-semibold text-indigo-600">個人檔案截圖</span> (如 Tinder/IG)，讓我分析她的性格。
                  </p>
                  
                  {/* Quick Start Hints */}
                  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-lg">
                     <div className="p-4 border border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-600 text-left">
                        <p className="font-semibold mb-1 text-gray-800">1. 分析檔案</p>
                        上傳個人簡介，分析興趣與性格關鍵字。
                     </div>
                     <div className="p-4 border border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-600 text-left">
                        <p className="font-semibold mb-1 text-gray-800">2. 對話建議</p>
                        上傳對話截圖，獲取 3 種風格的回覆策略。
                     </div>
                  </div>
               </div>
            )}

            {currentSession?.messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className={`
                  flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1
                  ${msg.role === 'user' ? 'bg-gray-800 text-white' : 'bg-gradient-to-tr from-indigo-500 to-purple-600 text-white'}
                `}>
                  {msg.role === 'user' ? <User className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                </div>

                {/* Content Bubble */}
                <div className={`flex flex-col max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  
                  {/* User Info (Name + Time) */}
                  <div className={`flex items-center space-x-2 mb-1 text-xs text-gray-400 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <span className="font-medium">{msg.role === 'user' ? '你' : 'RizzCoach'}</span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  {/* Message Body */}
                  {msg.role === 'user' ? (
                     // User Bubble
                     <div className="bg-gray-100 text-gray-800 px-5 py-3 rounded-2xl rounded-tr-sm">
                        {msg.image && (
                          <div className="mb-3 rounded-lg overflow-hidden border border-gray-200">
                            <img src={msg.image} alt="User upload" className="max-w-full max-h-64 object-cover" />
                          </div>
                        )}
                        {msg.content && <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>}
                     </div>
                  ) : (
                     // Model Bubble
                     <div className="w-full">
                        {msg.type === 'profile_analysis' && msg.profileData && (
                          <AnalysisResult profileData={msg.profileData} mode="profile" />
                        )}
                        
                        {msg.type === 'chat_advice' && msg.chatAdvice && (
                          <AnalysisResult chatAdvice={msg.chatAdvice} mode="advice" />
                        )}

                        {msg.type === 'error' && (
                          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl border border-red-100 inline-block">
                             {msg.content}
                          </div>
                        )}
                        
                        {/* Generic text fallback if applicable */}
                        {msg.type === 'text' && msg.content && (
                          <div className="text-gray-800 leading-relaxed">
                            {msg.content}
                          </div>
                        )}
                     </div>
                  )}
                </div>
              </div>
            ))}

            {isProcessing && (
              <div className="flex items-start gap-4">
                 <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center mt-1 animate-pulse">
                    <Sparkles className="w-5 h-5" />
                 </div>
                 <div className="flex items-center space-x-2 mt-2">
                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="flex-shrink-0 p-4 max-w-4xl mx-auto w-full">
             <div className={`
                bg-gray-100 rounded-3xl p-2 flex flex-col transition-colors focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 border border-transparent focus-within:border-indigo-200
                ${inputImage ? 'rounded-2xl' : ''}
             `}>
                
                {/* Image Preview */}
                {inputImage && (
                  <div className="px-3 pt-3 pb-1 flex">
                    <div className="relative group">
                      <img src={inputImage} alt="Upload preview" className="h-20 w-auto rounded-lg border border-gray-300 shadow-sm" />
                      <button 
                        onClick={() => {
                          setInputImage(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="absolute -top-2 -right-2 bg-gray-800 text-white rounded-full p-1 shadow-md hover:bg-red-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-end gap-2 p-2">
                   {/* Upload Button */}
                   <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2.5 text-gray-500 hover:text-indigo-600 hover:bg-gray-200 rounded-full transition-all"
                      title="上傳圖片"
                      disabled={isProcessing}
                   >
                      <ImageIcon className="w-5 h-5" />
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFileSelect}
                      />
                   </button>

                   {/* Text Input */}
                   <textarea
                      ref={textareaRef}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={!currentSession?.activeProfile ? "上傳個人檔案截圖並開始..." : "輸入對話狀況，或上傳聊天截圖..."}
                      className="flex-1 max-h-[200px] bg-transparent border-none focus:ring-0 resize-none py-2.5 px-2 text-gray-800 placeholder-gray-400 leading-6"
                      rows={1}
                      disabled={isProcessing}
                   />

                   {/* Send Button */}
                   <button 
                      onClick={handleSendMessage}
                      disabled={(!inputText.trim() && !inputImage) || isProcessing}
                      className={`p-2.5 rounded-full transition-all flex items-center justify-center
                        ${(!inputText.trim() && !inputImage) || isProcessing
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200'}
                      `}
                   >
                      {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                   </button>
                </div>
             </div>
             <div className="text-center mt-2 text-xs text-gray-400">
                Gemini 可能會顯示不準確的資訊，請務必再次確認。
             </div>
          </div>
        </main>

        {/* RIGHT PROFILE DRAWER (Resizable) */}
        <aside 
          ref={sidebarRef}
          style={{ width: profileOpen ? sidebarWidth : 0 }}
          className={`
             fixed inset-y-0 right-0 z-40 bg-white border-l border-gray-200 shadow-2xl transition-all duration-200 ease-out
             md:relative md:shadow-none md:z-0
             ${profileOpen ? '' : 'overflow-hidden border-l-0'}
          `}
        >
           {/* Resize Handle */}
           <div
             onMouseDown={startResizing}
             className={`absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-500/20 active:bg-indigo-500 z-50 transition-colors flex items-center justify-center group
                ${isResizing ? 'bg-indigo-500' : 'bg-transparent'}
             `}
           >
              <div className="h-8 w-1 rounded-full bg-gray-300 group-hover:bg-indigo-400 hidden group-hover:block" />
           </div>

           <div className="h-full flex flex-col overflow-hidden" style={{ width: sidebarWidth }}>
              <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                 <h3 className="font-bold text-gray-800 flex items-center">
                    <User className="w-4 h-4 mr-2 text-indigo-600" />
                    目前檔案
                 </h3>
                 <button 
                   onClick={() => setProfileOpen(false)}
                   className="p-1 rounded-full hover:bg-gray-100"
                 >
                    <X className="w-5 h-5 text-gray-500" />
                 </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                 {currentSession?.activeProfile ? (
                    <AnalysisResult profileData={currentSession.activeProfile} mode="profile" />
                 ) : (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-center p-4">
                       <Info className="w-8 h-8 mb-2 opacity-50" />
                       <p className="text-sm">尚未建立檔案</p>
                       <p className="text-xs mt-1">請在對話中上傳個人簡介截圖</p>
                    </div>
                 )}
              </div>
           </div>
        </aside>

      </div>
    </div>
  );
}