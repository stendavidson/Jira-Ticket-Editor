
export interface AttachmentInterface {
  uuid: string | null;
  self: string;
  id: string;
  filename: string;
  author: {
    self: string;
    accountId: string;
    emailAddress: string;
    avatarUrls: {
      "48x48": string;
      "24x24": string;
      "16x16": string;
      "32x32": string;
    };
    displayName: string;
    active: boolean;
    timeZone: string;
    accountType: string;
  };
  created: string;
  size: number;
  mimeType: string;
  content: string;
  thumbnail: string;
}