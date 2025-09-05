
// Import styles
import styles from './RichTextInput.module.scss';

// External imports
import React, { useContext, useEffect, useRef, useState } from 'react';
import ReactQuill from 'react-quill-new';


// Internal Imports
import { parseADFtoHTML, parseHTMLtoADF, stringToHTML } from "@/lib/QuillLib/ParserLib";
import { AttachmentInterface } from '@/interfaces/AttachementInterface';
import request from '@/lib/NoExceptRequestLib';
import { TicketContext } from '@/contexts/TicketContext';
import '@/lib/QuillLib/QuillCustomizations';
import { imageHandler } from '@/lib/QuillLib/QuillUtils';
import { RichTextInterface } from '@/interfaces/RichTextInterface';


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


export default function RichTextInput({ className, issueID, keyName, name, operations, attachments = [], defaultValue = null }: { className?: string, issueID: string, keyName: string, name: string, operations: string[], attachments: AttachmentInterface[], defaultValue: RichTextInterface | null }) {  

  // State values
  const [initialValue, setInitialValue] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [focused, setFocused] = useState(false);

  // Ref Values
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<ReactQuill | null>(null);
  const onBlurRef = useRef<boolean>(true);

  // Contexts
  const context = useContext(TicketContext);

  /**
   * This constant stores the Quill toolbar config, handlers and other configs
   */
  const modules = {
    toolbar: {
      container: fullToolbar,
      handlers: {
        image: () => { imageHandler(issueID, onBlurRef, quillRef) }
      }
    },
    history: {
      delay: 2000,
      maxStack: 100,
      userOnly: true
    }
  };


  ///////////////////////////////////////////////////////////////////////////////
  //////////////////////////////// API Functions ////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////


  /**
   * This function updates the issue data with the user input
   * 
   * @returns The success of the PUT request
   */
  async function setInIssue(): Promise<boolean> {

    // URL Params
    const url = new URL("/proxy-api", window.location.origin);
    url.searchParams.append("pathname", `/issue/${issueID}`);
    url.searchParams.append("elevate", "true");
    

    // PUT Request Body
    const body: any = {}
    body.fields = {};
    body.fields[keyName] = (inputValue === "" ? null : {
      type: "doc",
      version: 1,
      content: parseHTMLtoADF(stringToHTML(inputValue))
    });

    // Update Request
    const response = await request(url.toString(), {
      method: "PUT",
      body: JSON.stringify(body),
    });

    return response?.status.toString().startsWith("2") ?? false;
  }



  ///////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////// Callbacks //////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////



  /**
   * This callback handles the current state of the text input field and determines if
   * the ticket needs to be updated.
   */
  function updateHandler(){

    // Early exit
    if(initialValue !== inputValue){

      setInIssue().then((success: boolean) => {
        if(success){
          context?.setUpdateIndicator(issueID);
          setInitialValue(inputValue);
        }else{
          setInputValue(initialValue);
        }
      })

    }
  }



  ///////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////// Effects //////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////


  /**
   * Load the quill editor's contents
   */
  useEffect(() => {

    const quillHTML = defaultValue ? parseADFtoHTML(defaultValue.content, attachments) : "";
    setInitialValue(quillHTML);
    setInputValue(quillHTML);
    ;

  }, [defaultValue, attachments])
  

  return (
    <div className={`${styles.fieldEditor} ${className ?? ''}`}>
      {name && (
        <h1 className={styles.label}>{name}</h1>
      )}

      <div
        className={`${"ql-editor"} ${styles.disabledField}`}
        style={{ display: focused ? 'none' : 'block' }}
        onClick={() => {
          setFocused(true);
          setTimeout(() => {
            fieldRef.current!.focus();
          }, 0);
        }}
        dangerouslySetInnerHTML={{ __html: (inputValue !== "" && inputValue !== "<p><br></p>") ? inputValue : `<p class="${styles.placeholder}">Enter ${name}...</p>` }}
      />

      <div
        className={`${styles.inputField} ${focused ? styles.focused : ''}`}
        style={{ display: focused ? 'block' : 'none' }}
        tabIndex={-1}
        ref={fieldRef}
      >
        <ReactQuill
          theme="snow"
          value={inputValue}
          readOnly={!operations.includes("set")}
          onChange={setInputValue}
          modules={modules}
          ref={quillRef}
        />
      </div>
      {/* Comment Creator's Control Buttons */}
      {focused && (
        <div className={styles.buttonContainer}>
          {(inputValue !== "" && inputValue !== "<p><br></p>" && inputValue !== initialValue) && (
            <button 
              className={styles.saveButton} 
              type="button" 
              onMouseDown={() => {
                setFocused(false);
                updateHandler();
              }}
            >
              Save
            </button>
          )}
          <button 
            className={styles.cancelButton} 
            type="button" 
            onMouseDown={() => {
              setFocused(false);
              setInputValue(initialValue);
            }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
