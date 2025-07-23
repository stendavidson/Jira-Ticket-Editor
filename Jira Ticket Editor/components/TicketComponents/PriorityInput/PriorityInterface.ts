

export interface PriorityResponseInterface {
  isLast: boolean;
  maxResults: number;
  startAt: number;
  total: number;
  values: PriorityInterface[];
}

export interface PriorityInterface {
  description?: string;
  iconUrl: string;
  id: string;
  isDefault?: boolean;
  name: string;
  self: string;
  statusColor?: string;
}