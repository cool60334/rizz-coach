import React, { useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface FileUploadProps {
  label: string;
  onFileSelect: (base64: string, preview: string) => void;
  onClear?: () => void;
  accept?: string;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ 
  label, 
  onFileSelect, 
  onClear,
  accept = "image/*", 
  disabled = false 
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Extract base64 data (remove data:image/png;base64, prefix)
      const base64Data = result.split(',')[1];
      setPreview(result);
      onFileSelect(base64Data, result);
    };
    reader.readAsDataURL(file);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onClear) onClear();
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
        disabled={disabled}
      />
      
      {!preview ? (
        <div 
          onClick={handleClick}
          className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center transition-all cursor-pointer h-48
            ${disabled 
              ? 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed' 
              : 'border-gray-300 hover:border-indigo-500 hover:bg-indigo-50 bg-white shadow-sm'}
          `}
        >
          <div className={`p-3 rounded-full mb-3 ${disabled ? 'bg-gray-200' : 'bg-indigo-50'}`}>
            <Upload className={`w-6 h-6 ${disabled ? 'text-gray-400' : 'text-indigo-600'}`} />
          </div>
          <span className={`text-sm font-semibold ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
            {label}
          </span>
          <span className="text-xs text-gray-500 mt-1">
            支援 JPG, PNG (建議使用截圖)
          </span>
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-md group h-48">
          <img 
            src={preview} 
            alt="Uploaded content" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity">
             <div className="flex items-center text-white text-sm font-medium">
                <ImageIcon className="w-4 h-4 mr-2" />
                <span>已就緒</span>
             </div>
          </div>
          <button 
            onClick={handleClear}
            className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-red-50 text-gray-600 hover:text-red-500 rounded-full shadow-sm transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};