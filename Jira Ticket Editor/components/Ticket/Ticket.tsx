// Import styles
import styles from "./Ticket.module.scss";

// External imports
import { useContext, useEffect, useState } from "react";
import dynamic from 'next/dynamic';

// Internal Imports
import { TicketContext } from "@/contexts/TicketContext";
import IssueTypeInput from "../ticket components/IssueTypeInput/IssueTypeInput";
import PriorityInput from "../ticket components/PriorityInput/PriorityInput";
import TeamInput from "../ticket components/TeamInput/TeamInput";
import UserInput from "../ticket components/UserInput/UserInput";
import OptionInput from "../ticket components/OptionInput/OptionInput";
import UserArray from "../ticket components/UserArray/UserArray";
import SprintInput from "../ticket components/SprintInput/SprintInput";
import ParentInput from "../ticket components/ParentInput/ParentInput";
import StatusInput from "../ticket components/StatusInput/StatusInput";
import SentimentInput from "../ticket components/SentimentInput/SentimentInput";
import OptionArray from "../ticket components/OptionArray/OptionArray";
import LabelArray from "../ticket components/LabelArray/LabelArray";
import ShortTextInput from "../ticket components/ShortTextInput/ShortTextInput";
import NumberInput from "../ticket components/NumberInput/NumberInput";
import DateInput from "../ticket components/DateInput/DateInput";
import DateTimeInput from "../ticket components/DateTimeInput/DateTimeInput";
import { AttachmentInterface } from "@/interfaces/AttachementInterface";
import request from "@/lib/nothrow_request";
import { flushSync } from "react-dom";
const RichTextInput = dynamic(() => import('../ticket components/RichTextInput/RichTextInput'), { ssr: false });


