import React, { useRef, useEffect } from 'react';
import { Block, BlockEvent } from '../types';
import MathGraph from './MathGraph';

interface BlockRendererProps {
  block: Block;
  onUpdateBlock: (id: string, updates: Partial<Block>) => void;
  isActive?: boolean;
  onDispatch?: (events?: BlockEvent[] | BlockEvent) => void;
}

export default function BlockRenderer({ block, onUpdateBlock, isActive, onDispatch }: BlockRendererProps) {
  const { type, content, style, mathConfig, htmlContent, state, events, src, label, props } = block;
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (type === 'video' && videoRef.current) {
      if (state?.isPlaying) {
        videoRef.current.play().catch(e => console.error("Play failed", e));
      } else {
        videoRef.current.pause();
      }
    }
  }, [state?.isPlaying, type]);

  switch (type) {
    case 'dynamic_html':
      return (
        <div className="w-full h-full relative overflow-hidden rounded-lg">
          <div 
            className="w-full h-full"
            dangerouslySetInnerHTML={{ 
              __html: props?.htmlContent || htmlContent || '<div style="padding:20px; background:#f3f4f6; border-radius:8px; text-align:center; color:#6b7280;">空白交互组件<br/>请在属性面板中粘贴 HTML 或 Iframe 代码</div>' 
            }}
            style={{ pointerEvents: (isActive || block.locked) ? 'auto' : 'none' }}
          />
          {!isActive && !block.locked && (
            <div className="absolute inset-0 bg-transparent z-10 cursor-move" />
          )}
        </div>
      );
    case 'iframe_sandbox':
      return (
        <div className="w-full h-full relative overflow-hidden rounded-lg bg-white border border-gray-200">
          <iframe 
            src={props?.url || src || "https://example.com"} 
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin"
            style={{ pointerEvents: (isActive || block.locked || props?.allowInteraction) ? 'auto' : 'none' }}
          />
          {!isActive && !block.locked && !props?.allowInteraction && (
            <div className="absolute inset-0 bg-transparent z-10 cursor-move" />
          )}
        </div>
      );
    case 'text':
      return (
        <div 
          className="w-full h-full p-2 outline-none no-resize-scroll overflow-auto text-gray-900 dark:text-gray-100"
          style={{
            ...style,
            fontSize: props?.fontSize || style?.fontSize,
            color: props?.color || style?.color,
          }}
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => {
            if (props && 'content' in props) {
              onUpdateBlock(block.id, { props: { ...props, content: e.currentTarget.textContent || '' } });
            } else {
              onUpdateBlock(block.id, { content: e.currentTarget.textContent || '' });
            }
          }}
        >
          {props?.content || content}
        </div>
      );
    
    case 'action_button':
      return (
        <button 
          className="w-full h-full flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-sm hover:shadow-md"
          style={{
            backgroundColor: style?.backgroundColor || '#4F46E5',
            color: style?.color || '#FFFFFF',
            borderRadius: style?.borderRadius || '8px',
            fontSize: style?.fontSize || '16px',
            fontWeight: style?.fontWeight || '600',
            ...style
          }}
          onClick={(e) => {
            e.stopPropagation();
            const eventData = events?.onClick || (Array.isArray(events) ? events : ((events as any)?.targetId || (events as any)?.targetName || (events as any)?.target ? events : undefined));
            console.log('Action Button clicked:', eventData);
            onDispatch?.(eventData as any);
          }}
        >
          {label || content || '操作按钮'}
        </button>
      );

    case 'interactive_button':
      return (
        <button 
          className="w-full h-full flex items-center justify-center cursor-pointer transition-transform active:scale-95"
          style={{
            backgroundColor: style?.backgroundColor || '#4F46E5',
            color: style?.color || '#FFFFFF',
            borderRadius: style?.borderRadius || '8px',
            fontSize: style?.fontSize || '16px',
            fontWeight: style?.fontWeight || 'normal',
            ...style
          }}
          onClick={(e) => {
            e.stopPropagation();
            const eventData = events?.onClick || (Array.isArray(events) ? events : ((events as any)?.targetId || (events as any)?.targetName || (events as any)?.target ? events : undefined));
            console.log('Interactive Button clicked:', eventData);
            onDispatch?.(eventData as any);
          }}
        >
          {content || '按钮'}
        </button>
      );

    case 'image':
      return (
        <div className="w-full h-full relative" style={{ borderRadius: style?.borderRadius || '0px', overflow: 'hidden' }}>
          {content ? (
            <img 
              src={content} 
              alt="Block Content" 
              className="w-full h-full object-contain pointer-events-none" 
              draggable={false}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-400 dark:text-gray-500">
              <span>图片占位符</span>
            </div>
          )}
        </div>
      );

    case 'video':
      return (
        <div className="w-full h-full bg-black/5 dark:bg-black/20 flex items-center justify-center rounded overflow-hidden relative">
          <video 
            ref={videoRef}
            src={src || content} 
            className="w-full h-full object-cover pointer-events-none" 
            controls={false}
            loop
            muted
            playsInline
          />
          {!src && !content && (
            <span className="text-gray-400 dark:text-gray-500 absolute">视频播放器</span>
          )}
        </div>
      );

    case 'math-graph':
      return (
        <div className="w-full h-full p-2">
          <MathGraph 
            equation={mathConfig?.equation || ''}
            showGrid={mathConfig?.showGrid ?? true}
            showLabels={mathConfig?.showLabels ?? true}
            variables={mathConfig?.variables || {}}
            width={block.width - 16}
            height={block.height - 16}
          />
        </div>
      );

    case 'quiz':
      return (
        <div className="w-full h-full p-4 bg-white dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-700 flex flex-col transition-colors">
          <h3 className="font-medium mb-4 text-gray-800 dark:text-gray-200">单选题</h3>
          <div className="space-y-2 flex-1">
            {['A. 选项 1', 'B. 选项 2', 'C. 选项 3', 'D. 选项 4'].map((opt, i) => (
              <div key={i} className="p-2 rounded border border-gray-100 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer flex items-center gap-2 transition-colors">
                <div className="w-4 h-4 rounded-full border border-gray-300 dark:border-slate-500"></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">{opt}</span>
              </div>
            ))}
          </div>
        </div>
      );

    case 'interaction':
      return (
        <div className="w-full h-full bg-blue-50/80 dark:bg-blue-900/30 backdrop-blur-sm border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex flex-col items-center justify-center shadow-sm transition-colors">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800/50 rounded-full flex items-center justify-center mb-3 text-blue-600 dark:text-blue-400">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </div>
          <span className="text-blue-800 dark:text-blue-300 font-medium text-center">{content}</span>
          <span className="text-blue-500 dark:text-blue-400 text-xs mt-1">点击播放互动</span>
        </div>
      );

    case 'right_triangle':
      return (
        <div className="w-full h-full">
          <svg 
            width="100%" 
            height="100%" 
            viewBox={`0 0 ${block.width} ${block.height}`} 
            preserveAspectRatio="none"
          >
            <polygon 
              points={`0,0 0,${block.height} ${block.width},${block.height}`} 
              fill={style?.backgroundColor || '#3b82f6'} 
            />
          </svg>
        </div>
      );

    default:
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400">
          未知组件类型
        </div>
      );
  }
}
