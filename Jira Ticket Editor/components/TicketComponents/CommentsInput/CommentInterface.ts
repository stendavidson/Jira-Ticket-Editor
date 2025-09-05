import { RichTextInterface } from "@/interfaces/RichTextInterface";


export interface CommentInterface {
  id: string;
  self: string;
  created: string;
  updated: string;
  body: RichTextInterface; 
  renderedBody?: string;            
  jsdPublic?: boolean;               
  visibility?: {
    identifier?: string;
    type: string;
    value: string;
  };
  author: {
    accountId: string;
    active: boolean;
    displayName: string;
    self: string;
    emailAddress?: string;
    accountType?: string;
    avatarUrls?: {
      "48x48": string,
      "24x24": string,
      "16x16": string,
      "32x32": string
    }
  };
  updateAuthor?: {
    accountId: string;
    active: boolean;
    displayName: string;
    self: string;
    emailAddress?: string;
    accountType?: string;
    avatarUrls?: {
      "48x48": string,
      "24x24": string,
      "16x16": string,
      "32x32": string
    }
  };
}


export interface CommentResponseInterface{
  comments: CommentInterface[],
  maxResults: number,
  startAt: number,
  total: number
}