
export interface IssueLinkTypeInterface {
  id: string;
  inward: string;
  name: string;
  outward: string;
  self: string;
}

export interface SimplifiedIssueLinkTypeInterface {
  id: string;
  name: string;
  type: string;
  direction: number;
}

export interface IssueLinkTypesResponseInterface {
  issueLinkTypes: IssueLinkTypeInterface[];
}