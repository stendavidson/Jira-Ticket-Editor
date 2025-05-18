
export default interface Project{
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