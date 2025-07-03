
export interface FieldContextInterface {
  id: string;
  name: string;
  description: string;
  isGlobalContext: boolean;
  isAnyIssueType: boolean;
}

export interface FieldContextResponseInterface {
  isLast: boolean;
  maxResults: number;
  startAt: number;
  total: number;
  values: FieldContextInterface[];
}

export interface FieldOptionsResponseInterface{
  isLast: boolean;
  maxResults: number;
  startAt: number;
  total: number;
  values: FieldOptionInterface[];
} 

export interface FieldOptionInterface {
  self?: string;
  disabled?: boolean;
  optionId?: string;
  value: string;
  id: string;
}

export interface OptionCreationResponse {
  options: FieldOptionInterface[]
}