
export interface TeamInterface {
  id: string;
  name: string;
  avatarUrl: string;
  isVisible: boolean;
  isVerified: boolean;
  title: string;
  isShared: boolean;
}

export interface TeamOptionResponseInterface {
  results: TeamOptionInterface[];
}

export interface TeamOptionInterface {
  value: string;
  displayName: string;
}