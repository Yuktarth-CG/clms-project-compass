export type ProjectCategory = 'content' | 'vanilla' | 'enhancement';

export type LifecycleStage = 'requirement' | 'design' | 'development' | 'qa' | 'release';

export interface StageDate {
  startDate: string | null;
  endDate: string | null;
}

export interface Project {
  id: string;
  name: string;
  category: ProjectCategory;
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