import Project from "./ProjectInterface";

export default interface ProjectList {
  isLast: boolean;
  maxResults: number;
  nextPage?: string;
  self: string;
  startAt: number;
  total: number;
  values: Project[];
}