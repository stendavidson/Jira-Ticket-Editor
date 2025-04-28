'use client'

// External Imports
import { useEffect, useRef } from "react";


/**
 * This component renders the 'Projects' page.
 * 
 * @returns A react component
 */
export default function Projects(): React.ReactNode {
  
  // Reference indicates that the url parameter has been cleaned
  const urlParamsCleaned = useRef(false);
  
  // Effect cleans up url params
  useEffect(() => {

    // Prevents effect from running again
    if (urlParamsCleaned.current){
      return;
    } 

    // url
    const url = new URL(window.location.href);
    
    // Check if there are search parameters
    if (url.searchParams.has("state") || url.searchParams.has("code")) {
      
      // Clean out specific URL parameters
      url.searchParams.delete("state");
      url.searchParams.delete("code");

      // Update the URL without reloading the page
      window.location.replace(url.toString());
    }

    // Mark the effect as triggered
    urlParamsCleaned.current = true;
    
  }, []); // Only run this once, on mount

  return (
    <main>
      <div>Successful Login</div>
    </main>
  );
}
