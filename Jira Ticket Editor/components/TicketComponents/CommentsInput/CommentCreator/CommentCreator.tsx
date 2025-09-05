
// Import styles
import styles from './CommentCreator.module.scss';

// External imports
import React, { useContext, useRef, useState } from 'react';
import ReactQuill from 'react-quill-new';


// Internal Imports
import { parseHTMLtoADF, stringToHTML } from "@/lib/QuillLib/ParserLib";
import request from '@/lib/NoExceptRequestLib';
import '@/lib/QuillLib/QuillCustomizations';
import { imageHandler } from '../../../../lib/QuillLib/QuillUtils';
import { CommentInterface } from '../CommentInterface';
import { UserContext } from '@/contexts/UserContext';
import { cleanUpAttachments } from '@/lib/AttachmentsLib';
import { TicketContext } from '@/contexts/TicketContext';


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


export default function CommentCreator({ className, issueID, isServiceDesk, addComment}: { className?: string, issueID: string, isServiceDesk: boolean, addComment: (comment: CommentInterface) => void}) {  

  // State values
  const [inputValue, setInputValue] = useState<string>("");
  const [focused, setFocused] = useState<boolean>(false);
  const [publicStatus, setPublicStatus] = useState<boolean | null>(null);

  // Ref Values
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<ReactQuill | null>(null);
  const onBlurRef = useRef<boolean>(true);

  // Context(s)
  const userContext = useContext(UserContext);
  const ticketContext = useContext(TicketContext);


  ///////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////// API Calls //////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////



  /**
   * This function creates a new comment in Jira
   * 
   * @returns The newly created comment
   */
  async function createComment(): Promise<CommentInterface | null>{

    // URL Params
    const url: URL = new URL("/proxy-api", window.location.origin);
    url.searchParams.append("pathname", `/issue/${issueID}/comment`);
    if(isServiceDesk && publicStatus){ url.searchParams.append("elevate", "true") }

    // Request Body
    const body: any = {};
    body["body"] = {
      type: "doc",
      version: 1,
      content: parseHTMLtoADF(stringToHTML(inputValue))
    }

    if(isServiceDesk && publicStatus){
      body["properties"] = [
       {
         "key": "sd.public.comment",
         "value": {
           "internal": false
         }
       }
     ];
    }

    // User request
    const response = await request(
      url.toString(),
      {
        method: "POST",
        body: JSON.stringify(body)
      }
    );

    // Process responses
    let comment: CommentInterface | null = null;

    if(response?.status.toString().startsWith("2")){
      comment = (await response.json()) as CommentInterface;
    }

    return comment;
  }



  ///////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////// Callbacks //////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////



  /**
   * This callback is used to create a brand new comment.
   */
  function createCommentHandler(){

    // Early exit
    if(inputValue !== ""){      
      createComment().then((comment: CommentInterface | null) => {
        setInputValue("");
        setPublicStatus(null);
        if(comment){
          comment.body.content = parseHTMLtoADF(stringToHTML(inputValue), true);
          addComment(comment);
          ticketContext?.setUpdateIndicator(issueID);
        }
      })
    }
  }


  /**
   * This callback is used to create a brand new comment.
   */
  function cancelCommentHandler(){

    // Early exit
    if(inputValue !== ""){
      cleanUpAttachments(inputValue);
      setInputValue("");
      setPublicStatus(null);
    }
  }



  return (
    <div className={`${styles.fieldEditor} ${className ?? ''}`}>
      {/* "Comment" field */}
      <div className={styles.fieldContainer}>

        <img className={styles.avatar} src={userContext?.userData?.avatarUrls["48x48"] ?? "./../../../defaultAvatar.png"} alt={userContext?.userData?.displayName ? `User avatar for ${userContext?.userData?.displayName}` : "User avatar couldn't be loaded"}/>

        {/* Comment Type Selector */}
        {isServiceDesk && publicStatus === null ? (
          <div className={styles.controls}>
            <button 
              className={styles.internal} 
              type="button"
              onMouseDown={() => {
                setPublicStatus(false);
              }}
            >
              Add internal note
            </button>
            |
            <button 
              className={styles.external} 
              type="button"
              onMouseDown={() => {
                setPublicStatus(true);
              }}
            >
              Add public note
            </button>
          </div>
        )
        :
        (
          <>
            <div
              className={`${"ql-editor"} ${styles.disabledField}`}
              style={{ display: focused ? 'none' : 'block' }}
              onClick={() => {
                setFocused(true);
                setTimeout(() => {
                  fieldRef.current!.focus();
                }, 0);
              }}
              dangerouslySetInnerHTML={{ __html: (inputValue !== "" && inputValue !== "<p><br></p>") ? inputValue : `<p class="${styles.placeholder}">Add a comment...</p>` }}
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
                placeholder={`Add a comment...`}
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
          </>
        )
      } 
      </div>

      {/* Comment Creator's Control Buttons */}
      {(inputValue !== "" && inputValue !== "<p><br></p>") && (
        <div className={styles.buttonContainer}>
          <button 
            className={styles.saveButton} 
            type="button" 
            onMouseDown={() => {
              createCommentHandler();
            }}
          >
              Save
          </button>
          <button 
            className={styles.cancelButton} 
            type="button" 
            onMouseDown={() => {
              cancelCommentHandler();
            }}
          >
              Cancel
          </button>
        </div>
      )}
    </div>
  );
}
