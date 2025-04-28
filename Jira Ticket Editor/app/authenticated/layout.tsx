'use client'

// Internal Imports
import Navbar from "../../components/Navbar/Navbar"

export default function AuthenticatedLayout({ children }: { children: React.ReactNode}){
  
  return (
    <>
      <Navbar/>
      {children}
    </>
  )

}