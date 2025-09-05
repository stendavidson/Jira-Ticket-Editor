
export interface LinkedIssueInterface {
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
    issuetype: {
      self: string;
      id: string;
      description: string;
      iconUrl: string;
      name: string;
      subtask: boolean;
      avatarId: number;
      entityId: string;
      hierarchyLevel: number;
    };
  };
}

export interface IssueLinkInterface {
  id: string;
  self: string;
  type: {
    id: string;
    name: string;
    inward: string;
    outward: string;
    self: string;
  };
  outwardIssue?: LinkedIssueInterface;
  inwardIssue?: LinkedIssueInterface;
}


export interface LimitedIssueInterface{
  expand: string
  id: string,
  self: string,
  key: string,
  fields: {
    issuelinks: IssueLinkInterface[]
  };
}