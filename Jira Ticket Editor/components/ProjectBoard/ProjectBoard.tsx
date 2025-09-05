
// Import styles
import styles from "./ProjectBoard.module.scss";

// External Imports
import { useEffect, useRef, useState } from "react";

// Internal Imports
import { ExtendedProjectInterface } from "../../interfaces/ExtendedProjectInterface";
import request from "../../lib/NoExceptRequestLib";
import TicketCreator from "../TicketCreator/TicketCreator";
import TicketTile from "../TicketTile/TicketTile";
import { IssueInterface, IssueResponseInterface } from "@/interfaces/IssueInterface";
import { getVisibleFields } from "@/lib/FieldBlacklistLib";


export default function ProjectBoard({selectedProject}: {selectedProject: string | null}){

  // State Values
  const [projectData, setProjectData] = useState<ExtendedProjectInterface | null>(null);
  const [issues, setIssues] = useState<IssueInterface[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [color, setColor] = useState<string>("rgba(0, 0, 0, 0)");

  // Refs
  const parentRef = useRef<HTMLDivElement | null>(null);
  const loadDiv = useRef<HTMLDivElement | null>(null);
  const requestToken = useRef<number>(0);
  const abortRef = useRef<AbortController | null>(null);



  ///////////////////////////////////////////////////////////////////////////////
  //////////////////////////////// API Functions ////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////



  /**
   * This function retrieves the valid options for the dropdown
   * 
   * @param overrideToken An indicator that the requirement for a "nextPageToken" should
   * be ignored.
   */
  async function getIssues(projectID: string | null, overrideToken: boolean = false){

    // Early exit
    if((!overrideToken && nextPageToken === "") || projectID === null){
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
      "jql": `project=${projectID} AND NOT (status = "Closed" or status = "Closed Lost" or status = "Closed won" or status = "Resolved" or status = "Done" or status = "DONE (IN PROD)" or status = "DONE (IN UAT)" or status = Completed or status = Canceled) AND issuetype NOT IN subTaskIssueTypes() order by id desc`,
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

      // Set the next requests starting position
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



  /**
   * This function retrieves the ticket data
   */
  async function addIssue(issueID: string){

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
    }
  }



  /**
   * This function retrieves all the relevant project data.
   */
  async function fetchProjectData(projectID: string){

    // URL Params
    const url: URL = new URL("/proxy-api", window.location.origin);
    url.searchParams.append("pathname", `/project/${projectID}`);
    url.searchParams.append("elevate", "true");

    // User request
    const response = await request(
      url.toString(),
      {
        method: "GET",
      }
    );

    // Process response
    let projectData: ExtendedProjectInterface | null = null;

    if(response?.status.toString().startsWith("2")){
      projectData = (await response?.json()) as ExtendedProjectInterface;
    }
    
    setProjectData(projectData);
  }



  ///////////////////////////////////////////////////////////////////////////////
  /////////////////////////////// Helper Functions //////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////


  /**
   * This function ensures that the color is always dark enough for white to contrast
   * well against it.
   * 
   * @param r Red pixel component
   * 
   * @param g Green pixel component
   * 
   * @param b Blue pixel component
   * 
   * @param minLuminance The minimum luminance
   * 
   * @returns A corrected color;
   */
  function darkenColor(r: number, g: number, b: number, maxLuminance: number = 0.45) {

    const lum = 0.2126*(r/255) + 0.7152*(g/255) + 0.0722*(b/255);

    if(lum > maxLuminance) {

      // Calculate percentage scaling equivalent to: 1 - ((lum / maxLuminance) - 1)
      const scale = 2 - (lum / maxLuminance);

      r = Math.floor(r * scale);
      g = Math.floor(g * scale);
      b = Math.floor(b * scale);
    }

    return [r, g, b];
  }


  /**
   * This function is used to detect excessively yellow colors.
   * 
   * @param r Red pixel component
   * 
   * @param g Green pixel component
   * 
   * @param b Blue pixel component
   * 
   * @returns Boolean true of false if detected.
   */
  function isTooYellow(r: number, g: number, b: number): boolean {
    return r > 100 && g > 100 && b < 80;
  }


  /**
   * This function is used to reduce yellowness.
   * 
   * @param r Red pixel component
   * 
   * @param g Green pixel component
   * 
   * @param b Blue pixel component
   * 
   * @returns Shifted colors
   */
  function shiftYellow(r: number, g: number, b: number): Array<number> {
    return [r, Math.floor(g * 0.6), Math.floor(b * 0.3)];
  }



  ///////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////// Callbacks //////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////



  /**
   * This function is used to detect if insufficient dropdown options are visible and load more.
   * 
   * @param loader The element used to trigger loading - if visible
   * 
   * @param parentContainer The parent element used to detect if the "loader" is visible
   * 
   * @param getOptions The function being used to retrieve the dropdown options
   * 
   * @param overrideToken A boolean indicator
   */
  function checkIfLoaderVisibleAndFetch(loader: HTMLDivElement | null, parentContainer: HTMLDivElement | null, getOptions: (projectID: string | null, overrideToken?: boolean) => Promise<void>, overrideToken: boolean = false) {

    // Early exit
    if (!loader || !parentContainer){
      return;
    }

    const loaderRect = loader.getBoundingClientRect();
    const parentRect = parentContainer.getBoundingClientRect();

    // Check if loader is visible inside parent container
    const visibleInParent =
      loaderRect.top <= parentRect.bottom &&
      loaderRect.bottom >= parentRect.top;

    // Check if loader is visible inside viewport
    const visibleInViewport =
      loaderRect.top <= window.innerHeight &&
      loaderRect.bottom >= 0 &&
      loaderRect.left <= window.innerWidth &&
      loaderRect.right >= 0;

    if(visibleInParent && visibleInViewport){
      getOptions(selectedProject, overrideToken);
    }
  }



  ///////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////// Effects ///////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////


  /**
   * This retrieves the project data
   */
  useEffect(() => {

    if(selectedProject){
      setIssues([]);
      setNextPageToken(null);
      fetchProjectData(selectedProject);
      getIssues(selectedProject, false);
    }else{
      setNextPageToken("");
    }

  }, [selectedProject]);


  /**
   * Load project color
   */
  useEffect(() => {
    
    const image: HTMLImageElement = document.createElement("img");
    image.crossOrigin = "anonymous"
    image.src = projectData?.avatarUrls?.["48x48"] ?? "./../Transparent.png";
    const canvas: HTMLCanvasElement = document.createElement("canvas");
    const context: CanvasRenderingContext2D | null = canvas.getContext("2d");
    
    image.onload = () => {

      if(context){

        context.drawImage(image, 0, 0);

        const x_step: number = Math.floor(image.width / 6);
        const y_step: number = Math.floor(image.height / 6);

        const pixels = context.getImageData(0, 0, image.width, image.height).data;
        const pixelAggregate: Array<number> = [0, 0, 0, 0];
        let count: number = 0;

        for(let i=1; i<6; i++){
          for(let j=1; j<6; j++){
            pixelAggregate[0] += pixels[i*x_step*4 + 0 + j*y_step*image.width*4];
            pixelAggregate[1] += pixels[i*x_step*4 + 1 + j*y_step*image.width*4];
            pixelAggregate[2] += pixels[i*x_step*4 + 2 + j*y_step*image.width*4];
            pixelAggregate[3] += pixels[i*x_step*4 + 3 + j*y_step*image.width*4];
            count++;
          }
        }

        // Corrected colors
        let correctedColors: Array<number> = [Math.floor(pixelAggregate[0]/count), Math.floor(pixelAggregate[1]/count), Math.floor(pixelAggregate[2]/count)];
        
        // Correct yellow
        if(isTooYellow(correctedColors[0], correctedColors[1], correctedColors[2])){
          correctedColors = shiftYellow(correctedColors[0], correctedColors[1], correctedColors[1]);
        }

        // Correct for luminance
        correctedColors = darkenColor(correctedColors[0], correctedColors[1], correctedColors[2]);
        
        setColor(`rgba(${correctedColors[0]}, ${correctedColors[1]}, ${correctedColors[2]}, ${((pixelAggregate[3]/count)/255).toFixed(2)})`);
      }
      
    }

  }, [projectData]);



  /**
   * This function ensures that sufficient issues are loaded.
   */
  useEffect(() => {
    
    checkIfLoaderVisibleAndFetch(loadDiv.current, parentRef.current, getIssues, false);

  }, [nextPageToken]);



  return (
    <div 
      className={styles.projectBoard}
      onScroll={() => {
        checkIfLoaderVisibleAndFetch(loadDiv.current, parentRef.current, getIssues, false);
      }}>
      <div className={styles.titleSection} style={{backgroundColor: color}}>
        <h1>{projectData?.name}</h1>
      </div>
      <div className={styles.ticketSection} style={{backgroundImage: `linear-gradient(to bottom, ${color} 0%, ${color} 150px, rgba(102,102,102,0) 300px)`}}>
        <TicketCreator className={styles.create} projectID={selectedProject ?? undefined} issueTypes={projectData?.issueTypes ?? []} subTask={false} addIssue={addIssue}/>
        <div className={styles.boardWrapper}>
          <div 
            className={styles.ticketBoard}
            ref={parentRef}>
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
                (issues.length === 0 && nextPageToken === "") && (
                  <div className={styles.disabledTicketTile}>
                      No issues found
                  </div>
                )
              }
          </div>
        </div>
      </div>
    </div>
  )
}
