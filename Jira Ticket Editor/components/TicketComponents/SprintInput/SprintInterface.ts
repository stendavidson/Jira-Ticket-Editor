
export interface SprintInterface {
  id: number;
  name: string;
  state: string;
  goal: string;
  startDate: string;
  endDate: string;
  self?: string;
  createdDate?: string;
  originBoardId?: number;
  boardId?: string;
}


export interface SprintListResponse {
  maxResults: number;
  startAt: number;
  total: number;
  isLast: boolean;
  values: SprintInterface[];
}
