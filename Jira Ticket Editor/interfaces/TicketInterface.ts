
export default interface TicketInterface{
  "expand": string
  "id": string,
  "self": string,
  "key": string,
  "editmeta": {
    "fields": {
      [key: string]: any;
    };
  }
  "fields": {
    [key: string]: any;
  };
}