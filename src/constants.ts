import { CoursewareSchema, SectionType } from './types';

export const SECTIONS: SectionType[] = ['封面', '目录', '引入', '探究', '笔记', '练习', '总结', '导出'];

export const INITIAL_STATE: CoursewareSchema = {
  id: 'course-1',
  title: '未命名项目',
  pages: [
    {
      id: 'page-1',
      title: '空白页面',
      section: '探究',
      blocks: [],
    }
  ]
};
