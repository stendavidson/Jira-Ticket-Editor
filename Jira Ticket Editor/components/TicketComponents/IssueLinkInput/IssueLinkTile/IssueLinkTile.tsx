// Style imports
import styles from "./IssueLinkTile.module.scss";

// Internal Imports
import { IssueLinkInterface } from "../IssueLinkInterface";
import request from "@/lib/NoExceptRequestLib";


export default function IssueLinkTile({issueLink, deleteIssueLink}: {issueLink?: IssueLinkInterface, deleteIssueLink: (directionLabel: string, linkID: string) => void}){



  ///////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////// API Calls ////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////

  
  /**
   * This function deletes an existing issue link attached to the current issue.
   * 
   * @returns The success of the API call.
   */
  async function removeIssueLink(): Promise<boolean>{

    // URL Params
    const url = new URL("/proxy-api", window.location.origin);
    url.searchParams.append("pathname", `/issueLink/${issueLink!.id}`);
    url.searchParams.append("elevate", "true");

    // Update Request
    const response = await request(url.toString(), {
      method: "DELETE"
    });

    return response?.status.toString().startsWith("2") ?? false;
  }


  ///////////////////////////////////////////////////////////////////////////////
  //////////////////////////////// Helper Functions /////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////



  /**
   * This function converts Jira color names into rgba.
   * 
   * @param color Jira "color" name
   * 
   * @returns The color in rgba format.
   */
  function getColorRGBA(color: string){

    let returnColor: string = "rgba(255, 255, 255, 0.15)";

    if(color.toLowerCase() === "green"){
      returnColor = "rgba(0, 255, 34, 0.15)";
    }else if(color.toLowerCase() === "yellow"){
      returnColor = "rgba(255, 251, 0, 0.15)";
    }else if(color.toLowerCase() === "blue-gray" || color.toLowerCase() === "blue"){
      returnColor = "rgba(0, 123, 255, 0.3)";
    }else if(color.toLowerCase() === "red"){
      returnColor = "rgba(255, 0, 0, 0.15)";
    }

    return returnColor
  }



  ///////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////// Callbacks ////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////
  


  /**
   * This handler function removes an Issue Link.
   * 
   * @param issueLink The Issue Link to be removed.
   */
  function deleteLink(issueLink: IssueLinkInterface){

    removeIssueLink().then((success: boolean) => {
      if(success){
        deleteIssueLink((issueLink.inwardIssue ? issueLink.type.outward : issueLink.type.inward), issueLink.id);
      }
    })
    
  }
  


  return issueLink ? (
    issueLink.inwardIssue === undefined ? (
      <div className={styles.linkTile}>
        <div className={styles.startBox}>
          <img
            className={styles.icon}
            src={issueLink.outwardIssue!.fields.issuetype.iconUrl}
            alt="Issue type"
          />
          <h1 className={styles.text}>
            {`${issueLink.outwardIssue!.key} ${issueLink.outwardIssue!.fields.summary}`}
          </h1>
        </div>
        <div className={styles.endBox}>
          <div className={styles.status} style={{backgroundColor: getColorRGBA(issueLink.outwardIssue!.fields.status.statusCategory.colorName)}}>
            {issueLink.outwardIssue!.fields.status.name}
          </div>
          <img
            className={styles.icon}
            src={issueLink.outwardIssue!.fields.priority.iconUrl}
            alt="Status"
          />
          <button className={styles.deleteButton} onClick={() => {deleteLink(issueLink)}} type="button">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <line x1="1" y1="1" x2="15" y2="15" stroke="#ADADAD" strokeWidth="2" />
              <line x1="15" y1="1" x2="1" y2="15" stroke="#ADADAD" strokeWidth="2" />
            </svg>
          </button>
        </div>
      </div>
    ) : (
      <div className={styles.linkTile}>
        <div className={styles.startBox}>
          <img
            className={styles.icon}
            src={issueLink.inwardIssue!.fields.issuetype.iconUrl}
            alt="Issue type"
          />
          <h1 className={styles.text}>
            {`${issueLink.inwardIssue!.key} ${issueLink.inwardIssue!.fields.summary}`}
          </h1>
        </div>
        <div className={styles.endBox}>
          <div className={styles.status} style={{backgroundColor: getColorRGBA(issueLink.inwardIssue!.fields.status.statusCategory.colorName)}}>
            {issueLink.inwardIssue!.fields.status.name}
          </div>
          <img
            className={styles.icon}
            src={issueLink.inwardIssue!.fields.priority.iconUrl}
            alt="Status"
          />
          <button className={styles.deleteButton} onClick={() => {deleteLink(issueLink)}} type="button">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <line x1="1" y1="1" x2="15" y2="15" stroke="#ADADAD" strokeWidth="2" />
              <line x1="15" y1="1" x2="1" y2="15" stroke="#ADADAD" strokeWidth="2" />
            </svg>
          </button>
        </div>
      </div>
    )
  )
  : 
  (
    <div className={styles.linkTile}></div>
  );
}
