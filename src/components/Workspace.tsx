import React, { useRef, useState, useEffect } from 'react';
import { Settings2, Trash2, Activity, Type, Image as ImageIcon, Video, Shapes, BookOpenCheck, PawPrint, Sparkles, Send, Loader2, Play, Triangle, Code, Lock, Unlock } from 'lucide-react';
import { generateBlockFromPrompt } from '../services/geminiService';
import { Page, Block, BlockType, BlockEvent } from '../types';
import MathGraph from './MathGraph';
import InteractiveWrapper from './InteractiveWrapper';
import BlockRenderer from './BlockRenderer';

interface WorkspaceProps {
  page: Page;
  activeBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
  onUpdateBlock: (id: string, updates: Partial<Block>) => void;
  onAddBlock: (blockData: Partial<Block> & { type: BlockType }) => void;
  onDeleteBlock: (id: string) => void;
}

export default function Workspace({ page, activeBlockId, onSelectBlock, onUpdateBlock, onAddBlock, onDeleteBlock }: WorkspaceProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaTypeRef = useRef<BlockType>('image');
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<{ id: string; startX: number; startY: number; blockX: number; blockY: number } | null>(null);

  // Copilot States
  const [isDrawing, setIsDrawing] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [promptValue, setPromptValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  const handleMediaUpload = (type: BlockType) => {
    mediaTypeRef.current = type;
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onAddBlock({ type: mediaTypeRef.current, content: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('.block-item')) return;

    onSelectBlock(null);
    setShowPrompt(false);
    setSelectionBox(null);

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setSelectionStart({ x, y });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !selectionStart) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const x = Math.min(selectionStart.x, currentX);
    const y = Math.min(selectionStart.y, currentY);
    const w = Math.abs(selectionStart.x - currentX);
    const h = Math.abs(selectionStart.y - currentY);

    setSelectionBox({ x, y, w, h });
  };

  const handleCanvasMouseUp = () => {
    if (isDrawing && selectionBox && selectionBox.w > 10 && selectionBox.h > 10) {
      setShowPrompt(true);
    } else {
      setSelectionBox(null);
    }
    setIsDrawing(false);
    setSelectionStart(null);
  };

  const handleGenerate = async () => {
    if (!promptValue.trim() || !selectionBox) return;

    setIsGenerating(true);
    
    try {
      const generatedBlock = await generateBlockFromPrompt(promptValue, selectionBox);
      
      onAddBlock({
        type: generatedBlock.type,
        content: generatedBlock.content,
        x: selectionBox.x,
        y: selectionBox.y,
        width: selectionBox.w,
        height: selectionBox.h,
        mathConfig: generatedBlock.mathConfig,
        style: generatedBlock.style,
        action: generatedBlock.action,
        state: generatedBlock.state,
        events: generatedBlock.events,
        label: generatedBlock.label,
        src: generatedBlock.src
      });
    } catch (error) {
      console.error("Failed to generate block:", error);
      alert("生成失败，请重试");
    } finally {
      setIsGenerating(false);
      setShowPrompt(false);
      setSelectionBox(null);
      setPromptValue('');
    }
  };

  const handleDispatch = (events?: BlockEvent[]) => {
    if (!events) return;
    events.forEach(event => {
      const targetBlock = page.blocks.find(b => b.id === event.targetId);
      if (targetBlock) {
        if (event.action === 'PLAY') {
          onUpdateBlock(targetBlock.id, { state: { ...targetBlock.state, isPlaying: true } });
        } else if (event.action === 'PAUSE') {
          onUpdateBlock(targetBlock.id, { state: { ...targetBlock.state, isPlaying: false } });
        } else if (event.action === 'TOGGLE_VISIBILITY') {
          onUpdateBlock(targetBlock.id, { hidden: !targetBlock.hidden });
        }
      }
    });
  };

  const handleBlockMouseDown = (e: React.MouseEvent, block: Block) => {
    if (e.button !== 0) return; // Only left click
    e.stopPropagation();
    onSelectBlock(block.id);
    setDragState({
      id: block.id,
      startX: e.clientX,
      startY: e.clientY,
      blockX: block.x,
      blockY: block.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState) return;
      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;
      onUpdateBlock(dragState.id, {
        x: Math.max(0, dragState.blockX + dx),
        y: Math.max(0, dragState.blockY + dy)
      });
    };

    const handleMouseUp = () => {
      setDragState(null);
    };

    if (dragState) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, onUpdateBlock]);

  const handleWheel = (e: React.WheelEvent, block: Block) => {
    if (block.id !== activeBlockId) return;
    // Don't resize if we are scrolling inside the block (e.g. text)
    if ((e.target as HTMLElement).closest('.no-resize-scroll')) return;
    
    e.preventDefault();
    const scaleFactor = e.deltaY > 0 ? 0.95 : 1.05;
    onUpdateBlock(block.id, {
      width: Math.max(50, block.width * scaleFactor),
      height: Math.max(50, block.height * scaleFactor)
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'text/html' || file.type === 'text/plain' || file.name.endsWith('.html') || file.name.endsWith('.txt'))) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const rect = containerRef.current?.getBoundingClientRect();
        const x = rect ? e.clientX - rect.left : 100;
        const y = rect ? e.clientY - rect.top : 100;
        onAddBlock({ 
          type: 'dynamic_html', 
          x, 
          y, 
          width: 400, 
          height: 300, 
          htmlContent: content 
        });
      };
      reader.readAsText(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <section 
      className="flex-1 bg-white dark:bg-slate-900 relative flex flex-col overflow-auto transition-colors duration-300"
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div 
        ref={containerRef}
        className="canvas-container flex-1 relative math-grid overflow-hidden math-dot-grid" 
        style={{ backgroundColor: page.backgroundColor || 'transparent' }}
      >

        {/* Render Blocks */}
        {page.blocks.map(block => {
          if (block.hidden) return null;
          const isActive = block.id === activeBlockId;
          return (
            <InteractiveWrapper
              key={block.id}
              block={block}
              isActive={isActive}
              onSelect={() => onSelectBlock(block.id)}
              onUpdate={(updates) => onUpdateBlock(block.id, updates)}
            >
              <BlockRenderer 
                block={block} 
                onUpdateBlock={onUpdateBlock} 
                isActive={isActive} 
                onDispatch={handleDispatch}
              />
              
              {isActive && (
                <div className="absolute top-2 right-2 flex gap-1 bg-white/80 backdrop-blur p-1 rounded shadow-sm z-50">
                  <button 
                    className={`p-1 hover:bg-gray-100 rounded ${block.locked ? 'text-blue-500' : 'text-gray-400'}`}
                    onClick={(e) => { e.stopPropagation(); onUpdateBlock(block.id, { locked: !block.locked }); }}
                    title={block.locked ? "解锁" : "锁定"}
                  >
                    {block.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  </button>
                  <button className="p-1 hover:bg-gray-100 rounded text-gray-400">
                    <Settings2 className="w-3 h-3" />
                  </button>
                  <button 
                    className="p-1 hover:bg-gray-100 rounded text-gray-400"
                    onClick={(e) => { e.stopPropagation(); onDeleteBlock(block.id); }}
                  >
                    <Trash2 className="w-3 h-3 text-red-400" />
                  </button>
                </div>
              )}
            </InteractiveWrapper>
          );
        })}

        {/* Marquee Selection Box */}
        {selectionBox && (
          <div 
            className={`absolute border-dashed border-2 border-blue-500 bg-blue-500/10 pointer-events-none z-20 ${isGenerating ? 'animate-pulse' : ''}`}
            style={{
              left: selectionBox.x,
              top: selectionBox.y,
              width: selectionBox.w,
              height: selectionBox.h,
            }}
          >
            {isGenerating && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-sm">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            )}
          </div>
        )}

        {/* Floating Copilot Bar */}
        {showPrompt && selectionBox && !isGenerating && (
          <div 
            className="absolute z-40 animate-in fade-in slide-in-from-top-2 duration-300"
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            style={{
              left: selectionBox.x,
              top: selectionBox.y + selectionBox.h + 16,
              width: Math.max(selectionBox.w, 400),
            }}
          >
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/40 dark:border-slate-700/40 shadow-2xl rounded-2xl p-2 flex items-center gap-2 ring-1 ring-black/5 dark:ring-white/5">
              <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-200 dark:shadow-blue-900/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <input 
                autoFocus
                type="text"
                placeholder="让 AI 在这里生成组件 (如：数学函数图、题目卡片)..."
                className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-gray-800 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 px-2"
                value={promptValue}
                onChange={(e) => setPromptValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleGenerate();
                  if (e.key === 'Escape') {
                    setShowPrompt(false);
                    setSelectionBox(null);
                  }
                }}
              />
              <button 
                onClick={handleGenerate}
                disabled={!promptValue.trim()}
                className={`p-2 rounded-xl transition-all ${
                  promptValue.trim() 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/20 hover:scale-105 active:scale-95' 
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-gray-500'
                }`}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {['数学函数图', '题目卡片', '互动神兽', '3D 模型'].map(suggestion => (
                <button 
                  key={suggestion}
                  onClick={() => setPromptValue(suggestion)}
                  className="px-3 py-1 bg-white/50 dark:bg-slate-800/50 backdrop-blur border border-white/40 dark:border-slate-700/40 rounded-full text-[10px] font-bold text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 transition-all whitespace-nowrap"
                >
                  + {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Global State Monitor Trigger */}
        {page.globalStateMonitor && (
          <div className="absolute bottom-4 right-4 group">
            <div className="bg-white dark:bg-slate-800 p-3 rounded-full shadow-xl cursor-pointer hover:scale-110 transition-transform relative border-2 border-blue-500 flex items-center justify-center">
              <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full flex items-center justify-center text-[8px] text-white font-bold">运行中</div>
            </div>
            <div className="absolute bottom-full right-0 mb-3 bg-gray-900 dark:bg-slate-700 text-white px-4 py-2 rounded-lg shadow-2xl text-[11px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity flex flex-col gap-1">
              <span className="text-blue-400 font-bold">全局状态监控</span>
              <span>{page.globalStateMonitor.condition}，{page.globalStateMonitor.action}</span>
              <div className="w-full bg-white/20 dark:bg-white/10 h-1 rounded-full mt-1">
                <div className="bg-green-400 h-full rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Dock */}
      <div 
        className="fixed bottom-8 left-1/2 -translate-x-1/2 glass-dock rounded-2xl px-3 py-2 flex items-center gap-1"
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={(e) => { e.stopPropagation(); onAddBlock({ type: 'text' }); }}
          className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-white/50 dark:hover:bg-slate-700/50 text-gray-700 dark:text-gray-300 transition-all hover:-translate-y-1" 
          title="文本"
        >
          <Type className="w-6 h-6" />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); handleMediaUpload('image'); }}
          className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-white/50 dark:hover:bg-slate-700/50 text-gray-700 dark:text-gray-300 transition-all hover:-translate-y-1" 
          title="图片"
        >
          <ImageIcon className="w-6 h-6" />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); handleMediaUpload('video'); }}
          className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-white/50 dark:hover:bg-slate-700/50 text-gray-700 dark:text-gray-300 transition-all hover:-translate-y-1" 
          title="视频"
        >
          <Video className="w-6 h-6" />
        </button>
        <div className="h-8 w-px bg-gray-400/20 dark:bg-slate-600/50 mx-1"></div>
        <button 
          onClick={(e) => { e.stopPropagation(); onAddBlock({ type: 'math-graph' }); }}
          className="w-12 h-12 flex items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/20 transition-all hover:-translate-y-1" 
          title="几何/函数工具"
        >
          <Shapes className="w-6 h-6" />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onAddBlock({ type: 'quiz' }); }}
          className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-white/50 dark:hover:bg-slate-700/50 text-gray-700 dark:text-gray-300 transition-all hover:-translate-y-1" 
          title="题库检索"
        >
          <BookOpenCheck className="w-6 h-6" />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onAddBlock({ type: 'interaction' }); }}
          className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/30 text-purple-600 dark:text-purple-400 transition-all hover:-translate-y-1" 
          title="插入高能互动 (机甲/神兽特效)"
        >
          <PawPrint className="w-6 h-6" />
        </button>
        <div className="h-8 w-px bg-gray-400/20 dark:bg-slate-600/50 mx-1"></div>
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            onAddBlock({ 
              type: 'right_triangle', 
              x: 150, 
              y: 150, 
              width: 100, 
              height: 100, 
              style: { backgroundColor: '#3b82f6' } 
            }); 
          }}
          className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-all hover:-translate-y-1" 
          title="添加直角三角形"
        >
          <Triangle className="w-6 h-6" />
        </button>
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            onAddBlock({ 
              type: 'dynamic_html', 
              width: 400,
              height: 300,
              htmlContent: '<div style="padding:20px; background:#f3f4f6; border-radius:8px; text-align:center; color:#666;">Empty Interactive Widget<br/>Paste HTML/Iframe in properties</div>'
            }); 
          }}
          className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-orange-50 dark:hover:bg-orange-900/30 text-orange-600 dark:text-orange-400 transition-all hover:-translate-y-1" 
          title="添加交互式小部件"
        >
          <Code className="w-6 h-6" />
        </button>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept={mediaTypeRef.current === 'image' ? 'image/*' : 'video/*'}
        onChange={handleFileChange}
      />
    </section>
  );
}
