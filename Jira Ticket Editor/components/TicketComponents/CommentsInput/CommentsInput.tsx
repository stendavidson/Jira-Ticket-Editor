
// Import styles
import React, { useEffect, useRef } from "react";
import CommentCreator from "./CommentCreator/CommentCreator";
import { CommentInterface, CommentResponseInterface } from "./CommentInterface";
import styles from "./CommentsInput.module.scss";

// External imports
import { useState } from "react";
import { AttachmentInterface } from "@/interfaces/AttachementInterface";
import EditableComment from "./EditableComment/EditableComment";
import request from "@/lib/NoExceptRequestLib";


export default function CommentsInput({className, parentContainer, issueID, isServiceDesk, defaultValue, attachments = []}: {className?: string, parentContainer: React.RefObject<HTMLDivElement | null>, issueID: string, isServiceDesk: boolean, defaultValue: CommentResponseInterface, attachments: AttachmentInterface[]}){

  // State Values
  const [comments, setComments] = useState<CommentInterface[]>(defaultValue.comments);
  const [startAt, setStartAt] = useState<number>(0);
  
  // Refs
  const loadDiv = useRef<HTMLDivElement | null>(null);
  const requestToken = useRef<number>(0);
  const abortRef = useRef<AbortController | null>(null);


  ///////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////// API Calls ///////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////



  /**
   * This function retrieves the comments attached to a given issue
   */
  async function getComments(){

    // Early exit
    if(startAt === -1){
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
    
    // URL Params
    const url: URL = new URL("/proxy-api", window.location.origin);
    url.searchParams.append("pathname", `/issue/${issueID}/comment`);
    url.searchParams.append("elevate", "true");
    url.searchParams.append("startAt", startAt.toString());
    url.searchParams.append("maxResults", maxResults.toString());

    // POST request
    const response = await request(
      url.toString(),
      {
        method: "GET",
        signal: abortController.signal
      }
    ); 

    // If the request was aborted exit early
    if (!response){
      setStartAt(-1);
      return;
    }

    // Process response
    let commentResponse: CommentResponseInterface | null = null;
    let options: CommentInterface[] = [];

    if(response?.status.toString().startsWith("2")){

      commentResponse = (await response?.json()) as CommentResponseInterface;
      options = commentResponse.comments.filter((newValue: CommentInterface) => !comments.some((oldValue: CommentInterface) => newValue.id === oldValue.id));

      // Set the next requests' starting position
      if(commentResponse.total === maxResults){
        setStartAt(commentResponse.startAt + commentResponse.total);
      }else{
        setStartAt(-1);
      }
    }

    // If the request is out of date exit.
    if (token !== requestToken.current){
      return;
    }

    // Set permitted values or recurse
    setComments(prev => [...prev, ...options]);
  }



  ///////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////// Callbacks ///////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////



  /**
   * This function is used to load if the loader is displayed on the screen.
   * 
   * @param loader The element which when exposed triggers lazy loading.
   * 
   * @param parentContainer The element inside which the element must be visible.
   * 
   * @param getOptions The function that performs the lazy loading.
   */
  function checkIfLoaderVisibleAndFetch(loader: HTMLDivElement | null, parentContainer: HTMLDivElement | null, getOptions: () => Promise<void>) {

    // Early exit
    if(loader === null || parentContainer === null){
      ;
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
      getOptions();
    }
  }


  /**
   * This function updates the comment list - by adding a new comment.
   * 
   * @param comment The comment to be added
   */
  function addComment(comment: CommentInterface){
    setComments(prev => [...prev, comment]);
  }


  /**
   * This function updates the comment list - by removing an existing comment.
   * @param comment The comment to be removed
   */
  function removeComment(comment: CommentInterface){
    setComments(prev => prev.filter((value: CommentInterface) => value.id !== comment.id));
  }



  ///////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////// Effects ////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////


  /**
   * This effect performs initial setup
   */
  useEffect(() => {

    setStartAt(defaultValue.startAt + defaultValue.total);

  }, []);


  /**
   * This effect adds event listeners
   */
  useEffect(() => {

    /**
     * This function handles the scroll event.
     */
    function scrollHandler(){
      checkIfLoaderVisibleAndFetch(loadDiv.current, parentContainer.current, getComments);
    }

    // Add event listener
    if(parentContainer.current !== null){

      parentContainer.current.addEventListener("scroll", scrollHandler);

      return () => {
        parentContainer.current?.removeEventListener("scroll", scrollHandler);
      }
    }

  }, [parentContainer]);


  /**
   * This effect continues loading when it is possible to do so.
   */
  useEffect(() => {
    
    checkIfLoaderVisibleAndFetch(loadDiv.current, parentContainer.current, getComments);

  }, [startAt, parentContainer]);


  
  return (
    <div className={`${styles.fieldEditor} ${className ? className : ""}`}>
      <CommentCreator className={styles.comment} issueID={issueID} isServiceDesk={isServiceDesk} addComment={addComment}/>
      <div className={styles.commentsContainer}>      
          {comments.toReversed().map((comment: CommentInterface) => {
              return (
                <EditableComment 
                  key={`${comment.id}-${attachments[0]?.id}`} 
                  className={styles.comment} 
                  issueID={issueID} 
                  isServiceDesk={isServiceDesk}
                  comment={comment} 
                  attachments={attachments}
                  removeComment={removeComment}/>
              );
            })
          }
          {startAt !== -1 && (
            <div className={styles.loader} ref={loadDiv}>
              Loading...
            </div>
          )}
      </div>
    </div>
  );
}