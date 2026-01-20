import { Project, RiskItem, ProjectCategory } from '@/types/project';

const generateId = () => Math.random().toString(36).substr(2, 9);

const generateProjectDates = (baseDate: Date, offsetDays: number, variation: number) => {
  const start = new Date(baseDate);
  start.setDate(start.getDate() + offsetDays + Math.floor(Math.random() * variation));
  
  // Requirement phase: 10-20 days
  const reqStart = new Date(start);
  const reqEnd = new Date(reqStart);
  reqEnd.setDate(reqEnd.getDate() + 10 + Math.floor(Math.random() * 10));
  
  // Design phase: 15-30 days
  const designStart = new Date(reqEnd);
  designStart.setDate(designStart.getDate() + 1);
  const designEnd = new Date(designStart);
  designEnd.setDate(designEnd.getDate() + 15 + Math.floor(Math.random() * 15));
  
  // Development phase: 30-60 days
  const devStart = new Date(designEnd);
  devStart.setDate(devStart.getDate() + 1);
  const devEnd = new Date(devStart);
  devEnd.setDate(devEnd.getDate() + 30 + Math.floor(Math.random() * 30));
  
  // QA phase: 10-20 days
  const qaStart = new Date(devEnd);
  qaStart.setDate(qaStart.getDate() + 1);
  const qaEnd = new Date(qaStart);
  qaEnd.setDate(qaEnd.getDate() + 10 + Math.floor(Math.random() * 10));
  
  // Release phase: 5-10 days
  const releaseStart = new Date(qaEnd);
  releaseStart.setDate(releaseStart.getDate() + 1);
  const releaseEnd = new Date(releaseStart);
  releaseEnd.setDate(releaseEnd.getDate() + 5 + Math.floor(Math.random() * 5));
  
  return {
    requirement: { 
      startDate: reqStart.toISOString().split('T')[0], 
      endDate: reqEnd.toISOString().split('T')[0] 
    },
    design: { 
      startDate: designStart.toISOString().split('T')[0], 
      endDate: designEnd.toISOString().split('T')[0] 
    },
    development: { 
      startDate: devStart.toISOString().split('T')[0], 
      endDate: devEnd.toISOString().split('T')[0] 
    },
    qa: { 
      startDate: qaStart.toISOString().split('T')[0], 
      endDate: qaEnd.toISOString().split('T')[0] 
    },
    release: { 
      startDate: releaseStart.toISOString().split('T')[0], 
      endDate: releaseEnd.toISOString().split('T')[0] 
    },
  };
};

const projectNames = {
  content: [
    'Course Module Builder', 'Assessment Engine v2', 'Content Library Migration', 
    'Video Transcoding Pipeline', 'Interactive Quiz System', 'Learning Path Designer',
    'Content Versioning System', 'Multimedia Asset Manager', 'Curriculum Mapper',
    'SCORM Package Handler', 'Content Analytics Dashboard', 'Accessibility Checker',
  ],
  vanilla: [
    'Core Authentication System', 'User Management Module', 'Role-Based Access Control',
    'API Gateway Setup', 'Database Schema Design', 'Notification Service',
    'File Storage System', 'Search Infrastructure', 'Caching Layer',
    'Logging Framework', 'Health Monitoring', 'Config Management',
  ],
  enhancement: [
    'Dark Mode Support', 'Mobile Responsiveness', 'Performance Optimization',
    'Bulk Import Feature', 'Advanced Reporting', 'SSO Integration',
    'Webhook Support', 'API Rate Limiting', 'Custom Branding',
    'Audit Trail Enhancement', 'Export Functionality', 'Dashboard Widgets',
  ],
};

export const generateMockProjects = (): Project[] => {
  const projects: Project[] = [];
  // Start 3 months ago to have some visible history
  const baseDate = new Date();
  baseDate.setMonth(baseDate.getMonth() - 3);
  
  const categories: ProjectCategory[] = ['content', 'vanilla', 'enhancement'];
  
  categories.forEach((category) => {
    projectNames[category].forEach((name, index) => {
      // Stagger projects over 12 months
      const offsetDays = index * 25;
      projects.push({
        id: generateId(),
        name,
        category,
        stages: generateProjectDates(baseDate, offsetDays, 15),
        discarded: false,
        jiraLink: null,
        reason: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });
  });
  
  return projects;
};

export const generateMockRisks = (): RiskItem[] => {
  return [
    {
      id: generateId(),
      text: 'API Gateway migration may cause 2-hour downtime during Q2 release window',
      severity: 'high',
      createdAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      text: 'Content Library Migration blocked on legacy data format conversion',
      severity: 'critical',
      createdAt: new Date().toISOString(),
    },
    {
      id: generateId(),
      text: 'SSO Integration dependent on third-party vendor timeline',
      severity: 'medium',
      createdAt: new Date().toISOString(),
    },
  ];
};
