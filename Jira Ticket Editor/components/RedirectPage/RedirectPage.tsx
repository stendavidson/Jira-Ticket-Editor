'use client'

// Imports external
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';


/**
 * Component conditionally renders a redirect page
 * 
 * @returns JSX.Element | undefined
 */
export default function RedirectPage({countdown, message, reason, immediateRedirect, relativeURL}: {countdown: number, message: string, reason: string, immediateRedirect: string, relativeURL: string}) {
  
  // External hooks
  const router = useRouter();
  const pathname = usePathname();

  // Internal hooks
  const [count, setCount] = useState<number>(countdown);

  if (pathname === immediateRedirect) {

    // Force immediate re-direct for "/"
    useEffect(() => {
      router.push(relativeURL);
    }, []);

  }else{

    // Countdown logic
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

      // Cleanup interval when the component is unmounted or when count changes
      return () => clearInterval(timer);
    }, [count]); // Only run when the count changes

    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        {(message != undefined ? <h1>{message}</h1>: null)}
        {(reason != undefined ? <p>{reason}</p>: null)}
        <p>Redirecting to {relativeURL} in {count}...</p>
      </div>
    );
  }
}