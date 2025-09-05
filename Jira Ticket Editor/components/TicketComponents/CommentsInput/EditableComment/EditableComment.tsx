
// Import styles
import styles from './EditableComment.module.scss';

// External imports
import React, { useContext, useEffect, useRef, useState } from 'react';
import ReactQuill from 'react-quill-new';


// Internal Imports
import { parseHTMLtoADF, stringToHTML, parseADFtoHTML } from "../../../../lib/QuillLib/ParserLib";
import request from '@/lib/NoExceptRequestLib';
import '@/lib/QuillLib/QuillCustomizations';
import { imageHandler } from '../../../../lib/QuillLib/QuillUtils';
import { CommentInterface } from '../CommentInterface';
import { UserContext } from '@/contexts/UserContext';
import { TicketContext } from '@/contexts/TicketContext';
import { AttachmentInterface } from '@/interfaces/AttachementInterface';
import { cleanUpAttachments } from '@/lib/AttachmentsLib';


/**
 * Toolbar configuration
 */
const fullToolbar = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  ['bold', 'italic', 'underline', 'strike', 'code'],
  [{ color: [] }],
  [{ script: 'sub' }, { script: 'super' }],
  [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
  ['link', 'image'],
  ['clean']
];


export default function EditableComment({ className, issueID, isServiceDesk, comment, attachments = [], removeComment}: { className?: string, issueID: string, isServiceDesk: boolean, comment: CommentInterface, attachments: AttachmentInterface[], removeComment: (comment: CommentInterface) => void}) {  

  // State values
  const [commentData, setCommentData] = useState<CommentInterface>(comment);
  const [inputValue, setInputValue] = useState<string>("");
  const [initialValue, setInitialValue] = useState<string>("");
  const [editable, setEditable] = useState<boolean>(false);
  const [focused, setFocused] = useState<boolean>(false);

  // Ref Values
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<ReactQuill | null>(null);
  const onBlurRef = useRef<boolean>(true);

  // Context(s)
  const ticketContext = useContext(TicketContext);
  const userContext = useContext(UserContext);


  ///////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////// API Calls //////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////



  /**
   * This function updates the comment via the Jira API.
   * 
   * @returns Returns the update's success status
   */
  async function updateComment(): Promise<CommentInterface | null>{

    // URL Params
    const url: URL = new URL("/proxy-api", window.location.origin);
    url.searchParams.append("pathname", `/issue/${issueID}/comment/${comment.id}`);
    url.searchParams.append("elevate", "true");

    // Request Body
    const body: any = {};
    body["body"] = {
      type: "doc",
      version: 1,
      content: parseHTMLtoADF(stringToHTML(inputValue))
    }

    if(isServiceDesk && comment.jsdPublic){
      body["properties"] = [
       {
         "key": "sd.public.comment",
         "value": {
           "internal": false
         }
       }
     ];
    }

    // Execute Request
    const response = await request(
      url.toString(),
      {
        method: "PUT",
        body: JSON.stringify(body)
      }
    );

    // Process responses
    let updatedComment: CommentInterface | null = null;

    if(response?.status.toString().startsWith("2")){
      updatedComment = (await response.json()) as CommentInterface;
    }

    return updatedComment;
  }


  /**
   * This function deletes the comment via the Jira API.
   * 
   * @returns Returns the deletion success status
   */
  async function deleteComment(): Promise<boolean>{
    
    // URL Params
    const url: URL = new URL("/proxy-api", window.location.origin);
    url.searchParams.append("pathname", `/issue/${issueID}/comment/${comment.id}`);
    url.searchParams.append("elevate", "true");

    // Execute Request
    const response = await request(
      url.toString(),
      {
        method: "DELETE"
      }
    );

    return (response?.status.toString().startsWith("2") ?? false);
  }



  ///////////////////////////////////////////////////////////////////////////////
  /////////////////////////////// Helper Functions //////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////




  /**
   * This function converts a raw datetime into a readable string.
   * 
   * @param dateString The input datetime string passed in from the comment
   * 
   * @returns A formatted natural language date/time string
   */
  function formatNaturalDateTime(dateString: string): string {

    // Regex to extract date & time components
    const match = dateString.match(
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?([+-]\d{2})(\d{2})$/
    );
    
    // Early exit
    if(!match){
      return "Incompatible date/time format";
    }

    // Components of the datetime input
    const [,
      year, month, day, hour, minute, second, tzHour, tzMinute
    ] = match;

    // Convert offset into standard format "+10:00"
    const isoString = `${year}-${month}-${day}T${hour}:${minute}:${second}${tzHour}:${tzMinute}`;

    // Create a Date — JS automatically converts to local time
    const date = new Date(isoString);

    const datePart = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    const timePart = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });

    return `${datePart} at ${timePart}`;
  }



  ///////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////// Callbacks //////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////



  /**
   * This callback is used to update comment.
   */
  function updateCommentHandler(){

    setEditable(false);

    updateComment().then((comment: CommentInterface | null) => {
      if(comment){
        setCommentData(comment);
        setInitialValue(inputValue);
        ticketContext?.setUpdateIndicator(issueID);
      }else{
        setInputValue(initialValue);
      }
    });
  }


  /**
   * This callback is used to delete a comment
   */
  function deleteCommentHandler(){

    setEditable(false);

    deleteComment().then((success: boolean) => {
      if(success){
        cleanUpAttachments(inputValue);
        deleteComment();
        removeComment(comment);
        ticketContext?.setUpdateIndicator(issueID);
      }
    });

    
  }



  ///////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////// Effects ///////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////



  /**
   * This effect loads ADF content and attachments
   */
  useEffect(() => {

    const quillHTML = parseADFtoHTML(comment.body.content, attachments);
    setInitialValue(quillHTML);
    setInputValue(quillHTML);

  }, [attachments, comment]);



  return (
    <div className={`${styles.fieldEditor} ${className ?? ''}`}>
      <div className={styles.fieldContainer}>
        
        {/* Custom "Author" label */}
        <div className={styles.userDetails}>
          <img 
            className={styles.avatar} 
            src={commentData?.author.avatarUrls?.["48x48"] ?? "./../../../defaultAvatar.png"} 
            alt={commentData?.author.displayName ?? ""}
            />
          <div className={styles.userLabel}>
            <h1 className={styles.name}>{commentData?.author.displayName ?? ""}</h1>
            <h2 className={styles.time}>{`${commentData?.created === commentData?.updated ? "Created" : "Updated"} ${commentData ? formatNaturalDateTime(commentData!.updated) : ""}`}</h2>
            {isServiceDesk && (
              <h3 className={styles.public}>{`${isServiceDesk && comment.jsdPublic ? "external" : "internal"}`}</h3>
            )}
          </div>
        </div>
        
         {/* "Comment" field */}
        <div
          className={`${"ql-editor"} ${styles.disabledField} ${editable ? styles.editable : ""}`}
          style={{ display: focused ? 'none' : 'block' }}
          onClick={() => {
            if(editable){ 
              setFocused(true);
              setTimeout(() => {
                fieldRef.current!.focus();
              }, 0);
            }
          }}
          dangerouslySetInnerHTML={{ __html: (inputValue !== "" && inputValue !== "<p><br></p>") ? inputValue : `<p class="${styles.placeholder}">Edit comment...</p>` }}
        />
        <div
          className={`${styles.inputTextField} ${focused ? styles.focused : ''}`}
          style={{ display: focused ? 'block' : 'none' }}
          tabIndex={-1}
          onBlur={(ev: React.FocusEvent<HTMLDivElement>) => {

            // Prevent "blur" when images are being added
            if (onBlurRef.current) {

              const nextFocused = ev.relatedTarget as Node | null;
              const currentNode = fieldRef.current;

              if (currentNode && (!nextFocused || !currentNode.contains(nextFocused))) {
                setFocused(false);
              }
            }

          }}
          onMouseDown={() => {
            setFocused(true);
          }}
          ref={fieldRef}
        > 
          <ReactQuill
            theme="snow"  
            value={inputValue}
            placeholder={`Edit comment...`}
            onChange={setInputValue}
            modules={{
              toolbar: {
                container: fullToolbar,
                handlers: {
                  image: () => { imageHandler(issueID, onBlurRef, quillRef); }
                }
              },
              history: {
                delay: 2000,
                maxStack: 100,
                userOnly: true
              }
            }}
            ref={quillRef}
          />
        </div>
      </div>

      {/* Comment Creator's Control Buttons */}
      <div className={styles.buttonContainer}>
        <div className={styles.controls}>
          <button 
            className={styles.edit} 
            type="button"
            disabled={userContext?.userData?.accountId !== comment.author.accountId} 
            onMouseDown={() => {
              setEditable(true);
            }}
          >
            Edit
          </button>
          |
          <button 
            className={styles.delete} 
            type="button"
            disabled={userContext?.userData?.accountId !== comment.author.accountId} 
            onMouseDown={() => {
              deleteCommentHandler()
            }}
          >
            Delete
          </button>
        </div>
        
        {(inputValue !== "" && inputValue !== "<p><br></p>" && inputValue !== initialValue && editable) && (
          <button 
            className={styles.saveButton} 
            type="button" 
            onMouseDown={() => {
              updateCommentHandler();
            }}
          >
            Save
          </button>
        )}
        {editable && (
          <button 
            className={styles.cancelButton} 
            type="button" 
            onMouseDown={() => {
              setEditable(false);
              setInputValue(initialValue);
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
