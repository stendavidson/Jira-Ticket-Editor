
export default interface AtlassianUser {
  accountId: string;
  accountType: string;
  active: boolean;
  applicationRoles: {
    items: any[]; // Replace 'any' with a more specific type if known
    size: number;
  };
  avatarUrls: {
    "16x16": string;
    "24x24": string;
    "32x32": string;
    "48x48": string;
  };
  displayName: string;
  emailAddress: string;
  groups: {
    items: any[]; // Replace 'any' with a more specific type if known
    size: number;
  };
  key: string;
  name: string;
  self: string;
  timeZone: string;
}