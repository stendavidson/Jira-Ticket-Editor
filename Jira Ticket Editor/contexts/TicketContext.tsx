
// External imports
import { IssueInterface } from "@/interfaces/IssueInterface";
import { createContext, ReactNode, useState } from "react";


/**
 * This "Ticket" context provides the Ticket component and other components
 * with access to the "selected" ticket's data.
 */
export const TicketContext = createContext<{
  ticketData: IssueInterface | null, 
  setTicketData: React.Dispatch<React.SetStateAction<IssueInterface | null>>,
  updateIndicator: string | null,
  setUpdateIndicator: React.Dispatch<React.SetStateAction<string | null>>
} | null>(null);


/**
 * This "Ticket" context provider gives the application access to the context object.
 */
export function TicketProvider({ children }: {children : ReactNode}) {

  const [ticketData, setTicketData] = useState<IssueInterface | null>(null);
  const [updateIndicator, setUpdateIndicator] = useState<string | null>(null);

  return (
    <TicketContext.Provider value={{ticketData, setTicketData, updateIndicator, setUpdateIndicator}}>
      {children}
    </TicketContext.Provider>
  );
}