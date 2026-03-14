import React, { useState, useEffect, useRef } from 'react';
import { Block } from '../types';

interface InteractiveWrapperProps {
  key?: string | number;
  block: Block;
  isActive: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<Block>) => void;
  children: React.ReactNode;
}

export default function InteractiveWrapper({ block, isActive, onSelect, onUpdate, children }: InteractiveWrapperProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null); // 'tl', 'tr', 'bl', 'br'
  const startPos = useRef({ x: 0, y: 0, bx: 0, by: 0, bw: 0, bh: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const dx = e.clientX - startPos.current.x;
        const dy = e.clientY - startPos.current.y;
        onUpdate({
          x: Math.max(0, startPos.current.bx + dx),
          y: Math.max(0, startPos.current.by + dy)
        });
      } else if (isResizing) {
        const dx = e.clientX - startPos.current.x;
        const dy = e.clientY - startPos.current.y;
        
        let newX = startPos.current.bx;
        let newY = startPos.current.by;
        let newW = startPos.current.bw;
        let newH = startPos.current.bh;

        if (isResizing.includes('r')) newW = Math.max(50, startPos.current.bw + dx);
        if (isResizing.includes('l')) {
          const possibleW = startPos.current.bw - dx;
          if (possibleW >= 50) {
            newW = possibleW;
            newX = startPos.current.bx + dx;
          }
        }
        if (isResizing.includes('b')) newH = Math.max(50, startPos.current.bh + dy);
        if (isResizing.includes('t')) {
          const possibleH = startPos.current.bh - dy;
          if (possibleH >= 50) {
            newH = possibleH;
            newY = startPos.current.by + dy;
          }
        }

        onUpdate({ x: newX, y: newY, width: newW, height: newH });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(null);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, onUpdate]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    
    const target = e.target as HTMLElement;
    const isHandle = target.closest('.cursor-move') || target.classList.contains('cursor-move');
    
    // If locked, we still want to stop propagation to the canvas 
    // to prevent selection/marquee, but we don't want to start a drag.
    if (block.locked) {
      // If it's a dynamic_html, we let the event pass to children if they are interactive
      // but we MUST stop it from reaching the canvas.
      e.stopPropagation();
      return;
    }
    
    // If it's a dynamic_html block and it's already active, 
    // only allow dragging if clicking the specific drag handle
    if (block.type === 'dynamic_html' && isActive && !isHandle) {
      // Allow the event to pass through to the iframe/content
      return;
    }

    e.stopPropagation();
    onSelect();
    
    // Don't start drag if clicking on interactive elements inside
    if (target.closest('button, input, textarea, [contenteditable="true"]')) {
      return;
    }

    startPos.current = {
      x: e.clientX,
      y: e.clientY,
      bx: block.x,
      by: block.y,
      bw: block.width,
      bh: block.height
    };
    setIsDragging(true);
  };

  const handleResizeStart = (e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    onSelect();
    startPos.current = {
      x: e.clientX,
      y: e.clientY,
      bx: block.x,
      by: block.y,
      bw: block.width,
      bh: block.height
    };
    setIsResizing(handle);
  };

  return (
    <div 
      className={`absolute border-2 bg-transparent shadow-sm rounded overflow-visible block-item ${
        isActive ? 'border-blue-500 ring-4 ring-blue-500/10 dark:ring-blue-500/20 z-10' : 
        (block.locked ? 'border-transparent z-0' : 'border-transparent hover:border-gray-300 dark:hover:border-slate-600 z-0')
      } ${isActive ? 'cursor-default' : (block.locked ? 'cursor-default' : 'cursor-move')}`}
      style={{
        left: block.x,
        top: block.y,
        width: block.width,
        height: block.height,
        pointerEvents: 'auto'
      }}
      onMouseDown={handleMouseDown}
    >
      {isActive && (
        <>
          {/* Drag Handle for interactive blocks */}
          {block.type === 'dynamic_html' && (
            <div className="absolute -top-8 left-0 right-0 h-8 bg-blue-500 text-white text-[10px] flex items-center px-2 rounded-t-lg cursor-move select-none animate-in slide-in-from-bottom-2">
              <span className="flex-1 font-bold">可拖拽区域 (交互组件已激活)</span>
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-white/50 rounded-full" />
                <div className="w-1 h-1 bg-white/50 rounded-full" />
                <div className="w-1 h-1 bg-white/50 rounded-full" />
              </div>
            </div>
          )}
          <div className="absolute w-3 h-3 bg-white dark:bg-slate-800 border-2 border-blue-500 rounded-full -top-1.5 -left-1.5 cursor-nwse-resize z-20" onMouseDown={(e) => handleResizeStart(e, 'tl')} />
          <div className="absolute w-3 h-3 bg-white dark:bg-slate-800 border-2 border-blue-500 rounded-full -top-1.5 -right-1.5 cursor-nesw-resize z-20" onMouseDown={(e) => handleResizeStart(e, 'tr')} />
          <div className="absolute w-3 h-3 bg-white dark:bg-slate-800 border-2 border-blue-500 rounded-full -bottom-1.5 -left-1.5 cursor-nesw-resize z-20" onMouseDown={(e) => handleResizeStart(e, 'bl')} />
          <div className="absolute w-3 h-3 bg-white dark:bg-slate-800 border-2 border-blue-500 rounded-full -bottom-1.5 -right-1.5 cursor-nwse-resize z-20" onMouseDown={(e) => handleResizeStart(e, 'br')} />
        </>
      )}
      
      <div className="w-full h-full relative overflow-hidden rounded" style={{ pointerEvents: 'auto' }}>
        {children}
      </div>
    </div>
  );
}
