export type BlockType = 'text' | 'image' | 'video' | 'math-graph' | 'quiz' | 'interaction' | 'interactive_button' | 'right_triangle' | 'dynamic_html' | 'action_button' | 'iframe_sandbox';

export type SectionType = '封面' | '目录' | '引入' | '探究' | '笔记' | '练习' | '总结' | '导出';

export interface BlockEvent {
  targetId: string;
  action: string;
  value?: any;
}

export interface MathVariable {
  min: number;
  max: number;
  step: number;
  value: number;
  allowDrag: boolean;
}

export interface MathConfig {
  equation: string;
  showGrid: boolean;
  showLabels: boolean;
  variables: Record<string, MathVariable>;
}

export interface BlockStyle {
  fontSize?: string;
  color?: string;
  backgroundColor?: string;
  fontWeight?: string;
  borderRadius?: string;
  [key: string]: any;
}

export interface Block {
  id: string;
  name?: string;
  type: BlockType;
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  htmlContent?: string;
  mathConfig?: MathConfig;
  animation?: string;
  hidden?: boolean;
  style?: BlockStyle;
  action?: string;
  locked?: boolean;
  state?: Record<string, any>;
  events?: {
    onClick?: BlockEvent[] | BlockEvent;
    onHover?: BlockEvent[] | BlockEvent;
    onChanged?: BlockEvent[] | BlockEvent;
  };
  label?: string;
  src?: string;
  props?: Record<string, any>;
}

export interface Page {
  id: string;
  title: string;
  section: SectionType;
  blocks: Block[];
  thumbnail?: string;
  globalStateMonitor?: {
    condition: string;
    action: string;
  };
  backgroundColor?: string;
}

export interface CoursewareSchema {
  id: string;
  title: string;
  theme?: 'light' | 'dark';
  pages: Page[];
}
