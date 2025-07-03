
export default interface UserInterface {
  self: string;
  accountId: string;
  accountType: string;
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
  locale: string;
}