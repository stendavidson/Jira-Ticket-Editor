// Import styles
import styles from "./TicketSearchBoard.module.scss";

// External Imports
import { useContext, useEffect, useRef, useState } from "react";

// Internal Imports
import request from "../../lib/NoExceptRequestLib";
import TicketTile from "../TicketTile/TicketTile";
import { IssueInterface, IssueResponseInterface } from "@/interfaces/IssueInterface";
import { getVisibleFields } from "@/lib/FieldBlacklistLib";
import { checkIfLoaderVisibleAndFetch } from "@/lib/DropdownLib";
import { UserContext } from "@/contexts/UserContext";


const jql = `AND NOT (status = "Closed" or status = "Closed Lost" or status = "Closed won" or status = "Resolved" or status = "Done" or status = "DONE (IN PROD)" or status = "DONE (IN UAT)" or status = Completed or status = Canceled)`


export default function ProjectBoard() {  

  // State Values
  const [inputValue, setInputValue] = useState<string>("");
  const [issues, setIssues] = useState<IssueInterface[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);

  // Refs
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const parentRef = useRef<HTMLDivElement | null>(null);
  const loadDiv = useRef<HTMLDivElement | null>(null);
  const requestToken = useRef<number>(0);
  const abortRef = useRef<AbortController | null>(null);

  // Contexts
  const userContext = useContext(UserContext);



  ///////////////////////////////////////////////////////////////////////////////
  //////////////////////////////// API Functions ////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////



  /**
   * This function retrieves the valid options for the dropdown
   * 
   * @param textInput The user's input
   * 
   * @param overrideToken An indicator that the requirement for a "nextPageToken" should be ignored.
   */
  async function getIssues(textInput: string, overrideToken: boolean = false){

    // Early exit
    if((!overrideToken && nextPageToken === "") || !userContext?.userData){
      return;
    }

    // Max results
    const maxResults = 50;

    // Set request token
    requestToken.current++;
    const token = requestToken.current;
    
    // Abort previous request
    abortRef.current?.abort();

    // Create new AbortController to exit early if necessary
    const abortController = new AbortController();
    abortRef.current = abortController;

    // Post Body
    const postBody: any = {
      "fields": ["*all"],
      "jql": replaceCurrentUser(textInput),
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
        body: JSON.stringify(postBody),
        signal: abortController.signal
      }
    ); 

    // If the request was aborted exit early
    if (!response){
      setNextPageToken("");
      return;
    }

    // Process response
    let issueResponse: IssueResponseInterface | null = null;
    let options: IssueInterface[] = [];

    if(response?.status.toString().startsWith("2")){

      issueResponse = (await response?.json()) as IssueResponseInterface;
      options = issueResponse.issues.filter((newValue: IssueInterface) => !issues.some((oldValue: IssueInterface) => newValue.id === oldValue.id));
      options = options.map((value: IssueInterface) => getVisibleFields(value));

      // Set the next requests' starting position
      if(!issueResponse.isLast){
        setNextPageToken(issueResponse.nextPageToken!);
      }else{
        setNextPageToken("");
      }
    }

    // If the request is out of date exit.
    if (token !== requestToken.current){
      return;
    }

    // Set permitted values or recurse
    setIssues(prev => [...prev, ...options]);
  }



  ///////////////////////////////////////////////////////////////////////////////
  /////////////////////////////// Helper Functions //////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////


  /**
   * This function replaces he keyword currentUser() is replaced with the appropriate account ID
   * 
   * @param jql The JQL query wherein the keyword currentUser() is replaced with the appropriate 
   * account ID.
   */
  function replaceCurrentUser(jql: string): string {
    return jql.toLowerCase().replaceAll("currentuser()", userContext!.userData!.accountId);
  }



  ///////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////// Effects ///////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////



  /**
   * This sets the initial dimensions of the input text area
   */
  useEffect(() => {

    const el = inputRef.current;

    if (!el){ 
      return;
    }

    const resize = () => {
      el.style.height = "max(1.8vh, 18px)";
      el.style.height = `max(${(el.scrollHeight - 15) / 10}vh, ${el.scrollHeight - 15}px)`;
    };

    resize(); // trigger resize on mount

    const observer = new ResizeObserver(resize);
    observer.observe(el);

    return () => observer.disconnect();

  }, []);


  /**
   * This loads the initial set of tickets
   */
  useEffect(() => {

    if(userContext?.userData){
      setInputValue(`assignee=currentUser() ${jql}`);
      getIssues(`assignee=currentUser() ${jql}`, false);
    }
    
  }, [userContext?.userData]);


  /**
   * This function ensures that sufficient issues are loaded.
   */
  useEffect(() => {
    
    checkIfLoaderVisibleAndFetch(loadDiv.current, parentRef.current, true, inputValue, getIssues, false);

  }, [nextPageToken]);



  return (
    <div 
      className={styles.ticketSearchBoard}
      onScroll={() => {
        checkIfLoaderVisibleAndFetch(loadDiv.current, parentRef.current, true, inputValue, getIssues, false);
      }}
      ref={parentRef}>
      <div className={styles.titleSection}>
        <h1>Your Work</h1>
      </div>
      <div className={styles.ticketSection}>
        <div className={styles.boardWrapper}>
          <div className={styles.ticketBoard}>
            <textarea
              onInput={(ev: React.ChangeEvent<HTMLTextAreaElement>) => {
                setNextPageToken(null);
                setInputValue(ev.target.value);
                getIssues(ev.target.value, true);
              }}
              placeholder="Ticket Search JQL..."
              ref={inputRef}
              value={inputValue}
            />
            {
              issues.map((value: IssueInterface) => {
                return (
                  <TicketTile key={value.id} issue={value}/>
                );
              })
            }
            {(nextPageToken !== "") ? (
                <div 
                  className={styles.disabledTicketTile}
                  ref={loadDiv}>
                    Loading...
                </div>
              )
            :
              (issues.length === 0 && (
                <div className={styles.disabledTicketTile}>
                    No issues found
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}
