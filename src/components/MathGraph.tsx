import React, { useEffect, useRef } from 'react';
import * as math from 'mathjs';

interface MathGraphProps {
  equation: string;
  showGrid: boolean;
  showLabels: boolean;
  variables: Record<string, { value: number }>;
  width: number;
  height: number;
}

export default function MathGraph({ equation, showGrid, showLabels, variables, width, height }: MathGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    const padding = 20;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;
    const centerX = width / 2;
    const centerY = height / 2;

    // Scale: pixels per unit
    const scale = Math.min(graphWidth, graphHeight) / 20; // 20 units across

    // Draw Grid
    if (showGrid) {
      ctx.strokeStyle = document.documentElement.classList.contains('dark') ? '#334155' : '#e2e8f0';
      ctx.lineWidth = 1;

      // Vertical lines
      for (let x = -10; x <= 10; x++) {
        const px = centerX + x * scale;
        ctx.beginPath();
        ctx.moveTo(px, padding);
        ctx.lineTo(px, height - padding);
        ctx.stroke();
      }

      // Horizontal lines
      for (let y = -10; y <= 10; y++) {
        const py = centerY - y * scale;
        ctx.beginPath();
        ctx.moveTo(padding, py);
        ctx.lineTo(width - padding, py);
        ctx.stroke();
      }
    }

    // Draw Axes
    ctx.strokeStyle = document.documentElement.classList.contains('dark') ? '#64748b' : '#94a3b8';
    ctx.lineWidth = 2;
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(padding, centerY);
    ctx.lineTo(width - padding, centerY);
    ctx.stroke();

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(centerX, padding);
    ctx.lineTo(centerX, height - padding);
    ctx.stroke();

    // Draw Labels
    if (showLabels) {
      ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      
      // X labels
      for (let x = -10; x <= 10; x += 5) {
        if (x === 0) continue;
        ctx.fillText(x.toString(), centerX + x * scale, centerY + 5);
      }

      // Y labels
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      for (let y = -10; y <= 10; y += 5) {
        if (y === 0) continue;
        ctx.fillText(y.toString(), centerX - 5, centerY - y * scale);
      }
    }

    // Draw Function
    try {
      // Parse equation: y = ... or just the expression
      let expr = equation.trim()
        .replace(/²/g, '^2')
        .replace(/³/g, '^3')
        .replace(/·/g, '*')
        .replace(/÷/g, '/')
        .replace(/^y\s*=\s*/, '');

      if (!expr) return;

      const compiled = math.compile(expr);
      
      // Build scope with variables
      const scope: Record<string, number> = {};
      Object.entries(variables).forEach(([name, config]) => {
        scope[name] = config.value;
      });

      ctx.strokeStyle = document.documentElement.classList.contains('dark') ? '#3b82f6' : '#2563eb';
      ctx.lineWidth = 2;
      ctx.beginPath();

      let first = true;
      for (let px = padding; px <= width - padding; px += 1) {
        const x = (px - centerX) / scale;
        try {
          const y = compiled.evaluate({ ...scope, x });
          const py = centerY - y * scale;

          if (py >= padding && py <= height - padding) {
            if (first) {
              ctx.moveTo(px, py);
              first = false;
            } else {
              ctx.lineTo(px, py);
            }
          } else {
            first = true;
          }
        } catch (e) {
          first = true;
        }
      }
      ctx.stroke();
    } catch (e) {
      // Draw error message
      ctx.fillStyle = '#ef4444';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('无效的方程式', centerX, centerY);
    }

  }, [equation, showGrid, showLabels, variables, width, height]);

  return (
    <canvas 
      ref={canvasRef} 
      width={width} 
      height={height} 
      className="w-full h-full"
    />
  );
}
