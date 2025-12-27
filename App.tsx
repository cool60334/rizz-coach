import React, { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { AnalysisResult } from './components/AnalysisResult';
import { analyzeProfileImage, analyzeChatImage } from './services/gemini';
import { ProfileAnalysis, ChatAdvice } from './types';
import { Sparkles, Loader2, UserCircle2, MessageSquare, Lightbulb, ChevronRight, Check } from 'lucide-react';

// Steps definition
const STEPS = [
  { id: 1, title: "個人資料", icon: UserCircle2 },
  { id: 2, title: "對話內容", icon: MessageSquare },
  { id: 3, title: "教練建議", icon: Lightbulb },
];

export default function App() {
  const [activeStep, setActiveStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [chatImage, setChatImage] = useState<string | null>(null);
  
  const [profileData, setProfileData] = useState<ProfileAnalysis | null>(null);
  const [chatAdvice, setChatAdvice] = useState<ChatAdvice | null>(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStepClick = (stepId: number) => {
    // Only allow navigation to completed steps or the next immediate step
    if (completedSteps.includes(stepId) || stepId === activeStep || (stepId === activeStep + 1 && completedSteps.includes(activeStep))) {
      setActiveStep(stepId);
    } else if (stepId < activeStep) {
        setActiveStep(stepId);
    }
  };

  const markStepComplete = (stepId: number) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps(prev => [...prev, stepId]);
    }
  };

  const handleProfileUpload = (base64: string) => {
    setProfileImage(base64);
    // When re-uploading, clear downstream data but don't strictly reset view unless necessary
    setProfileData(null);
    setChatAdvice(null);
    setCompletedSteps([]); // Reset progress
    setError(null);
  };

  const handleChatUpload = (base64: string) => {
    setChatImage(base64);
    setChatAdvice(null);
    // Remove step 2 and 3 from completed if re-uploading chat
    setCompletedSteps(prev => prev.filter(s => s === 1));
  };

  const processProfile = async () => {
    if (!profileImage) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const data = await analyzeProfileImage(profileImage);
      setProfileData(data);
      markStepComplete(1);
      setActiveStep(2); // Auto advance
    } catch (err: any) {
      console.error(err);
      setError("無法分析個人檔案，請確認圖片清晰度。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const processChat = async () => {
    if (!chatImage || !profileData) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const advice = await analyzeChatImage(chatImage, profileData);
      setChatAdvice(advice);
      markStepComplete(2);
      setActiveStep(3); // Auto advance
    } catch (err: any) {
      console.error(err);
      setError("無法分析對話內容，請確認圖片清晰度。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-tr from-indigo-500 to-purple-600 p-1.5 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 hidden md:block">
              RizzCoach AI
            </h1>
          </div>
          
          {/* Stepper */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {STEPS.map((step, index) => {
              const isActive = activeStep === step.id;
              const isCompleted = completedSteps.includes(step.id);
              const isClickable = isCompleted || step.id <= Math.max(...completedSteps, 1) + 1;
              const Icon = step.icon;

              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => handleStepClick(step.id)}
                    disabled={!isClickable && !isActive}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-full transition-all text-sm font-medium
                      ${isActive 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                        : isClickable
                          ? isCompleted 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-100'
                          : 'text-gray-400 cursor-not-allowed'
                      }
                    `}
                  >
                    {isCompleted && !isActive ? <Check className="w-4 h-4" /> : <span className="w-4 h-4 flex items-center justify-center text-xs">{step.id}</span>}
                    <span className={`${isActive ? 'block' : 'hidden md:block'}`}>{step.title}</span>
                  </button>
                  {index < STEPS.length - 1 && (
                    <div className="w-4 h-0.5 bg-gray-200 mx-1 md:mx-2 hidden md:block" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto p-4 md:p-8 space-y-8">
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r shadow-sm animate-pulse">
            <p className="font-bold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Views */}
        <div className="transition-all duration-300">
          
          {/* STEP 1: Profile */}
          {activeStep === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-xl shadow-gray-200/50">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">上傳個人檔案</h2>
                <p className="text-gray-500 mb-6">請上傳對方的個人簡介截圖，AI 將分析她的興趣與性格。</p>
                
                <FileUpload 
                  label="點擊或拖放個人簡介" 
                  onFileSelect={handleProfileUpload}
                />
                
                {profileImage && (
                  <button 
                    onClick={processProfile}
                    disabled={isAnalyzing}
                    className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isAnalyzing ? (
                      <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> 分析中...</>
                    ) : (
                      <>開始分析檔案 <ChevronRight className="w-5 h-5 ml-2" /></>
                    )}
                  </button>
                )}
              </div>

              {/* Show result preview if data exists */}
              {profileData && (
                <div className="opacity-70 hover:opacity-100 transition-opacity">
                   <div className="text-center text-sm text-gray-400 mb-2">— 分析結果預覽 —</div>
                   <AnalysisResult profileData={profileData} mode="profile" />
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Chat */}
          {activeStep === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-xl shadow-gray-200/50">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">上傳對話內容</h2>
                <p className="text-gray-500 mb-6">上傳目前的聊天截圖，AI 將結合個人檔案提供回覆建議。</p>
                
                <FileUpload 
                  label="點擊或拖放聊天截圖" 
                  onFileSelect={handleChatUpload}
                  onClear={() => {
                    setChatImage(null);
                    setChatAdvice(null);
                    setCompletedSteps(prev => prev.filter(s => s !== 2));
                  }}
                />

                {chatImage && (
                   <button 
                    onClick={processChat}
                    disabled={isAnalyzing}
                    className="w-full mt-6 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-teal-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isAnalyzing ? (
                      <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> 教練思考中...</>
                    ) : (
                      <>生成回覆建議 <ChevronRight className="w-5 h-5 ml-2" /></>
                    )}
                  </button>
                )}
              </div>

               {/* Quick reference to profile */}
               <div className="bg-gray-100 rounded-2xl p-4 cursor-pointer hover:bg-white hover:shadow-md transition-all border border-gray-200" onClick={() => setActiveStep(1)}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">參考：目標對象</span>
                    <span className="text-xs text-indigo-500 font-medium">查看完整檔案 &rarr;</span>
                  </div>
                  <p className="text-gray-700 mt-2 text-sm line-clamp-2 italic">
                    "{profileData?.summary}"
                  </p>
               </div>
            </div>
          )}

          {/* STEP 3: Advice */}
          {activeStep === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <AnalysisResult profileData={profileData} chatAdvice={chatAdvice} mode="advice" />
              
              <div className="flex justify-center">
                <button 
                  onClick={() => {
                     setChatImage(null);
                     setChatAdvice(null);
                     setActiveStep(2);
                     setCompletedSteps(prev => prev.filter(s => s !== 2));
                  }}
                  className="text-gray-500 hover:text-indigo-600 font-medium text-sm flex items-center px-6 py-3 rounded-full hover:bg-white transition-colors"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  分析下一段對話
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}