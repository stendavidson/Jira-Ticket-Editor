'use client'

// Import Styles
import style from "./layout.module.scss";

// Internal Imports
import Navbar from "../../components/Navbar/Navbar"
import { TicketProvider } from "@/contexts/TicketContext";
import Ticket from "@/components/Ticket/Ticket";
import { UserProvider } from "@/contexts/UserContext";


export default function AuthenticatedLayout({ children }: { children: React.ReactNode}){
  
  return (
    <UserProvider>
      <TicketProvider>
        <Navbar/>
        <div className={style.main}>
          {children}
        </div>
        <Ticket/>
      </TicketProvider>
    </UserProvider>
  )
}
