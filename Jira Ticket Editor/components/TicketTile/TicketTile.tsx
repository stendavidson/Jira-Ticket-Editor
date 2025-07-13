// Style imports
import style from "./TicketTile.module.scss";

// External imports
import { useContext, useEffect, useRef, useState } from "react";

// Internal Imports
import UserAvatar from "../UserAvatar/UserAvatar";
import TicketInterface from "@/interfaces/TicketInterface";
import request from "@/lib/nothrow_request";
import { TicketContext } from "@/contexts/TicketContext";
import { getVisibleFields } from "@/lib/field_visibility";


export default function TicketTile({ ticketID }: {ticketID?: string }){

  // State values
  const [ticket, setTicket] = useState<TicketInterface | null>(null);

  // Context(s)
  const context = useContext(TicketContext);



  ///////////////////////////////////////////////////////////////////////////////
  //////////////////////////////// API Functions ////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////


  
  /**
   * This function retrieves the ticket data
   */
  async function fetchTicket(){

    // URL Params
    const url: URL = new URL("/proxy-api", window.location.origin);
    url.searchParams.append("pathname", `/issue/${ticketID}`);
    url.searchParams.append("fields", "*all");
    url.searchParams.append("expand", "editmeta");
    url.searchParams.append("elevate", "true");

    // User request
    const response = await request(
      url.toString(),
      {
        method: "GET",
      }
    );

    // Process responses
    let ticketData: TicketInterface | null = null;

    if(response?.status.toString().startsWith("2")){
      ticketData = getVisibleFields(await response?.json());
    }

    setTicket(ticketData);
  }



  ///////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////// Callbacks //////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////



  /**
   * This function sets the ticket context data
   */
  function highlightTicket(){
    context?.setTicketData(ticket);
  }



  ///////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////// Effects ///////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////
  


  /**
   * This retrieves the ticket data
   */
  useEffect(() => {
    
    // Prevent unnecessary requests
    if(ticketID){
      fetchTicket();
    }
    
  }, [ticketID]);


  /**
   * The ticket data is re-loaded upon request from the ticket
   */
  useEffect(() => {
    
    if(context?.updateIndicator === ticketID){
      fetchTicket();
      context?.setUpdateIndicator(null);
    }
    
  }, [context?.updateIndicator]);


  return (ticketID !== undefined ? (
    <div className={`${style.ticketTile} ${ticket === context?.ticketData ? style.highlight : ""}`} onClick={highlightTicket}>
      <div className={style.startBox}>
        <div className={style.ticketTitle}>{ticket?.fields?.summary}</div>
        <div className={style.ticketKey}>
          <img src={ticket?.fields?.issuetype?.iconUrl} className={style.issueTypeIcon}/>
          <p className={style.ticketNumber}>{ticket?.key}</p>
        </div>
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