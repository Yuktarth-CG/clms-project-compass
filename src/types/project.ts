export type ProjectCategory = 'content' | 'vanilla' | 'enhancement';

export type ProjectPriority = 1 | 2 | 3 | 4;

export type LifecycleStage = 'requirement' | 'design' | 'development' | 'qa' | 'release';

export interface StageDate {
  startDate: string | null;
  endDate: string | null;
}

export interface Project {
  id: string;
  name: string;
  category: ProjectCategory;
  priority: ProjectPriority | null;
  sprintId: string | null;
  stages: Record<LifecycleStage, StageDate>;
  discarded: boolean;
  jiraLink: string | null;
  reason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RiskItem {
  id: string;
  text: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
}

export interface Accomplishment {
  id: string;
  title: string;
  description: string | null;
  completedAt: string;
  projectId: string | null;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  isSharedResource: boolean;
  displayOrder: number;
  createdAt: string;
}

export interface DashboardSetting {
  id: string;
  settingKey: string;
  settingValue: boolean;
  updatedAt: string;
}

export interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface SavedGanttChart {
  id: string;
  name: string;
  title: string;
  subtitle: string | null;
  rangeStart: string | null;
  rangeEnd: string | null;
  projectIds: string[];
  overrides: Record<string, Record<LifecycleStage, StageDate>>;
  createdAt: string;
  updatedAt: string;
}

export const STAGE_LABELS: Record<LifecycleStage, string> = {
  requirement: 'Requirement Gathering',
  design: 'Design',
  development: 'Development',
  qa: 'QA',
  release: 'Release',
};

export const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  content: 'Content Team Requirements',
  vanilla: 'Vanilla Build',
  enhancement: 'Enhancements',
};

export const STAGE_ORDER: LifecycleStage[] = ['requirement', 'design', 'development', 'qa', 'release'];

export const PRIORITY_LABELS: Record<ProjectPriority, string> = {
  1: 'Priority 1',
  2: 'Priority 2',
  3: 'Priority 3',
  4: 'Priority 4',
};

export const PRIORITY_ORDER: ProjectPriority[] = [1, 2, 3, 4];