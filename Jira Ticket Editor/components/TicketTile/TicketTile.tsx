// Style imports
import style from "./TicketTile.module.scss";

// External imports
import { useContext, useEffect, useState } from "react";

// Internal Imports
import UserAvatar from "../UserAvatar/UserAvatar";
import TicketInterface from "@/interfaces/TicketInterface";
import request from "@/lib/nothrow_request";
import { TicketContext } from "@/contexts/TicketContext";


export default function TicketTile({ ticketID }: {ticketID?: string }){

  // Ticket data
  const [ticket, setTicket] = useState<TicketInterface | null>(null);

  // Ticket context
  const context = useContext(TicketContext);

  useEffect(() => {
      
    // Async function to fetch coponent data
    const fetchTicket = async () => {

      let ticketData: TicketInterface | null = null;

      if(ticketID){
  
        // URL Params
        const url: URL = new URL("/proxy", window.location.origin);
        url.searchParams.append("pathname", `/issue/${ticketID}`);
        url.searchParams.append("fields", "*navigable");
        url.searchParams.append("expand", "editmeta");
        url.searchParams.append("elevate", "true");
  
        // User request
        const response = await request(
          url.toString(),
          {
            method: "GET",
          }
        );

        if(response?.status.toString().startsWith("2")){
          ticketData = await response?.json();
          console.log(ticketData);
        }
  
        // Set component variables & trigger re-render
        if (ticketData) {
          setTicket(ticketData);
        }
      }
    }
  
    fetchTicket();
    
  }, [ticketID]);


  /**
   * Set ticket data
   */
  function highlightTicket(){
    context?.setTicketData(ticket);
  }

  return (ticketID !== undefined ? (
    <div className={`${style.ticketTile} ${ticket === context?.ticketData ? style.highlight : ""}`} onClick={highlightTicket}>
      <div className={style.startBox}>
        <div className={style.ticketTitle}>{ticket?.fields?.summary}</div>
        <p className={style.ticketNumber}>{ticket?.key}</p>
      </div>
      <div className={style.endBox}>
        <img src={ticket?.fields?.priority?.iconUrl} className={style.priority}/>
        <UserAvatar accountID={ticket?.fields?.assignee?.accountId} className={style.avatar} defaultDisplayName="Unassigned"/>
      </div>
    </div>
  ) : (
    <div className={style.ticketTile}>No Tickets Found</div>
  ));
}