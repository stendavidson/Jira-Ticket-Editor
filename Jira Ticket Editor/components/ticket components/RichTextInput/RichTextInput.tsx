
// Import styles
import './RichTextInput.css';
import styles from './RichTextInput.module.scss';

// External imports
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import ReactQuill from 'react-quill-new';


// Internal Imports
import { parseADFtoHTML, parseHTMLtoADF, stringToHTML, RichTextInterface } from "./../../../lib/parser";
import { AttachmentInterface } from '@/interfaces/AttachementInterface';
import request from '@/lib/nothrow_request';
import { TicketContext } from '@/contexts/TicketContext';
import './QuillCustomizations';


/**
 * This function parses the attachments UUID from a URL.
 * 
 * @param url The url from which to extract the UUID of the attachment
 */
function extractMediaUUID(url: string): string | null {
  const match = url.match(/\/file\/([0-9a-fA-F-]{36})\//);
  return match ? match[1] : null;
}


/**
 * This function returns a loaded HTML Image object.
 * 
 * @param src The image url to load
 * 
 * @returns The rendered/loaded image
 */
function loadImageAsync(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}


/**
 * This function uploads the user selected File to Jira's attachments endpoint
 * 
 * @param issueID The issue that the file is to be attached to
 * 
 * @param file The file to be uploaded
 * 
 * @param quillRef A reference to the quill editor
 */
async function uploadImage(issueID: string, file: File | undefined, quillRef: React.RefObject<ReactQuill | null>) {
  
  // Early exit
  if (!file){
    return;
  } 

  let imageURL: URL | undefined;
  let uuid: string | null = null;
  let alt: string | null = null;
  let width: number | null = null;
  let height: number | null = null;

  // URL Parameters
  const url = new URL("/proxy-api", window.location.origin);
  url.searchParams.append("pathname", `/issue/${issueID}/attachments`);

  // Request body / form-data
  const formData = new FormData();
  formData.append('file', file, file.name);

  // Upload request
  let response = await request(url.toString(), {
    method: "POST",
    body: formData
  });

  // Process response
  let attachment: AttachmentInterface[] = [];

  if (response?.status.toString().startsWith("2")) {
    
    attachment = (await response.json()) as AttachmentInterface[];

    if (attachment.length > 0) {
      imageURL = new URL("/proxy-api", window.location.origin);
      imageURL.searchParams.append("pathname", `/attachment/content/${attachment[0].id}`);
    }
  }


  // Retrieve image data: width, height, alt, uuid
  if (imageURL) {

    let image: HTMLImageElement | null = await loadImageAsync(imageURL.toString());

    if (image) {
      alt = image.alt && image.alt !== "" ? image.alt : file.name;
      width = image.naturalWidth;
      height = image.naturalHeight;
    }

    response = await request(imageURL.toString(), {
      method: "GET"
    });

    if (response?.status.toString().startsWith("2")) {
      let sourceURL: string | null = response.headers.get("origin-location");
      uuid = sourceURL ? extractMediaUUID(sourceURL) : null;
    }
  }

  // Embed the image
  if (uuid && alt) {

    const editor = quillRef.current?.getEditor();
    const range = editor?.getSelection();

    if (range) {
      editor!.insertEmbed(range.index, 'customImage', {
        src: imageURL!.toString(),
        uuid: uuid,
        alt: alt,
        width: width,
        height: height
      }, 'user');
      editor!.setSelection(range.index + 1, 1);
    }
  }
}

/**
 * This function is used to manage the uploading/adding of images to the quill editor.
 * 
 * @param issueID The issue ID - used to correctly attach images to the issue
 * 
 * @param onBlurRef This is used to prevent the file handler from triggering the "onblur" event
 * 
 * @param quillRef A quill editor reference
 */
function imageHandler(issueID: string, onBlurRef: React.RefObject<boolean>, quillRef: React.RefObject<ReactQuill | null>) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';

  onBlurRef.current = false;
  input.click();

  input.onchange = () => {
    onBlurRef.current = true;
    uploadImage(issueID, input.files?.[0], quillRef);
  };

  setTimeout(() => {
    onBlurRef.current = true;
  }, 500);
}


/**
 * Toolbar configuration
 */
const fullToolbar = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  ['bold', 'italic', 'underline', 'strike', 'blockquote', 'code'],
  [{ color: [] }],
  [{ script: 'sub' }, { script: 'super' }],
  [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
  ['link', 'image'],
  ['clean']
];


export default function RichTextInput({ className, issueID, keyName, name, operations, attachments = [], defaultValue = null  }: { className: string, issueID: string, keyName: string, name: string, operations: string[], attachments: AttachmentInterface[], defaultValue: RichTextInterface | null }) {
  
  // Memo - TODO: validate if this is the most effective solution
  const parsedHTML = useMemo(() => {
    return defaultValue ? parseADFtoHTML(defaultValue.content, attachments) : "";
  }, [defaultValue, attachments]);

  // State values
  const [initial, setInitial] = useState(parsedHTML);
  const [inputValue, setInputValue] = useState(parsedHTML);
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
    if(initial !== inputValue){

      setInIssue().then((success: boolean) => {
        if(success){
          context?.setUpdateIndicator(issueID);
          setInitial(inputValue);
        }else{
          setInputValue(initial);
        }
      })

    }
  }



  ///////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////// Callbacks //////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////



  useEffect(() => {
    console.log(inputValue);
    console.log(parseHTMLtoADF(stringToHTML(inputValue)))
  }, [inputValue])
  

  return (
    <div className={`${styles.fieldEditor} ${className || ''}`}>
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
        dangerouslySetInnerHTML={{ __html: inputValue }}
      />

      <div
        className={`${styles.inputField} ${focused ? styles.focused : ''}`}
        style={{ display: focused ? 'block' : 'none' }}
        tabIndex={-1}
        onBlur={(ev: React.FocusEvent<HTMLDivElement>) => {

          // Prevent "blur" when images are being added
          if (onBlurRef.current) {

            const nextFocused = ev.relatedTarget as Node | null;
            const currentNode = fieldRef.current;

            if (currentNode && (!nextFocused || !currentNode.contains(nextFocused))) {
              setFocused(false);
              updateHandler();
            }
          }

        }}
        ref={fieldRef}
      >
        <ReactQuill
          theme="snow"
          value={inputValue}
          onChange={setInputValue}
          modules={modules}
          ref={quillRef}
        />
      </div>
    </div>
  );
}
