export interface ParentResponseInterface {
  issues: ParentInterface[];
}


export interface ParentInterface {
  expand?: string;
  id: string;
  key: string;
  self: string;
  fields: {
    summary: string;
    status: {
      self: string;
      description: string;
      iconUrl: string;
      name: string;
      id: string;
      statusCategory: {
        self: string;
        id: number;
        key: string;
        colorName: string;
        name: string;
      };
    };
    priority: {
      self: string;
      iconUrl: string;
      name: string;
      id: string;
    };
    issuetype: DefaultIssueTypeInterface;
  };
}


export interface DefaultIssueTypeInterface {
  self: string;
  id: string;
  description: string;
  iconUrl: string;
  name: string;
  subtask: boolean;
  avatarId: number;
  entityId: string;
  hierarchyLevel: number;
}


export interface IssueTypeInterface {
  self: string;
  id: string;
  description: string;
  iconUrl: string;
  name: string;
  untranslatedName: string;
  subtask: boolean;
  avatarId: number;
  hierarchyLevel: number;
  scope: {
    type: string;
    project: {
      id: string;
    };
  };
}
