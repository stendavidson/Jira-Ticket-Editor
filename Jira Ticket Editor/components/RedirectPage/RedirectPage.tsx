'use client'

// Imports external
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';


/**
 * Component conditionally renders a redirect page
 */
export default function RedirectPage({countdown, message, reason, immediateRedirect, relativeURL}: {countdown: number, message: string, reason: string, immediateRedirect: string, relativeURL: string}) {
  
  // External hooks
  const router = useRouter();
  const pathname = usePathname();

  // Internal hooks
  const [count, setCount] = useState<number>(countdown);



  ///////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////// Effects ///////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////


  
  /**
   * This effect immediately redirects for particular urls (e.g. "\")
   */
  useEffect(() => {

    if(pathname === immediateRedirect){
      router.push(relativeURL);
    }
    
  }, []);

  
  /**
   * This function renders a countdown timer - until the page redirects
   */
  useEffect(() => {

    // If the count reaches 0, redirect to the projects page
    if (count === 0) {
      router.push(relativeURL);
      return;
    }

    // Count down every second
    const timer = setInterval(() => {
      setCount((prevCount) => prevCount - 1);
    }, 1000);

    // Cleanup interval when the component is unmounted or when count changes (i.e. ever-time the effect runs)
    return () => clearInterval(timer);

  }, [count]);


  
  return (
    pathname !== immediateRedirect ? (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        {(message != undefined ? <h1>{message}</h1>: null)}
        {(reason != undefined ? <p>{reason}</p>: null)}
        <p>Redirecting to {relativeURL} in {count}...</p>
      </div>
    ) : (
      null
    )
  );
}