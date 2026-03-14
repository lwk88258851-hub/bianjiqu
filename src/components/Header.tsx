import React from 'react';
import { BookOpen, Edit3, Sparkles, Eye, Moon, Sun } from 'lucide-react';
import { SectionType } from '../types';
import { SECTIONS } from '../constants';

interface HeaderProps {
  title: string;
  activeSection: SectionType;
  onSelectSection: (section: SectionType) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export default function Header({ title, activeSection, onSelectSection, theme, onToggleTheme }: HeaderProps) {
  return (
    <header className="h-16 border-b bg-white dark:bg-slate-800 dark:border-slate-700 flex items-center justify-between px-4 z-50 transition-colors duration-300">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight text-gray-900 dark:text-white">EduClass 编辑器</span>
        </div>
        <div className="h-6 w-px bg-gray-200 dark:bg-slate-700"></div>
        <div className="flex items-center gap-2 group cursor-pointer">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</span>
          <Edit3 className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400" />
        </div>
      </div>
      
      <nav className="hidden lg:flex items-center bg-gray-100 dark:bg-slate-900 rounded-full p-1 px-2 gap-1 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 transition-colors duration-300">
        {SECTIONS.map(item => (
          <span 
            key={item} 
            onClick={() => onSelectSection(item)}
            className={`px-3 py-1.5 cursor-pointer rounded-full transition-all ${
              activeSection === item 
                ? 'bg-blue-600 text-white shadow-md ring-1 ring-blue-700 dark:ring-blue-500' 
                : 'hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-slate-800'
            }`}
          >
            {item}
          </span>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <button 
          onClick={onToggleTheme}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          title="切换主题"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors">
          <Sparkles className="w-4 h-4" /> AI 魔法布局
        </button>
        <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
          <Eye className="w-4 h-4" /> 预览
        </button>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 rounded-lg shadow-sm transition-all">
          发布
        </button>
      </div>
    </header>
  );
}
