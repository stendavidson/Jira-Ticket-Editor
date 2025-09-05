// Style imports
import style from "./TicketTile.module.scss";

// External imports
import { useContext, useEffect, useRef, useState } from "react";

// Internal Imports
import request from "@/lib/NoExceptRequestLib";
import { TicketContext } from "@/contexts/TicketContext";
import { getVisibleFields } from "@/lib/FieldBlacklistLib";
import { IssueInterface } from "@/interfaces/IssueInterface";


export default function TicketTile({ issue, subtask = false }: { issue: IssueInterface, subtask?: boolean }){

  // State values
  const [ticket, setTicket] = useState<IssueInterface>(issue);

  // Refs
  const selectable = useRef<boolean>(!subtask);

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
    url.searchParams.append("pathname", `/issue/${issue.id}`);
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
    let ticketData: IssueInterface | null = null;

    if(response?.status.toString().startsWith("2")){
      ticketData = getVisibleFields(await response?.json());
    }

    if(ticketData){
      setTicket(ticketData);
    }
  }



  ///////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////// Callbacks //////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////



  /**
   * This function sets the ticket context data
   */
  function highlightTicket(){

    if(selectable){
      context?.setTicketData(null);

      setTimeout(() => {
        context?.setTicketData(ticket);
      }, 100);
    }
  }



  ///////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////// Effects ///////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////



  /**
   * If the issue is a subtask - the issue data will be insufficient and the ticket
   * will need to be loaded.
   */
  useEffect(() => {

    if(subtask){
      fetchTicket();
      selectable.current = true;
    }

  }, []);



  /**
   * The ticket data is re-loaded upon request from the ticket
   */
  useEffect(() => {
    
    if(context?.updateIndicator === issue.id){
      fetchTicket();
      context?.setUpdateIndicator(null);
    }
    
  }, [context?.updateIndicator]);



  return (
    <div className={`${style.ticketTile} ${ticket === context?.ticketData ? style.highlight : ""}`} onClick={highlightTicket}>
      <div className={style.startBox}>
        <div className={style.ticketTitle}>{ticket.fields.summary}</div>
        <div className={style.ticketKey}>
          <img 
            className={style.issueTypeIcon} 
            src={ticket.fields.issuetype?.iconUrl} 
            alt={`The ticket's issue type icon - ${ticket.fields.issuetype?.name ?? "Unknown"}`}/>
          <p className={style.ticketNumber}>{ticket.key}</p>
        </div>
      </div>
      <div className={style.endBox}>
        <img 
          className={style.priority}
          src={ticket.fields.priority?.iconUrl} 
          alt={`Ticket priority icon - ${ticket.fields.priority?.name ?? "Unknown"}`}/>
        <img 
          className={style.avatar} 
          src={ticket.fields.assignee?.avatarUrls?.["48x48"] ? ticket.fields?.assignee?.avatarUrls?.["48x48"] : "./../defaultAvatar.png"} 
          alt={`Ticket assignee's avatar - ${ticket.fields.assignee?.displayName ?? "Unassigned"}`}/>
      </div>
    </div>
  );
}