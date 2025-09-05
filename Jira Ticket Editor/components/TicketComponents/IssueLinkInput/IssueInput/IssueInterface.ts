
export interface IssueResponseInterface {
  issues: IssueInterface[];
  isLast: boolean;
  nextPageToken: string;
}

export interface IssueInterface {
  expand: string;
  id: string;
  self: string;
  key: string;
  fields: {
    summary: string;
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
