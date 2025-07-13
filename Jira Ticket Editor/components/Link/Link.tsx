'use client'

// Import External
import { useRouter } from 'next/navigation';



/**
 * This component acts as a next.js compatible link
 * 
 * @param className The style class name
 * 
 * @param href The link
 * 
 * @param children The link body
 * 
 * @returns A usable link
 */
export default function Link({className, href, onClick, children}: {className: string, href: string, onClick?: () => void, children: React.ReactNode}){

  // Router
  const router = useRouter();


  ///////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////// Callbacks //////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////


  /**
   * This function directs the user to the target link
   */
  function direct(){

    // Next.js safe link
    router.push(href);

    // If there is an onClick callback, execute
    if(onClick){
      onClick();
    }
  }



  return (
    <div className={className} onClick={direct}>{children}</div>
  );
}