// Import styles
import styles from "./UserInput.module.scss";

// External imports
import { useContext, useEffect, useRef, useState } from "react";

// Internal imports
import request from "@/lib/nothrow_request";
import { TicketContext } from "@/contexts/TicketContext";
import UserInterface from "./TimeInputInterface";


export default function UserInput({ className, issueID, issueKey, keyName, name, operations, defaultValue, allowedValues = []}: { className?: string, issueID: string, issueKey: string, keyName: string, name: string, operations: string[], defaultValue: UserInterface, allowedValues: UserInterface[]}){

  const [user, setUser] = useState<UserInterface | null>(defaultValue);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [permittedValues, setPermittedValues] = useState<UserInterface[]>([]);
  const ref = useRef<HTMLDivElement | null>(null);
  const context = useContext(TicketContext);


  /**
   * This function retrives the valid options for the dropdown
   */
  async function getUsers(){
    // URL Params
    const url: URL = new URL("/proxy-api", window.location.origin);
    url.searchParams.append("pathname", `/user/assignable/search`);
    url.searchParams.append("issueKey", issueKey);

    // GET request
    const response = await request(
      url.toString(),
      {
        method: "GET"
      }
    );

    let options : UserInterface[] = [];

    if(response?.status.toString().startsWith("2")){
      options = (await response?.json()) as UserInterface[];
    }

    setPermittedValues(options);
  }


  // Load the priorities
  useEffect(() => {

    if(allowedValues.length !== 0){

      setPermittedValues(allowedValues);

    }else{
      
      getUsers();

    }    

  }, [])


  /**
   * This function updates the issue's type
   * 
   * @param user The new issue type
   * 
   * @returns The success of the PUT request
   */
  async function updateUser(option: UserInterface | null): Promise<boolean>{

    // URL Params
    const url: URL = new URL("/proxy-api", window.location.origin);
    url.searchParams.append("pathname", `/issue/${issueID}/assignee`);

    // PUT Request Body
    const body: any = {};
    body.accountId = option?.accountId ?? null;

    // User request
    const response = await request(
      url.toString(),
      {
        method: "PUT",
        body: JSON.stringify(body)
      }
    );

    return response?.status.toString().startsWith("2") ? true : false;
  }


  /**
   * This handles the selection 
   * 
   * @param option The Issue Type data
   */
  function select(option: UserInterface | null){

    // Hide Dropdown
    setShowDropdown(false);

    // Upon successfully updating the issue type update the UI
    updateUser(option).then((success: boolean) => {
      if(success){
        setUser(option);
        context?.setUpdateIndicator(issueID);
      }
    })
  }


  // Hide dropdown if click away occurs
  useEffect(() => {

    function handler(ev: MouseEvent){

      const target: HTMLDivElement = ev.target as HTMLDivElement;
      
      // Hide dropdown if click away occurs
      if(!ref.current?.contains(target)){
        setShowDropdown(false);
      }

    }

    document.addEventListener("mousedown", handler);

    return () => {
      document.removeEventListener("mousedown", handler);
    };
      
  }, [])



  return (
    <div className={`${styles.userEditor} ${className ? className : ""}`} ref={ref}>
      <h1 className={styles.label}>{name}</h1>
      <div className={styles.userButton} onClick={() => {setShowDropdown(prev => (operations.includes("set") && !prev))}}>
        { user ?
            <>
              <img src={user.avatarUrls["48x48"]} className={styles.userIcon}/>
              <p className={styles.userName}>{user.displayName}</p>
            </>
          :
            <>
              <img src="./../defaultAvatar.png" className={styles.userIcon}/>
              <p className={styles.userName}>Unassigned</p>
            </>
        }
        <div className={`${styles.usersDropdown} ${showDropdown ? styles.displayDropdown : ""}`}>
          {operations.includes("set") && (
            permittedValues.map((option: UserInterface) => (
              <div className={styles.userOption} onClick={(ev: React.MouseEvent<HTMLDivElement>) => {ev.stopPropagation(); select(option)}} key={option.accountId}>
                <img src={option.avatarUrls["48x48"]} className={styles.userIcon}/>
                <p className={styles.userName}>{option.displayName}</p>
              </div>
            ))
          )}
          <div className={styles.userOption} onClick={(ev: React.MouseEvent<HTMLDivElement>) => {ev.stopPropagation(); select(null)}}>
            <img src="./../defaultAvatar.png" className={styles.userIcon}/>
            <p className={styles.userName}>Unassigned</p>
          </div>
        </div>
      </div>
    </div>
  );
}