
// Import styles
import styles from "./IssueLinkInput.module.scss";

// External imports
import { useCallback, useContext, useEffect, useState } from "react";

// Internal imports
import IssueInput from "./IssueInput/IssueInput";
import { IssueInterface } from "./IssueInput/IssueInterface";
import IssueLinkTypeInput from "./IssueLinkTypeInput/IssueLinkTypeInput";
import { SimplifiedIssueLinkTypeInterface } from "./IssueLinkTypeInput/IssueLinkTypesInterface";
import request from "@/lib/NoExceptRequestLib";
import { IssueLinkInterface, LimitedIssueInterface } from "./IssueLinkInterface";
import IssueLinkTile from "./IssueLinkTile/IssueLinkTile";
import React from "react";
import { TicketContext } from "@/contexts/TicketContext";




export default function IssueLinkInput({className, issueID, projectID, defaultValues = []}: {className?: string, issueID: string, projectID: string, defaultValues?: IssueLinkInterface[]}){

  // State values
  const [linkedIssue, setLinkedIssue] = useState<IssueInterface | null>(null);
  const [linkType, setLinkType] = useState<SimplifiedIssueLinkTypeInterface | null>(null);
  const [issueLinks, setIssueLinks] = useState<IssueLinkInterface[]>([]);
  const [issueLinksMapped, setIssueLinksMapped] = useState<Map<string,IssueLinkInterface[]>>(new Map<string,IssueLinkInterface[]>());

  // Context(s)
  const context = useContext(TicketContext);



  /////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////// API Calls //////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////



  async function getIssueLinks(){

    // URL Params
    const url: URL = new URL("/proxy-api", window.location.origin);
    url.searchParams.append("pathname", `/issue/${issueID}`);
    url.searchParams.append("fields", "issuelinks");
    url.searchParams.append("elevate", "true");

    // User request
    const response = await request(
      url.toString(),
      {
        method: "GET",
      }
    );

    // Process responses
    let issueData: LimitedIssueInterface | null = null;
    let links: IssueLinkInterface[] = [];

    if(response?.status.toString().startsWith("2")){
      issueData = (await response?.json()) as LimitedIssueInterface;
      links = issueData.fields.issuelinks.filter((newValue: IssueLinkInterface) => {
        return !issueLinks.some((oldValue: IssueLinkInterface) => newValue.id === oldValue.id)
      });
    }

    setIssueLinks(links);
    updateLinkMap(links);
  }


  /**
   * This function creates a new issue link attached to the current issue.
   * 
   * @returns The success of the API call.
   */
  async function createIssueLink(): Promise<boolean>{

    // URL Params
    const url = new URL("/proxy-api", window.location.origin);
    url.searchParams.append("pathname", `/issueLink`);
    url.searchParams.append("elevate", "true");

    // PUT Request body
    let body: any;
    
    if (linkType!.direction === 1) {

      // A blocks B
      body = {
        type: { 
          name: linkType?.type
        },
        outwardIssue: { 
          id: issueID
        },
        inwardIssue: { 
         id: linkedIssue?.id
        }
      };

  } else {

    // A is blocked by B
    body = {
      type: { 
          name: linkType?.type
        },
        outwardIssue: { 
          id: linkedIssue?.id
        },
        inwardIssue: { 
         id: issueID
        }
    };
  }

    // Update Request
    const response = await request(url.toString(), {
      method: "POST",
      body: JSON.stringify(body),
    });

    return response?.status.toString().startsWith("2") ?? false;
  }


  
  /////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////// Helper Functions ///////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////


  /**
   * This function maps out issue links according to the manner in which they related
   * to the current issue.
   * 
   * @param links The set of issue links to map
   */
  function updateLinkMap(links: IssueLinkInterface[]) {
    // Clone the current map to avoid mutation issues
    const newMap = new Map(issueLinksMapped);

    for (const link of links) {

      const directionLabel = link.inwardIssue ? link.type.outward : link.type.inward;

      if (!newMap.has(directionLabel)) {
        newMap.set(directionLabel, []);
      }

      newMap.get(directionLabel)!.push(link);
    }

    // Set new map state to trigger re-render
    setIssueLinksMapped(newMap);
  }



  /////////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////// Callbacks //////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////


  
  /**
   * This function creates a new issue link and updates the existing set of links
   * if the request was successful.
   */
  function create(){

    createIssueLink().then((success: boolean) => {
      if(success){
        getIssueLinks();
        context?.setUpdateIndicator(issueID);
      }
    })
  }


  /**
   * A complex set State to remove links
   */
  const handleLinkDeletion = useCallback((directionLabel: string, linkID: string) => {

    // Remove link from map
    setIssueLinks(prev => prev.filter((value: IssueLinkInterface) => value.id !== linkID));

    // Udpate the mapped links
    setIssueLinksMapped(prevMap => {
      const newMap = new Map(prevMap);

      if (newMap.has(directionLabel)) {
        newMap.set(
          directionLabel,
          newMap.get(directionLabel)!.filter((value: IssueLinkInterface) => value.id !== linkID)
        );
      }

      return newMap;
    });

    context?.setUpdateIndicator(issueID);

  }, [])


  /////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////// Effects ///////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////


  
  /**
   * Issue links are loaded
   */
  useEffect(() => {

    if(defaultValues.length > 0){
      setIssueLinks(defaultValues);
      updateLinkMap(defaultValues);
    }

  }, []);



  return (
    <div className={`${styles.fieldEditor} ${className ? className : ""}`}>
      <h1 className={styles.label}>Linked work items</h1>
      <div className={styles.inputFieldWrapper}>
        <IssueLinkTypeInput setLinkType={setLinkType} projectID={projectID}/>
        <IssueInput setLinkedIssue={setLinkedIssue}/>
        <button
          className={styles.createButton}
          type="button"
          onMouseDown={create}
          disabled={linkType === null || linkedIssue === null}>
          Link
        </button>
      </div>
      {
        Array.from(issueLinksMapped.keys().flatMap((key: string) => {
          if(issueLinksMapped.get(key)!.length > 0){
            return [(
              <React.Fragment key={key}>
                <h2 className={styles.linkLabel}>{key}</h2>
                <div className={styles.issueLinkBoard}>
                  {
                    issueLinksMapped.get(key)!.map((value: IssueLinkInterface) => {
                      return <IssueLinkTile issueLink={value} deleteIssueLink={handleLinkDeletion} key={value.id}/>
                    })
                  }
                </div>
              </React.Fragment>
            )];
          }else{
            return [];
          }
        }))
      }
    </div>
  );
}