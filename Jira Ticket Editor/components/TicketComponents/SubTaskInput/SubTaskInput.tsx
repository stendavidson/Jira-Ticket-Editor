// Import styles
import TicketTile from "@/components/TicketTile/TicketTile";
import styles from "./SubTaskInput.module.scss";

// External Imports
import { useContext, useEffect, useState } from "react";
import request from "@/lib/NoExceptRequestLib";

// Internal Imports
import { IssueInterface, IssueResponseInterface } from "@/interfaces/IssueInterface";
import { getVisibleFields } from "@/lib/FieldBlacklistLib";
import { TicketContext } from "@/contexts/TicketContext";
import TicketCreator from "@/components/TicketCreator/TicketCreator";
import IssueTypeInterface from "@/interfaces/IssueTypeInterface";




export default function SubTaskInput({className, issueID, projectID, subTasks = []}: {className?: string, issueID: string, projectID: string, subTasks: IssueInterface[]}){

  // State Values
  const [issueTypes, setIssueTypes] = useState<IssueTypeInterface[]>([]);
  const [issues, setIssues] = useState<IssueInterface[]>([]);

  // Contexts
  const context = useContext(TicketContext);


  ///////////////////////////////////////////////////////////////////////////////
  /////////////////////////////// API functions /////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////


  /**
   * This function retrives the valid options for the dropdown
   */
  async function getIssueTypes(){

    // URL Params
    const url: URL = new URL("/proxy-api", window.location.origin);
    url.searchParams.append("pathname", `/issuetype/project`);
    url.searchParams.append("elevate", "true");
    url.searchParams.append("projectId", projectID);
    url.searchParams.append("level", "-1");

    // GET request
    const response = await request(
      url.toString(),
      {
        method: "GET"
      }
    );

    // Process response
    let types: IssueTypeInterface[] = [];

    if(response?.status.toString().startsWith("2")){
      types = (await response.json()) as IssueTypeInterface[];
      setIssueTypes(types);
    }
  }


  /**
   * This function retrieves all the relevant subtasks
   */
  async function getSubtasks(nextPageToken?: string, subTasks: IssueInterface[] = []) {

    // Exit condition
    if(nextPageToken === ""){
      setIssues(subTasks);
      return;
    }

    let nextToken: string | undefined = nextPageToken;

    // Max results
    const maxResults: number = 50;

    // Post Body
    const postBody: any = {
      "fields": ["*all"],
      "jql": `parent=${issueID}`,
      "maxResults": maxResults.toString(),
      "expand": "editmeta"
    }

    if(nextPageToken){
      postBody["nextPageToken"] = nextPageToken;
    }
    
    // URL Params
    const url: URL = new URL("/proxy-api", window.location.origin);
    url.searchParams.append("pathname", `/search/jql`);
    url.searchParams.append("elevate", "true");

    // POST request
    const response = await request(
      url.toString(),
      {
        method: "POST",
        body: JSON.stringify(postBody)
      }
    );

    // Process response
    let issueResponse: IssueResponseInterface | null = null;
    let options: IssueInterface[] = [];

    if(response?.status.toString().startsWith("2")){

      issueResponse = (await response?.json()) as IssueResponseInterface;
      options = issueResponse.issues.filter((newValue: IssueInterface) => !issues.some((oldValue: IssueInterface) => newValue.id === oldValue.id));
      options = options.map((value: IssueInterface) => getVisibleFields(value));

      // Set the next requests starting position
      if(!issueResponse.isLast){
        nextToken = issueResponse.nextPageToken!;
      }else{
        nextToken = "";
      }
    }

    // Set permitted values or recurse
    subTasks = [...subTasks, ...options];
    
    // Recursive call
    return getSubtasks(nextToken, subTasks);
  }



  /**
   * This function retrieves the ticket data
   */
  async function getIssue(issueID: string){

    // URL Params
    const url: URL = new URL("/proxy-api", window.location.origin);
    url.searchParams.append("pathname", `/issue/${issueID}`);
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
    let issue: IssueInterface | null = null;

    if(response?.status.toString().startsWith("2")){
      issue = getVisibleFields(await response?.json());
    }

    // Add issue
    if(issue){
      setIssues(prev => [issue, ...prev]);
      context?.setUpdateIndicator(issueID);
    }
  }



  ///////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////// Effects ////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////


  /**
   * This effect retrieves the sub-tasks and subtask issue types
   */
  useEffect(() => {

    getSubtasks();
    getIssueTypes();

  }, []);



  return (
    <div className={`${styles.subTaskWrapper} ${className ? className : ""}`}>
      <h1 className={styles.label}>Child work items</h1>
      <div className={styles.ticketBoard}>
        {
          issues.map((value: IssueInterface) => {
            return (
              <TicketTile key={value.id} issue={value}/>
            )
          })
        }
      </div>
      <TicketCreator className={styles.create} projectID={projectID} issueTypes={issueTypes} addIssue={getIssue} subTask={true} parentID={issueID}/>
    </div>
  );
}