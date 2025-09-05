

export interface IssueResponseInterface {
  issues: IssueInterface[];
  nextPageToken?: string;
  isLast: boolean;
}

export interface IssueInterface{
  expand: string
  id: string,
  self: string,
  key: string,
  editmeta: {
    fields: {
      [key: string]: any;
    };
  }
  fields: {
    [key: string]: any;
  };
}