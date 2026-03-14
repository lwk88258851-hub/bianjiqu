import { CoursewareSchema, SectionType } from './types';

export const SECTIONS: SectionType[] = ['封面', '目录', '引入', '探究', '笔记', '练习', '总结', '导出'];

export const INITIAL_STATE: CoursewareSchema = {
  id: 'course-1',
  title: '二次函数 - 第一课',
  pages: [
    {
      id: 'page-1',
      title: '场景 1',
      section: '探究',
      blocks: [],
    },
    {
      id: 'page-2',
      title: '场景 2',
      section: '探究',
      blocks: [],
    },
    {
      id: 'page-demo',
      title: '事件引擎演示',
      section: '探究',
      blocks: [
        {
          id: 'vid_01',
          type: 'video',
          src: 'https://www.w3schools.com/html/mov_bbb.mp4',
          x: 50,
          y: 50,
          width: 480,
          height: 270,
          state: { isPlaying: false }
        },
        {
          id: 'btn_play',
          type: 'action_button',
          label: '播放视频',
          x: 50,
          y: 340,
          width: 120,
          height: 40,
          events: {
            onClick: [{ targetId: 'vid_01', action: 'PLAY' }]
          },
          style: { backgroundColor: '#10b981', color: '#FFFFFF', borderRadius: '8px' }
        },
        {
          id: 'btn_pause',
          type: 'action_button',
          label: '暂停视频',
          x: 180,
          y: 340,
          width: 120,
          height: 40,
          events: {
            onClick: [{ targetId: 'vid_01', action: 'PAUSE' }]
          },
          style: { backgroundColor: '#ef4444', color: '#FFFFFF', borderRadius: '8px' }
        }
      ]
    },
    {
      id: 'page-3',
      title: '场景 3',
      section: '探究',
      blocks: [
        {
          id: 'block-1',
          type: 'math-graph',
          x: 128,
          y: 96,
          width: 320,
          height: 256,
          mathConfig: {
            equation: 'y = a*x^2 + b*x + c',
            showGrid: true,
            showLabels: false,
            variables: {
              a: { min: -5, max: 5, step: 0.1, value: 1, allowDrag: true },
              b: { min: -10, max: 10, step: 1, value: 0, allowDrag: false },
              c: { min: 0, max: 20, step: 1, value: 0, allowDrag: false },
            }
          },
          animation: '向上淡入'
        },
        {
          id: 'block-2',
          type: 'image',
          x: 100,
          y: 50,
          width: 240,
          height: 180,
          content: 'https://picsum.photos/seed/math/400/300'
        }
      ],
      globalStateMonitor: {
        condition: '当本页练习全班答对率 > 80% 时',
        action: '触发 [机甲空投] 动画'
      }
    }
  ]
};
