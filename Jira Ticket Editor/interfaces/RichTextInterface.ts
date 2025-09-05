
export interface RichTextInterface {
  type: string;
  version?: number;
  content?: RichTextNodeInterface[];
}

export interface RichTextNodeInterface {
  type: string;
  attrs?: Record<string, any>;
  content?: RichTextNodeInterface[];
  text?: string;
  marks?: SpanInterface[];
}

export interface SpanInterface {
  type: string;
  attrs?: Record<string, any>;
}
