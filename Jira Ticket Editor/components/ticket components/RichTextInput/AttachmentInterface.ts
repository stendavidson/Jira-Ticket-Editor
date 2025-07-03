
export default interface AttachmentInterface {
  id: string;
  self: string;
  filename: string;
  mimeType: string;
  size: number;
  created: number;
  content: string;
  uuid?: string | null;
  thumbnail?: string;
  author: {
    accountId: string;
    active: boolean;
    displayName: string;
    emailAddress: string;
    self: string;
    timeZone: string;
    avatarUrls: {
      '16x16': string;
      '24x24': string;
      '32x32': string;
      '48x48': string;
    };
  };
}