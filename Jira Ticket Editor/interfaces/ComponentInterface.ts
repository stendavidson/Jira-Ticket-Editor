
export default interface ComponentInterface {
  ari: string;
  assignee: {
    accountId: string;
    accountType: string;
    active: boolean;
    avatarUrls: {
      "16x16": string;
      "24x24": string;
      "32x32": string;
      "48x48": string;
    };
    displayName: string;
    key: string;
    name: string;
    self: string;
  };
  assigneeType: string;
  description: string;
  id: string;
  isAssigneeTypeValid: boolean;
  lead: {
    accountId: string;
    accountType: string;
    active: boolean;
    avatarUrls: {
      "16x16": string;
      "24x24": string;
      "32x32": string;
      "48x48": string;
    };
    displayName: string;
    key: string;
    name: string;
    self: string;
  };
  metadata: {
    icon: string;
  };
  name: string;
  project: string;
  projectId: number;
  realAssignee: {
    accountId: string;
    accountType: string;
    active: boolean;
    avatarUrls: {
      "16x16": string;
      "24x24": string;
      "32x32": string;
      "48x48": string;
    };
    displayName: string;
    key: string;
    name: string;
    self: string;
  };
  realAssigneeType: string;
  self: string;
}