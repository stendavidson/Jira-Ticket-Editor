
export interface BoardInterface {
  id: number;
  self: string;
  name: string;
  type: string;
  location: {
    projectId: number;
    displayName: string;
    projectName: string;
    projectKey: string;
    projectTypeKey: string;
    avatarURI: string;
    name: string;
  };
  isPrivate: boolean;
}

export interface BoardResponseInterface {
  maxResults: number;
  startAt: number;
  total: number;
  isLast: boolean;
  values: BoardInterface[];
}