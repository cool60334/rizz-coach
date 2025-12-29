import React from 'react';
import { ProfileAnalysis, ChatAdvice } from '../types';
import { User, MessageCircle, Brain, Target, Sparkles, MapPin, Briefcase, Star, Lightbulb, Copy } from 'lucide-react';

interface AnalysisResultProps {
  profileData?: ProfileAnalysis;
  chatAdvice?: ChatAdvice;
  mode: 'profile' | 'advice';
}

export const AnalysisResult: React.FC<AnalysisResultProps> = ({ profileData, chatAdvice, mode }) => {
  
  if (mode === 'profile' && profileData) {
    return (
      <div className="animate-fadeIn w-full max-w-3xl">
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
          <div className="flex items-center mb-4">
            <div className="bg-indigo-100 p-2 rounded-lg mr-3">
              <User className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {profileData.basicInfo.name ? `${profileData.basicInfo.name} 的檔案` : '目標對象檔案'}
              </h2>
            </div>
          </div>
          
          <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100">
             <p className="text-slate-700 leading-relaxed italic flex gap-2 text-sm">
               <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
               {profileData.summary}
             </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">基本資訊</h3>
              <div className="bg-white p-3 rounded-xl space-y-2 border border-gray-100 text-sm">
                <div className="flex items-center text-gray-700">
                   <Star className="w-3.5 h-3.5 mr-2 text-gray-400" />
                   <span className="text-gray-500 w-10">年齡</span>
                   <span className="font-semibold">{profileData.basicInfo.age || '未知'}</span>
                </div>
                <div className="flex items-center text-gray-700">
                   <Briefcase className="w-3.5 h-3.5 mr-2 text-gray-400" />
                   <span className="text-gray-500 w-10">職業</span>
                   <span className="font-semibold">{profileData.basicInfo.occupation || '未知'}</span>
                </div>
                <div className="flex items-center text-gray-700">
                   <MapPin className="w-3.5 h-3.5 mr-2 text-gray-400" />
                   <span className="text-gray-500 w-10">地點</span>
                   <span className="font-semibold">{profileData.basicInfo.location || '未知'}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">性格標籤</h3>
              <div className="flex flex-wrap gap-1.5 content-start">
                {profileData.personalityTraits.map((trait, i) => (
                  <span key={i} className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-md border border-indigo-100">
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2 mb-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">興趣愛好</h3>
            <div className="flex flex-wrap gap-1.5">
              {profileData.interests.map((interest, i) => (
                <span key={i} className="px-2.5 py-1 bg-pink-50 text-pink-600 text-xs font-medium rounded-md border border-pink-100">
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'advice' && chatAdvice) {
    return (
      <div className="animate-fadeIn w-full max-w-3xl">
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm relative overflow-hidden">
          {/* Header */}
          <div className="flex items-center mb-5 relative z-10">
            <div className="bg-teal-100 p-2 rounded-lg mr-3">
              <MessageCircle className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">教練回覆建議</h2>
            </div>
          </div>

          {/* Situation Analysis */}
          <div className="mb-6 bg-amber-50 p-4 rounded-xl border border-amber-100 relative z-10">
            <h3 className="flex items-center text-amber-700 font-bold mb-2 text-xs uppercase tracking-wide">
              <Brain className="w-3.5 h-3.5 mr-1.5" />
              情境分析
            </h3>
            <p className="text-gray-800 text-sm leading-relaxed">
              {chatAdvice.situationAnalysis}
            </p>
          </div>

          {/* Suggestions */}
          <div className="space-y-4 mb-6 relative z-10">
            {chatAdvice.suggestions.map((suggestion, idx) => (
              <div key={idx} className="bg-slate-50 border border-gray-200 hover:border-teal-400 transition-colors rounded-xl p-4 group">
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider
                    ${idx === 0 ? 'bg-blue-100 text-blue-600' : 
                      idx === 1 ? 'bg-purple-100 text-purple-600' : 
                      'bg-orange-100 text-orange-600'}`}>
                    {suggestion.style}
                  </span>
                  <button 
                    onClick={() => navigator.clipboard.writeText(suggestion.content)}
                    className="text-gray-400 hover:text-teal-600 p-1 rounded-md hover:bg-gray-100 transition-all opacity-0 group-hover:opacity-100"
                    title="複製文字"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-gray-900 text-base font-medium mb-3 leading-relaxed">
                  "{suggestion.content}"
                </p>
                <div className="flex items-start text-xs text-gray-500 bg-white p-2 rounded-lg border border-gray-100">
                  <Lightbulb className="w-3 h-3 mr-1.5 mt-0.5 text-gray-400 shrink-0" />
                  <span>{suggestion.explanation}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Coach Tip */}
          <div className="bg-teal-900 p-4 rounded-xl shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/20 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
             <div className="flex items-start relative z-10">
               <Target className="w-4 h-4 text-teal-300 mr-2.5 mt-0.5 shrink-0" />
               <div>
                 <h4 className="text-white font-bold text-xs mb-1 uppercase tracking-wide">教練叮嚀</h4>
                 <p className="text-sm text-teal-50 leading-relaxed">
                   {chatAdvice.coachTip}
                 </p>
               </div>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};