function extractMediaUUID(url: string): string | null {
  const match = url.match(/\/file\/([0-9a-fA-F-]{36})\//);
  return match ? match[1] : null;
}


export default function Ticket(){

  const context = useContext(TicketContext);
  const [attachments, setAttachments] = useState<AttachmentInterface[]>([]);

  /**
   * 
   * @param attachments 
   */
  async function preloadAttachments(attachments: AttachmentInterface[]) {
    const updatedAttachments = [...attachments];

    const fetchPromises = updatedAttachments.map((attachment, i) => {
      if (!attachment.mimeType.includes("image")) return Promise.resolve();

      const controller = new AbortController();

      const url = new URL("/proxy-api", window.location.origin);
      url.searchParams.append("pathname", `/attachment/content/${attachment.id}`);

      return request(url.toString(), { method: "GET", signal: controller.signal }).then(response => {
        if (response?.status.toString().startsWith("2")) {
          const sourceURL = response.headers.get("origin-location");
          updatedAttachments[i].uuid = sourceURL ? extractMediaUUID(sourceURL) : null;
        }
        controller.abort();
      });
    });

    await Promise.all(fetchPromises);

    flushSync(() => {
      setAttachments(updatedAttachments);
    });
  }

  // Load
  useEffect(() => {

    if(context?.ticketData){
      preloadAttachments(context?.ticketData!.fields.attachment);
    }

  }, [context?.ticketData])

  return (
    context?.ticketData ? (
      <div className={styles.overlay}>
        <div className={styles.ticketBox}>
          <div className={styles.controlBar}>
            <div className={styles.issueKey}>
              <IssueTypeInput issueID={context.ticketData.id} defaultValue={context.ticketData.fields.issuetype} allowedValues={context.ticketData.editmeta.fields.issuetype.allowedValues}/>
              <p>{context.ticketData.key}</p>
            </div>
            <StatusInput issueID={context.ticketData!.id} defaultValue={context.ticketData!.fields["status"]}/>
            <button className={styles.closeButton} onClick={() => {context.setTicketData(null)}} type="button">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <line x1="1" y1="1" x2="15" y2="15" stroke="#ADADAD" strokeWidth="2" />
                <line x1="15" y1="1" x2="1" y2="15" stroke="#ADADAD" strokeWidth="2" />
              </svg>
            </button>
          </div>
          <div className={styles.mainContent}>
            <div className={styles.column1}>
            
            </div>
            <div className={styles.column2}>
              <div className={styles.details}>
                <h1 className={styles.title}>Details</h1>
                {
                  Object.keys({...context.ticketData.editmeta.fields, ...context.ticketData.fields}).map((key: string) => {
                    
                    // Potentially Editable Fields
                    if(context.ticketData!.editmeta.fields.hasOwnProperty(key)){
                      
                      if(context.ticketData!.editmeta.fields[key].schema.type === "priority"){
                        return <PriorityInput key={key} className={styles.adjustPosition} projectID={context.ticketData!.fields["project"].id} issueID={context.ticketData!.id} keyName={key} name={context.ticketData!.editmeta.fields[key].name} operations={context.ticketData!.editmeta.fields[key].operations} defaultValue={context.ticketData!.fields[key]} allowedValues={context.ticketData!.editmeta.fields[key].allowedValues}/>
                      }else if(context.ticketData!.editmeta.fields[key].name === "Parent"){
                        return <ParentInput key={key} className={styles.adjustPosition} projectID={context.ticketData!.fields["project"].id} issueID={context.ticketData!.id} keyName={key} name={context.ticketData!.editmeta.fields[key].name} operations={context.ticketData!.editmeta.fields[key].operations} issueType={context.ticketData!.fields["issuetype"]} defaultValue={context.ticketData!.fields[key]}/>
                      }else if(context.ticketData!.editmeta.fields[key].name === "Sprint"){
                        return <SprintInput key={key} className={styles.adjustPosition} projectID={context.ticketData!.fields["project"].id} issueID={context.ticketData!.id} keyName={key} name={context.ticketData!.editmeta.fields[key].name} operations={context.ticketData!.editmeta.fields[key].operations} defaultValue={context.ticketData!.fields[key]} allowedValues={context.ticketData!.editmeta.fields[key].allowedValues}/>
                      }else if(context.ticketData!.editmeta.fields[key].schema.type === "user"){
                        return <UserInput key={key} className={styles.adjustPosition} issueID={context.ticketData!.id} issueKey={context.ticketData!.key} keyName={key} name={context.ticketData!.editmeta.fields[key].name} operations={context.ticketData!.editmeta.fields[key].operations} defaultValue={context.ticketData!.fields[key]}/>
                      }else if(context.ticketData!.editmeta.fields[key].schema.type === "array" && context.ticketData!.editmeta.fields[key].schema.items === "user"){
                        return <UserArray key={key} className={styles.adjustPosition} issueID={context.ticketData!.id} issueKey={context.ticketData!.key} keyName={key} name={context.ticketData!.editmeta.fields[key].name} operations={context.ticketData!.editmeta.fields[key].operations} defaultValue={context.ticketData!.fields[key]}/>
                      }else if(context.ticketData!.editmeta.fields[key].name === "Labels"){
                        return <LabelArray key={key} className={styles.adjustPosition} issueID={context.ticketData!.id} keyName={key} name={context.ticketData!.editmeta.fields[key].name} operations={context.ticketData!.editmeta.fields[key].operations} defaultValue={context.ticketData!.fields[key]}/>
                      }else if(context.ticketData!.editmeta.fields[key].schema.type === "option"){
                        return <OptionInput key={key} className={styles.adjustPosition} issueID={context.ticketData!.id} keyName={key} name={context.ticketData!.editmeta.fields[key].name} operations={context.ticketData!.editmeta.fields[key].operations} defaultValue={context.ticketData!.fields[key]} allowedValues={context.ticketData!.editmeta.fields[key].allowedValues}/>
                      }else if(context.ticketData!.editmeta.fields[key].schema.type === "array" && context.ticketData!.editmeta.fields[key].schema.items === "option"){
                        return <OptionArray key={key} className={styles.adjustPosition} issueID={context.ticketData!.id} keyName={key} name={context.ticketData!.editmeta.fields[key].name} operations={context.ticketData!.editmeta.fields[key].operations} defaultValue={context.ticketData!.fields[key]} allowedValues={context.ticketData!.editmeta.fields[key].allowedValues}/>
                      }else if(context.ticketData!.editmeta.fields[key].schema.type === "team"){
                        return <TeamInput key={key} className={styles.adjustPosition} issueID={context.ticketData!.id} keyName={key} name={context.ticketData!.editmeta.fields[key].name} operations={context.ticketData!.editmeta.fields[key].operations} defaultValue={context.ticketData!.fields[key]} allowedValues={context.ticketData!.editmeta.fields[key].allowedValues}/>
                      }else if(context.ticketData!.editmeta.fields[key].schema.type === "array" && context.ticketData!.editmeta.fields[key].schema.items === "sd-sentiment"){
                        return <SentimentInput key={key} className={styles.adjustPosition} issueID={context.ticketData!.id} issueKey={context.ticketData!.key} keyName={key} name={context.ticketData!.editmeta.fields[key].name} operations={context.ticketData!.editmeta.fields[key].operations} defaultValue={context.ticketData!.fields[key]} allowedValues={context.ticketData!.editmeta.fields[key].allowedValues}/>
                      }else if(context.ticketData!.editmeta.fields[key].schema.type === "string" && context.ticketData!.editmeta.fields[key].schema.custom !== "com.atlassian.jira.plugin.system.customfieldtypes:textarea" && key !== "summary" && key !== "description" && key !== "environment"){
                        return <ShortTextInput key={key} className={styles.adjustPosition} issueID={context.ticketData!.id} keyName={key} name={context.ticketData!.editmeta.fields[key].name} operations={context.ticketData!.editmeta.fields[key].operations} defaultValue={context.ticketData!.fields[key] ?? ""}/>
                      }else if(context.ticketData!.editmeta.fields[key].schema.type === "string" && context.ticketData!.editmeta.fields[key].schema.custom === "com.atlassian.jira.plugin.system.customfieldtypes:textarea" && key !== "summary" && key !== "description" && key !== "environment"){
                        return <RichTextInput key={`${key}-${context.ticketData!.id}-${context.ticketData!.fields.updated}`} className={styles.adjustPosition} issueID={context.ticketData!.id} keyName={key} name={context.ticketData!.editmeta.fields[key].name} operations={context.ticketData!.editmeta.fields[key].operations} attachments={attachments} defaultValue={context.ticketData!.fields[key] ?? ""}/>
                      }else if(context.ticketData!.editmeta.fields[key].schema.type === "number"){
                        return <NumberInput key={key} className={styles.adjustPosition} issueID={context.ticketData!.id} keyName={key} name={context.ticketData!.editmeta.fields[key].name} operations={context.ticketData!.editmeta.fields[key].operations} defaultValue={context.ticketData!.fields[key] ?? ""}/>
                      }else if(context.ticketData!.editmeta.fields[key].schema.type === "date" || context.ticketData!.editmeta.fields[key].schema?.custom?.includes("com.atlassian.jira.ext.charting")){
                        return <DateInput key={key} className={styles.adjustPosition} issueID={context.ticketData!.id} keyName={key} name={context.ticketData!.editmeta.fields[key].name} custom={context.ticketData!.editmeta.fields[key].schema?.custom} operations={context.ticketData!.editmeta.fields[key].operations} defaultValue={context.ticketData!.fields[key] ?? ""}/>
                      }else if(context.ticketData!.editmeta.fields[key].schema.type === "datetime"){
                        return <DateTimeInput key={key} className={styles.adjustPosition} issueID={context.ticketData!.id} keyName={key} name={context.ticketData!.editmeta.fields[key].name} operations={context.ticketData!.editmeta.fields[key].operations} defaultValue={context.ticketData!.fields[key] ?? ""}/>
                      }else if(context.ticketData!.editmeta.fields[key].schema.type === "timetracking"){
                        return null//<TimeTrackingInput key={key} className={styles.adjustPosition} issueID={context.ticketData!.id} issueKey={context.ticketData!.key} keyName={key} name={context.ticketData!.editmeta.fields[key].name} operations={context.ticketData!.editmeta.fields[key].operations} defaultValue={context.ticketData!.fields[key]} allowedValues={context.ticketData!.editmeta.fields[key].allowedValues}/>
                      }

                    // Other Fields: seperate controls for editing, unique representations (e.g. progress bars), read-only data
                    }else{

                      if(typeof(context.ticketData!.fields["key"]) === "string"){
                        return null//<StringInput key={key} className={styles.adjustPosition} issueID={context.ticketData!.id} issueKey={context.ticketData!.key} keyName={key} name={toNameCase(key)} defaultValue={context.ticketData!.fields[key]}/>
                      }

                    }

                    return null;
                  })
                }
                
              </div>
            </div>
          </div>
        </div>
      </div>
    ) : (
      null
    )
  );
}