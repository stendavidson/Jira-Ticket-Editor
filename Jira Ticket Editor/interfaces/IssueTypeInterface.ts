
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
    project: {
      id: string;
    };
    type: string;
  };
}