
export default interface IssueTypeInterface {
  avatarId: number;
  description: string;
  hierarchyLevel: number;
  iconUrl: string;
  id: string;
  name: string;
  self: string;
  subtask: boolean;
  entityId?: string;
  scope?: {
    type: string;
    project: {
      id: string;
    };
  };
}