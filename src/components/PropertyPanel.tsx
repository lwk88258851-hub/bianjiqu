import React, { useState } from 'react';
import { ChevronDown, PlusCircle, Zap, X, Sparkles, Loader2, Lock, Unlock, Copy, Check, Wand2 } from 'lucide-react';
import { Block, Page, BlockEvent } from '../types';
import { refineCode, generateEventFromPrompt } from '../services/geminiService';

interface PropertyPanelProps {
  activeBlock: Block | null;
  activePage: Page | null;
  onUpdateBlock: (updates: Partial<Block>) => void;
  onUpdatePage: (updates: Partial<Page>) => void;
}

export default function PropertyPanel({ activeBlock, activePage, onUpdateBlock, onUpdatePage }: PropertyPanelProps) {
  const [refineInstruction, setRefineInstruction] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [eventsJson, setEventsJson] = useState('');
  const [copied, setCopied] = useState(false);
  const [aiEventPrompt, setAiEventPrompt] = useState('');
  const [isGeneratingEvent, setIsGeneratingEvent] = useState(false);
  const [showAiEventInput, setShowAiEventInput] = useState(false);
  const [eventAiPrompts, setEventAiPrompts] = useState<Record<number, string>>({});

  React.useEffect(() => {
    if (activeBlock) {
      setEventsJson(activeBlock.events ? JSON.stringify(activeBlock.events, null, 2) : '');
    }
  }, [activeBlock?.id, activeBlock?.events]);

  const handleGenerateAiEvent = async () => {
    if (!activeBlock || !activePage || !aiEventPrompt.trim()) return;
    setIsGeneratingEvent(true);
    try {
      const newEvents = await generateEventFromPrompt(aiEventPrompt, activeBlock, activePage.blocks);
      const currentEvents = activeBlock.events || {};
      const onClick = Array.isArray(currentEvents.onClick) ? currentEvents.onClick : (currentEvents.onClick ? [currentEvents.onClick] : []);
      
      onUpdateBlock({ 
        events: { 
          ...currentEvents, 
          onClick: [...onClick, ...newEvents] 
        } 
      });
      setAiEventPrompt('');
      setShowAiEventInput(false);
    } catch (error) {
      console.error("Failed to generate AI event:", error);
    } finally {
      setIsGeneratingEvent(false);
    }
  };

  const handleCopyName = () => {
    if (activeBlock?.name) {
      navigator.clipboard.writeText(activeBlock.name);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRefine = async () => {
    if (!activeBlock || !refineInstruction.trim() || activeBlock.type !== 'dynamic_html') return;
    setIsRefining(true);
    try {
      const newCode = await refineCode(activeBlock.htmlContent || '', refineInstruction);
      onUpdateBlock({ htmlContent: newCode });
      setRefineInstruction('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefining(false);
    }
  };

  if (!activeBlock) {
    return (
      <aside className="w-72 border-l bg-white dark:bg-slate-800 dark:border-slate-700 flex flex-col overflow-y-auto transition-colors duration-300">
        <div className="p-4 border-b dark:border-slate-700">
          <h2 className="font-bold text-sm text-gray-800 dark:text-gray-200">页面设置</h2>
        </div>
        
        {activePage && (
          <section className="p-4 border-b dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">外观</h3>
              <ChevronDown className="w-3 h-3 text-gray-400 dark:text-gray-500" />
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-1">背景颜色</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                    value={activePage.backgroundColor || '#ffffff'}
                    onChange={(e) => onUpdatePage({ backgroundColor: e.target.value })}
                  />
                  <input 
                    type="text" 
                    className="flex-1 text-xs border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border rounded focus:ring-blue-500 p-2 font-mono"
                    value={activePage.backgroundColor || '#ffffff'}
                    onChange={(e) => onUpdatePage({ backgroundColor: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </section>
        )}
      </aside>
    );
  }

  const handlePropChange = (key: string, value: any) => {
    if (!activeBlock) return;
    onUpdateBlock({
      props: {
        ...(activeBlock.props || {}),
        [key]: value
      }
    });
  };

  const renderDynamicProps = () => {
    if (!activeBlock || !activeBlock.props) return null;
    
    return Object.entries(activeBlock.props).map(([key, value]) => {
      if (typeof value === 'boolean') {
        return (
          <div key={key} className="flex items-center justify-between">
            <label className="text-sm text-gray-600 dark:text-gray-400">{key}</label>
            <input 
              type="checkbox" 
              checked={value}
              onChange={(e) => handlePropChange(key, e.target.checked)}
              className="rounded border-gray-300"
            />
          </div>
        );
      }
      
      if (typeof value === 'string' && value.startsWith('#')) {
        return (
          <div key={key} className="space-y-1">
            <label className="text-sm text-gray-600 dark:text-gray-400">{key}</label>
            <div className="flex gap-2">
              <input 
                type="color" 
                value={value}
                onChange={(e) => handlePropChange(key, e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border-0 p-0"
              />
              <input 
                type="text" 
                value={value}
                onChange={(e) => handlePropChange(key, e.target.value)}
                className="flex-1 text-xs border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border rounded focus:ring-blue-500 p-2 font-mono"
              />
            </div>
          </div>
        );
      }

      if (typeof value === 'string' && (value.includes('<') || value.length > 50)) {
        return (
          <div key={key} className="space-y-1">
            <label className="text-sm text-gray-600 dark:text-gray-400">{key}</label>
            <textarea 
              value={value}
              onChange={(e) => handlePropChange(key, e.target.value)}
              className="w-full text-xs border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border rounded focus:ring-blue-500 p-2 min-h-[100px] font-mono"
            />
          </div>
        );
      }

      return (
        <div key={key} className="space-y-1">
          <label className="text-sm text-gray-600 dark:text-gray-400">{key}</label>
          <input 
            type={typeof value === 'number' ? 'number' : 'text'} 
            value={value}
            onChange={(e) => handlePropChange(key, typeof value === 'number' ? Number(e.target.value) : e.target.value)}
            className="w-full text-xs border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border rounded focus:ring-blue-500 p-2"
          />
        </div>
      );
    });
  };

  return (
    <aside className="w-72 border-l bg-white dark:bg-slate-800 dark:border-slate-700 flex flex-col overflow-y-auto transition-colors duration-300">
      <div className="p-4 border-b dark:border-slate-700 flex items-center justify-between">
        <h2 className="font-bold text-sm text-gray-800 dark:text-gray-200">
          属性 - {activeBlock.type}
        </h2>
        <button 
          onClick={() => onUpdateBlock({ locked: !activeBlock.locked })}
          className={`p-1.5 rounded-lg transition-colors ${activeBlock.locked ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-400 dark:bg-slate-700 dark:text-gray-500'}`}
          title={activeBlock.locked ? "锁定中 - 点击解锁" : "未锁定 - 点击锁定"}
        >
          {activeBlock.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
        </button>
      </div>

      <section className="p-4 border-b dark:border-slate-700">
        <div className="mb-2">
          <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-1">组件名称 (用于AI识别)</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={activeBlock.name || ''} 
              onChange={(e) => onUpdateBlock({ name: e.target.value })}
              placeholder="例如：图片 1"
              className="flex-1 text-xs border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border rounded p-2"
            />
            <button 
              onClick={handleCopyName}
              className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors bg-gray-50 dark:bg-slate-700 rounded border border-gray-200 dark:border-slate-600"
              title="复制名称"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className="text-[9px] text-gray-400 mt-1">
            在其他组件的事件绑定中使用此名称作为 targetId。
          </p>
        </div>
      </section>

      {/* Standard Position Settings */}
      <section className="p-4 border-b dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">布局 (X, Y, W, H)</h3>
          <ChevronDown className="w-3 h-3 text-gray-400 dark:text-gray-500" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-1">X</label>
            <input 
              type="number" 
              value={Math.round(activeBlock.x)} 
              onChange={(e) => onUpdateBlock({ x: Number(e.target.value) })}
              className="w-full text-xs border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border rounded p-2"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-1">Y</label>
            <input 
              type="number" 
              value={Math.round(activeBlock.y)} 
              onChange={(e) => onUpdateBlock({ y: Number(e.target.value) })}
              className="w-full text-xs border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border rounded p-2"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-1">W</label>
            <input 
              type="number" 
              value={Math.round(activeBlock.width)} 
              onChange={(e) => onUpdateBlock({ width: Number(e.target.value) })}
              className="w-full text-xs border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border rounded p-2"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-1">H</label>
            <input 
              type="number" 
              value={Math.round(activeBlock.height)} 
              onChange={(e) => onUpdateBlock({ height: Number(e.target.value) })}
              className="w-full text-xs border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border rounded p-2"
            />
          </div>
        </div>
      </section>

      {/* Visual Event Editor */}
      <section className="p-4 border-b dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">交互事件</h3>
          <div className="flex gap-1">
            <button 
              onClick={() => setShowAiEventInput(!showAiEventInput)}
              className={`p-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                showAiEventInput 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/40' 
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400'
              }`}
              title="AI 智能创作交互"
            >
              <Sparkles className={`w-3.5 h-3.5 ${showAiEventInput ? 'animate-pulse' : ''}`} />
              <span className="text-[10px] font-bold">AI 模式</span>
            </button>
            <button 
              onClick={() => {
                const currentEvents = activeBlock.events || {};
                const onClick = Array.isArray(currentEvents.onClick) ? currentEvents.onClick : (currentEvents.onClick ? [currentEvents.onClick] : []);
                onUpdateBlock({ 
                  events: { 
                    ...currentEvents, 
                    onClick: [...onClick, { targetId: '', action: 'TOGGLE_VISIBILITY' }] 
                  } 
                });
              }}
              className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="手动添加点击事件"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {showAiEventInput && (
          <div className="mb-4 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30 shadow-sm">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3 h-3 text-blue-500" />
              <label className="block text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-tight">AI 交互指令</label>
            </div>
            <div className="flex gap-2">
              <input 
                type="text"
                value={aiEventPrompt}
                onChange={(e) => setAiEventPrompt(e.target.value)}
                placeholder="例如：点击后生成一个红色三角形..."
                className="flex-1 text-[10px] border-blue-200 dark:border-blue-800 bg-white/80 dark:bg-slate-800/80 text-gray-900 dark:text-gray-100 border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                onKeyDown={(e) => e.key === 'Enter' && handleGenerateAiEvent()}
              />
              <button 
                onClick={handleGenerateAiEvent}
                disabled={isGeneratingEvent || !aiEventPrompt.trim()}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md shadow-blue-200 dark:shadow-none"
              >
                {isGeneratingEvent ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}
        
        <div className="space-y-3">
          {(() => {
            const currentEvents = activeBlock.events || {};
            const onClickEvents = Array.isArray(currentEvents.onClick) 
              ? currentEvents.onClick 
              : (currentEvents.onClick ? [currentEvents.onClick] : []);

            if (onClickEvents.length === 0) {
              return <p className="text-[10px] text-gray-400 italic text-center py-2">暂无点击事件</p>;
            }

            return onClickEvents.map((event, idx) => (
              <div key={idx} className="p-3 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-100 dark:border-slate-700 space-y-3 relative group transition-all hover:border-blue-200 dark:hover:border-blue-800">
                <button 
                  onClick={() => {
                    const newOnClick = onClickEvents.filter((_, i) => i !== idx);
                    onUpdateBlock({ events: { ...currentEvents, onClick: newOnClick } });
                  }}
                  className="absolute -top-1.5 -right-1.5 p-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-full text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shadow-sm z-10"
                >
                  <X className="w-3 h-3" />
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] text-gray-400 font-bold uppercase mb-1">目标组件</label>
                    <select 
                      className="w-full text-[10px] border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 border rounded-lg p-1.5 outline-none focus:ring-1 focus:ring-blue-500"
                      value={event.action === 'CREATE' ? 'CREATE_TARGET' : event.targetId}
                      disabled={event.action === 'CREATE'}
                      onChange={(e) => {
                        const newOnClick = [...onClickEvents];
                        newOnClick[idx] = { ...event, targetId: e.target.value };
                        onUpdateBlock({ events: { ...currentEvents, onClick: newOnClick } });
                      }}
                    >
                      <option value="">选择目标...</option>
                      <option value="CREATE_TARGET" disabled={event.action !== 'CREATE'}>[AI 生成组件]</option>
                      {activePage?.blocks
                        .filter(b => b.id !== activeBlock.id)
                        .map(b => (
                          <option key={b.id} value={b.name || b.id}>
                            {b.name || `${b.type} (${b.id.slice(0,4)})`}
                          </option>
                        ))
                      }
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] text-gray-400 font-bold uppercase mb-1">执行动作</label>
                    <select 
                      className="w-full text-[10px] border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 border rounded-lg p-1.5 outline-none focus:ring-1 focus:ring-blue-500"
                      value={event.action}
                      onChange={(e) => {
                        const newOnClick = [...onClickEvents];
                        newOnClick[idx] = { ...event, action: e.target.value };
                        onUpdateBlock({ events: { ...currentEvents, onClick: newOnClick } });
                      }}
                    >
                      <option value="TOGGLE_VISIBILITY">切换显示/隐藏</option>
                      <option value="SHOW">显示</option>
                      <option value="HIDE">隐藏</option>
                      <option value="PLAY">播放 (视频)</option>
                      <option value="PAUSE">暂停 (视频)</option>
                      <option value="CREATE">创建新组件 (AI)</option>
                    </select>
                  </div>
                </div>

                {event.action === 'CREATE' && (
                  <div className="pt-2 border-t border-gray-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[9px] text-blue-500 font-bold uppercase">AI 组件定制描述</label>
                      <Sparkles className="w-3 h-3 text-blue-400" />
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        placeholder="描述要生成的组件..."
                        className="flex-1 text-[10px] border-blue-100 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-900/10 text-gray-900 dark:text-gray-100 border rounded-lg p-1.5 outline-none focus:ring-1 focus:ring-blue-500"
                        value={eventAiPrompts[idx] || ''}
                        onChange={(e) => setEventAiPrompts({ ...eventAiPrompts, [idx]: e.target.value })}
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter') {
                            const prompt = eventAiPrompts[idx];
                            if (!prompt) return;
                            // Trigger AI generation for this specific CREATE action
                            const newEvents = await generateEventFromPrompt(prompt, activeBlock, activePage?.blocks || []);
                            if (newEvents.length > 0 && newEvents[0].action === 'CREATE') {
                              const newOnClick = [...onClickEvents];
                              newOnClick[idx] = { ...newEvents[0] };
                              onUpdateBlock({ events: { ...currentEvents, onClick: newOnClick } });
                            }
                          }
                        }}
                      />
                      <button 
                        className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 transition-colors"
                        title="AI 生成组件配置"
                        onClick={async () => {
                          const prompt = eventAiPrompts[idx];
                          if (!prompt) return;
                          const newEvents = await generateEventFromPrompt(prompt, activeBlock, activePage?.blocks || []);
                          if (newEvents.length > 0 && newEvents[0].action === 'CREATE') {
                            const newOnClick = [...onClickEvents];
                            newOnClick[idx] = { ...newEvents[0] };
                            onUpdateBlock({ events: { ...currentEvents, onClick: newOnClick } });
                          }
                        }}
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ));
          })()}
        </div>
      </section>

      {/* Events Debug View (Collapsed by default) */}
      <section className="p-4 border-b dark:border-slate-700">
        <details>
          <summary className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest cursor-pointer hover:text-gray-600 flex items-center justify-between">
            高级事件设置 (JSON)
            <ChevronDown className="w-3 h-3" />
          </summary>
          <div className="mt-4">
            <textarea 
              className="w-full text-[10px] border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-gray-300 border rounded p-2 min-h-[100px] font-mono focus:ring-blue-500"
              value={eventsJson}
              placeholder='{"onClick": [{"targetId": "...", "action": "TOGGLE_VISIBILITY"}]}'
              onChange={(e) => {
                setEventsJson(e.target.value);
                try {
                  const parsed = e.target.value ? JSON.parse(e.target.value) : undefined;
                  onUpdateBlock({ events: parsed });
                } catch (err) {
                  // Invalid JSON, ignore until valid
                }
              }}
            />
          </div>
        </details>
      </section>

      {/* Dynamic Props Settings */}
      {activeBlock.props && Object.keys(activeBlock.props).length > 0 && (
        <section className="p-4 border-b dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">动态属性 (Props)</h3>
            <ChevronDown className="w-3 h-3 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="space-y-4">
            {renderDynamicProps()}
          </div>
        </section>
      )}

      {/* Math Engine Settings */}
      {activeBlock.type === 'math-graph' && activeBlock.mathConfig && (
        <section className="p-4 border-b dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">数学引擎</h3>
            <ChevronDown className="w-3 h-3 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-1">方程式 (LaTex/简单)</label>
              <input 
                className="w-full text-xs border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 border rounded focus:ring-blue-500 p-2 font-mono" 
                type="text" 
                value={activeBlock.mathConfig.equation}
                onChange={(e) => onUpdateBlock({ 
                  mathConfig: { ...activeBlock.mathConfig!, equation: e.target.value } 
                })}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-700 dark:text-gray-300">显示网格</span>
                <button 
                  className={`w-8 h-4 rounded-full relative ${activeBlock.mathConfig.showGrid ? 'bg-blue-600' : 'bg-gray-200 dark:bg-slate-600'}`}
                  onClick={() => onUpdateBlock({ 
                    mathConfig: { ...activeBlock.mathConfig!, showGrid: !activeBlock.mathConfig!.showGrid } 
                  })}
                >
                  <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${activeBlock.mathConfig.showGrid ? 'right-0.5' : 'left-0.5'}`}></div>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-700 dark:text-gray-300">显示轴标签</span>
                <button 
                  className={`w-8 h-4 rounded-full relative ${activeBlock.mathConfig.showLabels ? 'bg-blue-600' : 'bg-gray-200 dark:bg-slate-600'}`}
                  onClick={() => onUpdateBlock({ 
                    mathConfig: { ...activeBlock.mathConfig!, showLabels: !activeBlock.mathConfig!.showLabels } 
                  })}
                >
                  <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${activeBlock.mathConfig.showLabels ? 'right-0.5' : 'left-0.5'}`}></div>
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
            <h4 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mb-3">交互参数 define区</h4>
            <div className="space-y-4">
              {Object.entries(activeBlock.mathConfig.variables).map(([varName, config]) => (
                <div key={varName} className="bg-gray-50 dark:bg-slate-700/50 p-3 rounded-lg border border-gray-100 dark:border-slate-600">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">变量 {varName}</span>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number"
                        className="w-12 text-[10px] bg-white dark:bg-slate-600 border border-gray-200 dark:border-slate-500 text-gray-900 dark:text-gray-100 rounded px-1 py-0.5 text-center focus:ring-1 focus:ring-blue-500 outline-none"
                        value={config.value}
                        step={config.step}
                        onChange={(e) => {
                          const newValue = Number(e.target.value);
                          onUpdateBlock({
                            mathConfig: {
                              ...activeBlock.mathConfig!,
                              variables: {
                                ...activeBlock.mathConfig!.variables,
                                [varName]: { ...config, value: newValue }
                              }
                            }
                          });
                        }}
                      />
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">[{config.min}, {config.max}]</span>
                    </div>
                  </div>
                  <input 
                    type="range"
                    min={config.min}
                    max={config.max}
                    step={config.step}
                    value={config.value}
                    className="w-full h-1 bg-blue-200 dark:bg-blue-900 rounded-full appearance-none cursor-pointer accent-blue-600"
                    onChange={(e) => {
                      const newValue = Number(e.target.value);
                      onUpdateBlock({
                        mathConfig: {
                          ...activeBlock.mathConfig!,
                          variables: {
                            ...activeBlock.mathConfig!.variables,
                            [varName]: { ...config, value: newValue }
                          }
                        }
                      });
                    }}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">允许课堂拖拽</span>
                    <button 
                      className={`w-6 h-3 rounded-full relative transition-colors ${config.allowDrag ? 'bg-blue-600' : 'bg-gray-300 dark:bg-slate-600'}`}
                      onClick={() => {
                        onUpdateBlock({
                          mathConfig: {
                            ...activeBlock.mathConfig!,
                            variables: {
                              ...activeBlock.mathConfig!.variables,
                              [varName]: { ...config, allowDrag: !config.allowDrag }
                            }
                          }
                        });
                      }}
                    >
                      <div className={`absolute top-0.5 w-2 h-2 bg-white rounded-full transition-all ${config.allowDrag ? 'right-0.5' : 'left-0.5'}`}></div>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Dynamic HTML Settings */}
      {activeBlock.type === 'dynamic_html' && (
        <section className="p-4 border-b dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">交互式小部件配置</h3>
            <ChevronDown className="w-3 h-3 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-1 font-bold">AI 需求 (上)</label>
              <textarea 
                className="w-full text-xs border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border rounded focus:ring-blue-500 p-2 min-h-[60px]" 
                placeholder="输入修改需求，例如：'添加一个标题'..."
                value={refineInstruction}
                onChange={(e) => setRefineInstruction(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-1 font-bold">源代码编辑</label>
              <textarea 
                className="w-full text-xs border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border rounded focus:ring-blue-500 p-2 min-h-[200px] font-mono" 
                placeholder="在此粘贴 <iframe> 或 HTML 代码..."
                value={activeBlock.htmlContent || ''}
                onChange={(e) => onUpdateBlock({ htmlContent: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-1 font-bold">AI 需求 (下)</label>
              <div className="flex flex-col gap-2">
                <textarea 
                  className="w-full text-xs border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border rounded focus:ring-blue-500 p-2 min-h-[60px]" 
                  placeholder="输入修改需求，例如：'把背景改成红色'..."
                  value={refineInstruction}
                  onChange={(e) => setRefineInstruction(e.target.value)}
                />
                <button 
                  onClick={handleRefine}
                  disabled={isRefining || !refineInstruction.trim()}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-200 dark:shadow-none"
                >
                  {isRefining ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  {isRefining ? '正在优化代码...' : 'AI 智能二次编辑'}
                </button>
              </div>
              <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-2">
                提示：支持拖入 HTML/TXT 文件到画布，或使用 AI 根据需求自动修改代码。
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Text Settings */}
      {activeBlock.type === 'text' && (
        <section className="p-4 border-b dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">文本设置</h3>
            <ChevronDown className="w-3 h-3 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-1">内容</label>
              <textarea 
                className="w-full text-xs border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border rounded focus:ring-blue-500 p-2 min-h-[80px]" 
                value={activeBlock.content || ''}
                onChange={(e) => onUpdateBlock({ content: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-1">文字颜色</label>
              <div className="flex items-center gap-2">
                <input 
                  type="color" 
                  className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                  value={activeBlock.style?.color || '#000000'}
                  onChange={(e) => onUpdateBlock({ style: { ...activeBlock.style, color: e.target.value } })}
                />
                <input 
                  type="text" 
                  className="flex-1 text-xs border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border rounded focus:ring-blue-500 p-2 font-mono"
                  value={activeBlock.style?.color || '#000000'}
                  onChange={(e) => onUpdateBlock({ style: { ...activeBlock.style, color: e.target.value } })}
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-1">字体大小</label>
              <select 
                className="w-full text-xs border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border rounded p-2"
                value={activeBlock.style?.fontSize || '16px'}
                onChange={(e) => onUpdateBlock({ style: { ...activeBlock.style, fontSize: e.target.value } })}
              >
                <option value="12px">12px</option>
                <option value="14px">14px</option>
                <option value="16px">16px</option>
                <option value="18px">18px</option>
                <option value="20px">20px</option>
                <option value="24px">24px</option>
                <option value="32px">32px</option>
                <option value="48px">48px</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-1">字体粗细</label>
              <select 
                className="w-full text-xs border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border rounded p-2"
                value={activeBlock.style?.fontWeight || 'normal'}
                onChange={(e) => onUpdateBlock({ style: { ...activeBlock.style, fontWeight: e.target.value } })}
              >
                <option value="normal">常规</option>
                <option value="bold">加粗</option>
                <option value="100">100</option>
                <option value="200">200</option>
                <option value="300">300</option>
                <option value="400">400</option>
                <option value="500">500</option>
                <option value="600">600</option>
                <option value="700">700</option>
                <option value="800">800</option>
                <option value="900">900</option>
              </select>
            </div>
          </div>
        </section>
      )}

      {/* Image Settings */}
      {activeBlock.type === 'image' && (
        <section className="p-4 border-b dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">图片设置</h3>
            <ChevronDown className="w-3 h-3 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-1">图片 URL</label>
              <input 
                className="w-full text-xs border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border rounded focus:ring-blue-500 p-2" 
                type="text" 
                value={activeBlock.content || ''}
                onChange={(e) => onUpdateBlock({ content: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-1">圆角</label>
              <select 
                className="w-full text-xs border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border rounded p-2"
                value={activeBlock.style?.borderRadius || '0px'}
                onChange={(e) => onUpdateBlock({ style: { ...activeBlock.style, borderRadius: e.target.value } })}
              >
                <option value="0px">无</option>
                <option value="4px">小 (4px)</option>
                <option value="8px">中 (8px)</option>
                <option value="16px">大 (16px)</option>
                <option value="9999px">圆形</option>
              </select>
            </div>
          </div>
        </section>
      )}

      {/* Video Settings */}
      {activeBlock.type === 'video' && (
        <section className="p-4 border-b dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">视频设置</h3>
            <ChevronDown className="w-3 h-3 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-1">视频 URL (YouTube/Vimeo/MP4)</label>
              <input 
                className="w-full text-xs border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border rounded focus:ring-blue-500 p-2" 
                type="text" 
                value={activeBlock.content || ''}
                onChange={(e) => onUpdateBlock({ content: e.target.value })}
              />
            </div>
          </div>
        </section>
      )}

      {/* Quiz Settings */}
      {activeBlock.type === 'quiz' && (
        <section className="p-4 border-b dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">题库设置</h3>
            <ChevronDown className="w-3 h-3 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="space-y-3">
            <button className="w-full py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded text-xs font-bold">
              从题库中选择题目
            </button>
            <div className="p-2 bg-gray-50 dark:bg-slate-700/50 rounded border border-gray-200 dark:border-slate-600">
              <span className="text-[10px] text-gray-500 dark:text-gray-400 block mb-1">题目 ID</span>
              <span className="text-xs font-mono dark:text-gray-200">Q-88258851</span>
            </div>
          </div>
        </section>
      )}

      {/* Interaction Settings */}
      {activeBlock.type === 'interaction' && (
        <section className="p-4 border-b dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">互动配置</h3>
            <ChevronDown className="w-3 h-3 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-1">特效类型</label>
              <select className="w-full text-xs border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border rounded p-2">
                <option>机甲变身</option>
                <option>神兽降临</option>
                <option>粒子爆发</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-700 dark:text-gray-300">自动播放</span>
              <button className="w-8 h-4 bg-blue-600 rounded-full relative">
                <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></div>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Interactive Button Settings */}
      {activeBlock.type === 'interactive_button' && (
        <section className="p-4 border-b dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">按钮配置</h3>
            <ChevronDown className="w-3 h-3 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-1">按钮文本</label>
              <input 
                className="w-full text-xs border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border rounded focus:ring-blue-500 p-2" 
                type="text" 
                value={activeBlock.content || ''}
                onChange={(e) => onUpdateBlock({ content: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-1">背景颜色</label>
              <div className="flex items-center gap-2">
                <input 
                  type="color" 
                  className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                  value={activeBlock.style?.backgroundColor || '#4F46E5'}
                  onChange={(e) => onUpdateBlock({ style: { ...activeBlock.style, backgroundColor: e.target.value } })}
                />
                <input 
                  type="text" 
                  className="flex-1 text-xs border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border rounded focus:ring-blue-500 p-2 font-mono"
                  value={activeBlock.style?.backgroundColor || '#4F46E5'}
                  onChange={(e) => onUpdateBlock({ style: { ...activeBlock.style, backgroundColor: e.target.value } })}
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-1">文字颜色</label>
              <div className="flex items-center gap-2">
                <input 
                  type="color" 
                  className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                  value={activeBlock.style?.color || '#FFFFFF'}
                  onChange={(e) => onUpdateBlock({ style: { ...activeBlock.style, color: e.target.value } })}
                />
                <input 
                  type="text" 
                  className="flex-1 text-xs border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border rounded focus:ring-blue-500 p-2 font-mono"
                  value={activeBlock.style?.color || '#FFFFFF'}
                  onChange={(e) => onUpdateBlock({ style: { ...activeBlock.style, color: e.target.value } })}
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-1">字体大小</label>
              <select 
                className="w-full text-xs border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border rounded p-2"
                value={activeBlock.style?.fontSize || '16px'}
                onChange={(e) => onUpdateBlock({ style: { ...activeBlock.style, fontSize: e.target.value } })}
              >
                <option value="12px">12px</option>
                <option value="14px">14px</option>
                <option value="16px">16px</option>
                <option value="18px">18px</option>
                <option value="20px">20px</option>
                <option value="24px">24px</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-1">触发动作</label>
              <select 
                className="w-full text-xs border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 border rounded p-2"
                value={activeBlock.action || 'none'}
                onChange={(e) => onUpdateBlock({ action: e.target.value })}
              >
                <option value="none">无动作</option>
                <option value="toggle_visibility">切换图片显示/隐藏</option>
                <option value="trigger_q_pet_animation">触发神兽动画</option>
                <option value="check_answer">检查答案</option>
              </select>
            </div>
          </div>
        </section>
      )}

      {/* Interaction & Animation */}
      <section className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">交互与动画</h3>
          <ChevronDown className="w-3 h-3 text-gray-400 dark:text-gray-500" />
        </div>
        <div className="space-y-3">
          <button className="w-full py-2 bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded text-xs font-medium text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2">
            <PlusCircle className="w-3.5 h-3.5" /> 添加触发事件
          </button>
          
          {activeBlock.animation && (
            <div className="p-2 border border-blue-100 dark:border-blue-900 bg-blue-50/30 dark:bg-blue-900/30 rounded flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                <span className="text-[11px] font-medium text-blue-700 dark:text-blue-300">入场动画：{activeBlock.animation}</span>
              </div>
              <button onClick={() => onUpdateBlock({ animation: undefined })}>
                <X className="w-3 h-3 text-blue-300 dark:text-blue-500 hover:text-blue-500 dark:hover:text-blue-400" />
              </button>
            </div>
          )}
        </div>
      </section>
    </aside>
  );
}
