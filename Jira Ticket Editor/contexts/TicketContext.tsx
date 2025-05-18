
// External imports
import TicketInterface from "@/interfaces/TicketInterface";
import { createContext, JSX, ReactNode, useState } from "react";


export const TicketContext = createContext<{ticketData: TicketInterface | null, setTicketData: React.Dispatch<React.SetStateAction<TicketInterface | null>>} | null>(null);


export function TicketProvider({ children }: {children : ReactNode}): JSX.Element {

  const [ticketData, setTicketData] = useState<TicketInterface | null>(null);

  return (
    <TicketContext.Provider value={{ticketData, setTicketData}}>
      {children}
    </TicketContext.Provider>
  );
}