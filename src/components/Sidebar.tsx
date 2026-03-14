import React, { useRef } from 'react';
import { MoreHorizontal, Plus, Upload } from 'lucide-react';
import { Page, SectionType } from '../types';

interface SidebarProps {
  pages: Page[];
  activePageId: string;
  activeSection: SectionType;
  onSelectPage: (id: string) => void;
  onAddPage: () => void;
  onImportFile: (file: File) => void;
}

export default function Sidebar({ pages, activePageId, activeSection, onSelectPage, onAddPage, onImportFile }: SidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sectionPages = pages.filter(p => p.section === activeSection);

  return (
    <aside className="w-64 border-r bg-white dark:bg-slate-800 dark:border-slate-700 flex flex-col transition-colors duration-300">
      <div className="flex border-b dark:border-slate-700 text-xs font-semibold">
        <button className="flex-1 py-3 border-b-2 border-blue-600 text-blue-600 dark:text-blue-400">线性视图</button>
        <button className="flex-1 py-3 border-b-2 border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">分支树</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {sectionPages.length === 0 && (
          <div className="text-center text-xs text-gray-400 dark:text-gray-500 py-4">
            当前章节暂无页面
          </div>
        )}
        {sectionPages.map((page, index) => {
          const isActive = page.id === activePageId;
          return (
            <div key={page.id} className="group cursor-pointer" onClick={() => onSelectPage(page.id)}>
              <div className="flex justify-between items-center mb-1 px-1">
                <span className={`text-[10px] font-bold uppercase ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}>
                  {page.title || `场景 ${index + 1}`}
                </span>
                <MoreHorizontal className="w-3 h-3 text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100" />
              </div>
              <div className={`aspect-video rounded-md overflow-hidden flex items-center justify-center relative ${
                isActive 
                  ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500 shadow-sm' 
                  : 'bg-gray-100 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 transition-colors'
              }`}>
                {isActive && <div className="absolute inset-0 math-grid opacity-30 dark:opacity-20"></div>}
                {page.blocks.some(b => b.type === 'math-graph') ? (
                  <div className="w-1/2 h-1 bg-blue-500 rounded-full absolute top-1/2 left-1/4 -rotate-12"></div>
                ) : page.blocks.some(b => b.type === 'image') ? (
                  <img src={page.blocks.find(b => b.type === 'image')?.content} className="w-full h-full object-cover opacity-50 dark:opacity-40" />
                ) : (
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">{page.title || `场景 ${index + 1}`}</span>
                )}
              </div>
            </div>
          );
        })}
        
        <div className="grid grid-cols-2 gap-2 mt-4">
          <button 
            onClick={onAddPage}
            className="py-4 border-2 border-dashed border-gray-200 dark:border-slate-600 rounded-md flex flex-col items-center justify-center gap-1 hover:border-gray-300 dark:hover:border-slate-500 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all"
          >
            <Plus className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">添加场景</span>
          </button>
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="py-4 border-2 border-dashed border-gray-200 dark:border-slate-600 rounded-md flex flex-col items-center justify-center gap-1 hover:border-gray-300 dark:hover:border-slate-500 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all"
          >
            <Upload className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">导入文件</span>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*,.pdf,.ppt,.pptx"
            onChange={handleFileChange}
          />
        </div>
      </div>
    </aside>
  );
}
