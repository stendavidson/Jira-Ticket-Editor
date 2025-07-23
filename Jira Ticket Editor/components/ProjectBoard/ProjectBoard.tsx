
// Import styles
import style from "./ProjectBoard.module.scss";

// External Imports
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ExtendedProjectInterface } from "../../interfaces/ExtendedProjectInterface";
import request from "../../lib/nothrow_request";
import IDListInterface from "@/interfaces/IDListInterface";
import TicketTile from "../TicketTile/TicketTile";
import TicketCreator from "../TicketCreator/TicketCreator";


export default function ProjectBoard(){

  const searchParams = useSearchParams();
  const [projectData, setProjectData] = useState<ExtendedProjectInterface|null>(null);
  const [ticketIDs, setTicketIDs] = useState<{id : string}[]>([]);
  
  useEffect(() => {

    if(!searchParams.has("project-id")){
      return;
    }

    async function fetchProjectData(){

      let projectData: ExtendedProjectInterface | null = null;

      // URL Params
      const url: URL = new URL("/proxy-api", window.location.origin);
      url.searchParams.append("pathname", `/project/${searchParams.get("project-id")}`);
      url.searchParams.append("elevate", "true");

      // User request
      const response = await request(
        url.toString(),
        {
          method: "GET",
        }
      );

      if(response?.status.toString().startsWith("2")){
        projectData = await response?.json();
      }
      
      setProjectData(projectData);
    }

    fetchProjectData();

  }, [searchParams]);


  useEffect(() => {

    async function fetchTicketIDs(){

      let IDList: IDListInterface | null = null;
      let IDs: {id : string}[] = []

      // URL Params
      const url: URL = new URL("/proxy-api", window.location.origin);
      url.searchParams.append("pathname", "/search/jql");
      url.searchParams.append("elevate", "true");

      // Post Body
      const postBody = {
        "fields": ["id"],
        "jql": `project=${projectData?.id} AND NOT (status = "Closed" or status = "Closed Lost" or status = "Closed won" or status = "Resolved" or status = "Done" or status = "DONE (IN PROD)" or status = "DONE (IN UAT)" or status = Completed or status = Canceled) AND issuetype NOT IN subTaskIssueTypes() order by id desc`
      }

      // User request
      const response = await request(
        url.toString(),
        {
          method: "POST",
          body: JSON.stringify(postBody),
        }
      );

      if(response?.status.toString().startsWith("2")){
        IDList = await response?.json();
        IDs = IDList?.issues ? IDList?.issues : [];
      }
      
      setTicketIDs(IDs);
    }

    fetchTicketIDs();

  }, [projectData]);


  return (
    <div className={style.projectBoard}>
      <div className={style.titleSection}>
        <h1>{projectData?.name}</h1>
      </div>
      <div className={style.ticketSection}>
        <TicketCreator className={style.create} projectID={projectData?.id} issueTypes={projectData?.issueTypes ?? []} ticketIDs={ticketIDs} setTicketIDs={setTicketIDs}/>
        <div className={style.boardWrapper}>
          <div className={style.ticketBoard}>
            {ticketIDs.length === 0 ? 
              (
                <TicketTile/>
              ) 
            :
              ticketIDs.map((value: {id: string}) => {
                return (
                  <TicketTile ticketID={value.id} key={value.id}/>
                )
              })
            }
          </div>
        </div>
      </div>
    </div>
  )
}