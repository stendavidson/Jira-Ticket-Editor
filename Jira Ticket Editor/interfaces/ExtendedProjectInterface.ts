// Internal Imports
import ComponentInterface from "./ComponentInterface";
import IssueTypeInterface from "./IssueTypeInterface";


export interface ExtendedProjectInterface {
  assigneeType: string;
  avatarUrls: {
    "16x16": string;
    "24x24": string;
    "32x32": string;
    "48x48": string;
  };
  components: ComponentInterface[];
  description: string;
  email: string;
  id: string;
  insight: {
    lastIssueUpdateTime: string;
    totalIssueCount: number;
  };
  issueTypes: IssueTypeInterface[];
  key: string;
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
  name: string;
  projectCategory: {
    description: string;
    id: string;
    name: string;
    self: string;
  };
  properties: Record<string, any>;
  roles: Record<string, string>;
  self: string;
  simplified: boolean;
  style: string;
  url: string;
  versions: any[];
}




