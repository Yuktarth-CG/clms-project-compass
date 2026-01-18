import { Project, RiskItem } from '@/types/project';

const PROJECTS_KEY = 'clms_projects';
const RISKS_KEY = 'clms_risks';
const DATA_INITIALIZED_KEY = 'clms_data_initialized';

export const isDataInitialized = (): boolean => {
  return localStorage.getItem(DATA_INITIALIZED_KEY) === 'true';
};

export const setDataInitialized = (): void => {
  localStorage.setItem(DATA_INITIALIZED_KEY, 'true');
};

export const getProjects = (): Project[] => {
  const data = localStorage.getItem(PROJECTS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveProjects = (projects: Project[]): void => {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
};

export const addProject = (project: Project): void => {
  const projects = getProjects();
  projects.push(project);
  saveProjects(projects);
};

export const updateProject = (updatedProject: Project): void => {
  const projects = getProjects();
  const index = projects.findIndex(p => p.id === updatedProject.id);
  if (index !== -1) {
    projects[index] = { ...updatedProject, updatedAt: new Date().toISOString() };
    saveProjects(projects);
  }
};

export const deleteProject = (projectId: string): void => {
  const projects = getProjects().filter(p => p.id !== projectId);
  saveProjects(projects);
};

export const getRisks = (): RiskItem[] => {
  const data = localStorage.getItem(RISKS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveRisks = (risks: RiskItem[]): void => {
  localStorage.setItem(RISKS_KEY, JSON.stringify(risks));
};

export const addRisk = (risk: RiskItem): void => {
  const risks = getRisks();
  risks.push(risk);
  saveRisks(risks);
};

export const updateRisk = (updatedRisk: RiskItem): void => {
  const risks = getRisks();
  const index = risks.findIndex(r => r.id === updatedRisk.id);
  if (index !== -1) {
    risks[index] = updatedRisk;
    saveRisks(risks);
  }
};

export const deleteRisk = (riskId: string): void => {
  const risks = getRisks().filter(r => r.id !== riskId);
  saveRisks(risks);
};
