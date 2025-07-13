
// External imports
import TicketInterface from "@/interfaces/TicketInterface";
import { createContext, ReactNode, useState } from "react";


export const TicketContext = createContext<{
  ticketData: TicketInterface | null, 
  setTicketData: React.Dispatch<React.SetStateAction<TicketInterface | null>>,
  updateIndicator: string | null,
  setUpdateIndicator: React.Dispatch<React.SetStateAction<string | null>>
} | null>(null);


export function TicketProvider({ children }: {children : ReactNode}) {

  const [ticketData, setTicketData] = useState<TicketInterface | null>(null);
  const [updateIndicator, setUpdateIndicator] = useState<string | null>(null);

  return (
    <TicketContext.Provider value={{ticketData, setTicketData, updateIndicator, setUpdateIndicator}}>
      {children}
    </TicketContext.Provider>
  );
}