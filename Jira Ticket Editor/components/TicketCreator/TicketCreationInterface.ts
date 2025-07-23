
export default interface TicketCreationInterface {
  id: string;
  key: string;
  self: string;
  transition: {
    status: number;
    errorCollection: {
      errorMessages: string[];
      errors: Record<string, string>;
    };
  };
}