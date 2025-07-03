
export interface ProjectInterface{
  avatarUrls: {
    "16x16": string;
    "24x24": string;
    "32x32": string;
    "48x48": string;
  };
  id: string;
  insight: {
    lastIssueUpdateTime: string;
    totalIssueCount: number;
  };
  key: string;
  name: string;
  projectCategory: {
    description: string;
    id: string;
    name: string;
    self: string;
  };
  self: string;
  simplified: boolean;
  style: string;
}


export interface ProjectsResponseInterface {
  isLast: boolean;
  maxResults: number;
  nextPage?: string;
  self: string;
  startAt: number;
  total: number;
  values: ProjectInterface[];
}