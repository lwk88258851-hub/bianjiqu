/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Workspace from './components/Workspace';
import PropertyPanel from './components/PropertyPanel';
import { CoursewareSchema, Block, SectionType, Page, BlockType } from './types';
import { INITIAL_STATE } from './constants';

export default function App() {
  const [courseware, setCourseware] = useState<CoursewareSchema>(INITIAL_STATE);
  const [activeSection, setActiveSection] = useState<SectionType>('探究');
  const [activePageId, setActivePageId] = useState<string>('page-demo');
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);

  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (courseware.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [courseware.theme]);

  const activePage = courseware.pages.find(p => p.id === activePageId) || courseware.pages.find(p => p.section === activeSection) || null;
  const activeBlock = activePage?.blocks.find(b => b.id === activeBlockId) || null;

  const handleSelectSection = (section: SectionType) => {
    setActiveSection(section);
    const firstPageInSection = courseware.pages.find(p => p.section === section);
    if (firstPageInSection) {
      setActivePageId(firstPageInSection.id);
    } else {
      setActivePageId('');
    }
    setActiveBlockId(null);
  };

  const handleAddPage = () => {
    const newPage: Page = {
      id: `page-${Date.now()}`,
      title: `新场景`,
      section: activeSection,
      blocks: [],
    };
    setCourseware(prev => ({
      ...prev,
      pages: [...prev.pages, newPage]
    }));
    setActivePageId(newPage.id);
    setActiveBlockId(null);
  };

  const handleAddBlock = (blockData: Partial<Block> & { type: BlockType }) => {
    if (!activePageId) return;

    const newBlock: Block = {
      id: `block-${Date.now()}`,
      type: blockData.type,
      x: blockData.x !== undefined ? blockData.x : 100,
      y: blockData.y !== undefined ? blockData.y : 100,
      width: blockData.width !== undefined ? blockData.width : (blockData.type === 'math-graph' ? 320 : 200),
      height: blockData.height !== undefined ? blockData.height : (blockData.type === 'math-graph' ? 256 : 100),
      content: blockData.content || '',
      mathConfig: blockData.type === 'math-graph' ? (blockData.mathConfig || {
        equation: 'y = x²',
        showGrid: true,
        showLabels: true,
        variables: {
          x: { min: -10, max: 10, step: 1, value: 0, allowDrag: true }
        }
      }) : undefined,
      style: blockData.style,
      action: blockData.action,
      state: blockData.state,
      events: blockData.events,
      label: blockData.label,
      src: blockData.src
    };

    setCourseware(prev => ({
      ...prev,
      pages: prev.pages.map(page => 
        page.id === activePageId 
          ? { ...page, blocks: [...page.blocks, newBlock] }
          : page
      )
    }));
    setActiveBlockId(newBlock.id);
  };

  const handleImportFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const newPage: Page = {
        id: `page-${Date.now()}`,
        title: file.name,
        section: activeSection,
        blocks: [
          {
            id: `block-${Date.now()}`,
            type: 'image',
            x: 50,
            y: 50,
            width: 400,
            height: 300,
            content: content
          }
        ],
      };
      setCourseware(prev => ({
        ...prev,
        pages: [...prev.pages, newPage]
      }));
      setActivePageId(newPage.id);
      setActiveBlockId(null);
    };
    reader.readAsDataURL(file);
  };

  const updateBlock = (pageId: string, blockId: string, updates: Partial<Block>) => {
    setCourseware(prev => ({
      ...prev,
      pages: prev.pages.map(page => 
        page.id === pageId 
          ? {
              ...page,
              blocks: page.blocks.map(block => 
                block.id === blockId ? { ...block, ...updates } : block
              )
            }
          : page
      )
    }));
  };

  const deleteBlock = (pageId: string, blockId: string) => {
    setCourseware(prev => ({
      ...prev,
      pages: prev.pages.map(page => 
        page.id === pageId 
          ? {
              ...page,
              blocks: page.blocks.filter(block => block.id !== blockId)
            }
          : page
      )
    }));
    setActiveBlockId(null);
  };

  return (
    <div className={`h-screen overflow-hidden flex flex-col font-sans transition-colors duration-300 ${courseware.theme === 'dark' ? 'dark bg-slate-900 text-gray-100' : 'bg-white text-gray-900'}`}>
      <Header 
        title={courseware.title} 
        activeSection={activeSection}
        onSelectSection={handleSelectSection}
        theme={courseware.theme || 'light'}
        onToggleTheme={() => {
          const newTheme = courseware.theme === 'dark' ? 'light' : 'dark';
          setCourseware(prev => ({ ...prev, theme: newTheme }));
          if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }}
      />
      <main className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar Toggle */}
        <button 
          onClick={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
          className="absolute top-1/2 -translate-y-1/2 z-30 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full p-1 shadow-lg hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 text-gray-600 dark:text-gray-300 transition-all"
          style={{ left: leftSidebarCollapsed ? '12px' : '244px' }}
          title={leftSidebarCollapsed ? "展开侧边栏" : "收起侧边栏"}
        >
          {leftSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <div className={`transition-all duration-300 ease-in-out overflow-hidden flex shrink-0 ${leftSidebarCollapsed ? 'w-0' : 'w-64'}`}>
          <Sidebar 
            pages={courseware.pages} 
            activePageId={activePageId} 
            activeSection={activeSection}
            onSelectPage={setActivePageId} 
            onAddPage={handleAddPage}
            onImportFile={handleImportFile}
          />
        </div>

        {activePage ? (
          <Workspace 
            page={activePage} 
            activeBlockId={activeBlockId}
            onSelectBlock={setActiveBlockId}
            onUpdateBlock={(blockId, updates) => updateBlock(activePage.id, blockId, updates)}
            onAddBlock={handleAddBlock}
            onDeleteBlock={(blockId) => deleteBlock(activePage.id, blockId)}
          />
        ) : (
          <div className="flex-1 bg-gray-100 dark:bg-slate-900 flex items-center justify-center text-gray-400 dark:text-gray-500 transition-colors duration-300">
            当前章节暂无内容，请在左侧添加场景或导入文件
          </div>
        )}

        {/* Right Sidebar Toggle */}
        <button 
          onClick={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
          className="absolute top-1/2 -translate-y-1/2 z-30 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full p-1 shadow-lg hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 text-gray-600 dark:text-gray-300 transition-all"
          style={{ right: rightSidebarCollapsed ? '12px' : '276px' }}
          title={rightSidebarCollapsed ? "展开属性面板" : "收起属性面板"}
        >
          {rightSidebarCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        <div className={`transition-all duration-300 ease-in-out overflow-hidden flex shrink-0 ${rightSidebarCollapsed ? 'w-0' : 'w-72'}`}>
          <PropertyPanel 
            activeBlock={activeBlock} 
            activePage={activePage}
            onUpdateBlock={(updates) => activePage && activeBlock && updateBlock(activePage.id, activeBlock.id, updates)}
            onUpdatePage={(updates) => {
              if (activePage) {
                setCourseware(prev => ({
                  ...prev,
                  pages: prev.pages.map(p => p.id === activePage.id ? { ...p, ...updates } : p)
                }));
              }
            }}
          />
        </div>
      </main>
    </div>
  );
}

