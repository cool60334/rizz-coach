import React from 'react';
import { ProfileAnalysis, ChatAdvice } from '../types';
import { User, MessageCircle, Brain, Target, Sparkles, MapPin, Briefcase, Star, Lightbulb } from 'lucide-react';

interface AnalysisResultProps {
  profileData?: ProfileAnalysis | null;
  chatAdvice?: ChatAdvice | null;
  mode: 'profile' | 'advice';
}

export const AnalysisResult: React.FC<AnalysisResultProps> = ({ profileData, chatAdvice, mode }) => {
  if (!profileData) return null;

  if (mode === 'profile') {
    return (
      <div className="animate-fadeIn">
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-xl shadow-gray-200/50">
          <div className="flex items-center mb-6">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-xl mr-4 shadow-lg shadow-indigo-200">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">目標檔案分析</h2>
              <p className="text-gray-500 text-sm">基於上傳資料的 AI 側寫</p>
            </div>
          </div>
          
          <div className="bg-indigo-50/50 rounded-2xl p-5 mb-6 border border-indigo-100">
             <p className="text-gray-700 leading-relaxed italic flex gap-3">
               <Sparkles className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
               "{profileData.summary}"
             </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">基本資訊</h3>
              <div className="bg-gray-50 p-4 rounded-xl space-y-3 border border-gray-100">
                <div className="flex items-center text-gray-700">
                   <Star className="w-4 h-4 mr-3 text-gray-400" />
                   <span className="text-sm font-medium w-12 text-gray-500">年齡</span>
                   <span className="font-semibold">{profileData.basicInfo.age || '未知'}</span>
                </div>
                <div className="flex items-center text-gray-700">
                   <Briefcase className="w-4 h-4 mr-3 text-gray-400" />
                   <span className="text-sm font-medium w-12 text-gray-500">職業</span>
                   <span className="font-semibold">{profileData.basicInfo.occupation || '未知'}</span>
                </div>
                <div className="flex items-center text-gray-700">
                   <MapPin className="w-4 h-4 mr-3 text-gray-400" />
                   <span className="text-sm font-medium w-12 text-gray-500">地點</span>
                   <span className="font-semibold">{profileData.basicInfo.location || '未知'}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">性格標籤</h3>
              <div className="flex flex-wrap gap-2 content-start">
                {profileData.personalityTraits.map((trait, i) => (
                  <span key={i} className="px-3 py-1.5 bg-white text-indigo-600 text-sm font-medium rounded-lg border border-indigo-100 shadow-sm">
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">興趣愛好</h3>
            <div className="flex flex-wrap gap-2">
              {profileData.interests.map((interest, i) => (
                <span key={i} className="px-3 py-1.5 bg-pink-50 text-pink-600 text-sm font-medium rounded-lg border border-pink-100">
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Advice Mode
  if (!chatAdvice) return null;

  return (
    <div className="animate-fadeIn">
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-xl shadow-gray-200/50 relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-50 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

        <div className="flex items-center mb-6 relative z-10">
          <div className="bg-gradient-to-br from-teal-400 to-emerald-500 p-2.5 rounded-xl mr-4 shadow-lg shadow-teal-200">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">聊天教練建議</h2>
            <p className="text-gray-500 text-sm">即時分析與回覆策略</p>
          </div>
        </div>

        <div className="mb-8 bg-amber-50 p-5 rounded-2xl border border-amber-100 relative z-10">
          <h3 className="flex items-center text-amber-600 font-bold mb-2 text-sm uppercase tracking-wide">
            <Brain className="w-4 h-4 mr-2" />
            情境分析
          </h3>
          <p className="text-gray-700 text-sm leading-relaxed font-medium">
            {chatAdvice.situationAnalysis}
          </p>
        </div>

        <div className="space-y-5 mb-8 relative z-10">
          {chatAdvice.suggestions.map((suggestion, idx) => (
            <div key={idx} className="bg-white border-2 border-gray-100 hover:border-teal-400 transition-all rounded-2xl p-5 group shadow-sm hover:shadow-md">
              <div className="flex justify-between items-center mb-3">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider
                  ${idx === 0 ? 'bg-blue-100 text-blue-600' : 
                    idx === 1 ? 'bg-purple-100 text-purple-600' : 
                    'bg-orange-100 text-orange-600'}`}>
                  {suggestion.style}
                </span>
                <button 
                  onClick={() => navigator.clipboard.writeText(suggestion.content)}
                  className="text-xs font-medium text-gray-400 hover:text-teal-600 transition-colors opacity-0 group-hover:opacity-100 flex items-center bg-gray-50 px-2 py-1 rounded-full"
                >
                  複製內容
                </button>
              </div>
              <p className="text-gray-800 text-lg font-medium mb-4 leading-relaxed font-sans">
                "{suggestion.content}"
              </p>
              <div className="flex items-start text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                <Lightbulb className="w-3.5 h-3.5 mr-2 mt-0.5 text-gray-400 shrink-0" />
                <span>{suggestion.explanation}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-teal-900 p-5 rounded-2xl shadow-lg relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
           <div className="flex items-start relative z-10">
             <Target className="w-5 h-5 text-teal-300 mr-3 mt-0.5 shrink-0" />
             <div>
               <h4 className="text-white font-bold text-sm mb-1">教練叮嚀</h4>
               <p className="text-sm text-teal-100/90 leading-relaxed">
                 {chatAdvice.coachTip}
               </p>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};