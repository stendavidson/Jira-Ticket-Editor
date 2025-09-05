'use client'

// Internal import
import RedirectPage from "../components/RedirectPage/RedirectPage";
import { usePathname } from 'next/navigation';


export default function PageNotFound(){

  // Next.js Hook(s)
  const path = usePathname();

  return (
    <RedirectPage 
      countdown={10} 
      message="Error 404 - Page Not Found" 
      reason={`The url "${path}" does not exist`} 
      immediateRedirect="/"
      relativeURL="/authenticated/projects"
    />
  );
}