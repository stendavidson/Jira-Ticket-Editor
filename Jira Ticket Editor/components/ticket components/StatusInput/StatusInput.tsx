// Import styles
import styles from "./StatusInput.module.scss";

// External imports
import { useContext, useEffect, useRef, useState } from "react";

// Internal imports
import { StatusInterface, TransitionInterface, TransitionsResponseInterface} from "./StatusInterface";
import request from "@/lib/nothrow_request";
import { TicketContext } from "@/contexts/TicketContext";


export default function StatusInput({ issueID, defaultValue }: { issueID: string, defaultValue: StatusInterface }){

  const [status, setStatusInput] = useState<StatusInterface>(defaultValue);
  const [permittedValues, setPermittedValues] = useState<TransitionInterface[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const context = useContext(TicketContext);

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

  
  async function getTransitions(){
    
    // URL Params
    const url: URL = new URL("/proxy-api", window.location.origin);
    url.searchParams.append("pathname", `/issue/${issueID}/transitions`);
    url.searchParams.append("elevate", "true");

    // GET Request
    const response = await request(
      url.toString(),
      {
        method: "GET"
      }
    );

    // Process response
    let transitionsResponse: TransitionsResponseInterface | undefined;
    let transitions: TransitionInterface[] = [];

    if(response?.status.toString().startsWith("2")){
      transitionsResponse = (await response?.json()) as TransitionsResponseInterface;
      transitions = transitionsResponse.transitions;
    }

    setPermittedValues(transitions);
  }


  // Get valid options
  useEffect(() => {
    getTransitions();
  }, [])


  /**
   * This function updates the issue's type
   * 
   * @param status The new issue type
   * 
   * @returns The success of the POST request
   */
  async function updateStatusInput(transition: TransitionInterface): Promise<boolean>{

    // URL Params
    const url: URL = new URL("/proxy-api", window.location.origin);
    url.searchParams.append("pathname", `/issue/${issueID}/transitions`);
    url.searchParams.append("elevate", "true");

    // PUT Request Body
    const body: any = {
      transition: {
        id: transition.id
      }
    }

    // User request
    const response = await request(
      url.toString(),
      {
        method: "POST",
        body: JSON.stringify(body)
      }
    );

    return response?.status.toString().startsWith("2") ? true : false;
  }


  /**
   * This handles the selection 
   * 
   * @param value The Issue Type data
   */
  function select(value: TransitionInterface){

    // Upon successfully updating the issue type update the UI
    updateStatusInput(value).then((success: boolean) => {
      if(success){
        setStatusInput(value.to);
        context?.setUpdateIndicator(issueID);
      }
    })

    // Hide Dropdown regardless
    setShowDropdown(prev => !prev);
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
    <div className={styles.statusEditor} ref={ref}>
      <div className={styles.statusButton} style={{backgroundColor: getColorRGBA(status.statusCategory.colorName)}} onClick={() => {setShowDropdown(prev => !prev)}}>
        <p className={styles.statusName}>{status.name}</p>
      </div>
      <div className={`${styles.statusDropdown} ${showDropdown ? styles.displayDropdown : ""}`}>
        {permittedValues.map((transition: TransitionInterface) => (
            <div className={styles.statusOption} onClick={() => {select(transition)}} key={transition.id}>
              <p className={styles.statusName} style={{backgroundColor: getColorRGBA(transition.to.statusCategory.colorName)}}>{transition.name}</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}