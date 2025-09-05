
// External imports
import UserInterface from "@/interfaces/UserInterface";
import { createContext, ReactNode, useState } from "react";


/**
 * This "User" context provides the current user's data to the application for
 * use in various functions.
 */
export const UserContext = createContext<{
  userData: UserInterface | null, 
  setUserData: React.Dispatch<React.SetStateAction<UserInterface | null>>
} | null>(null);


/**
 * This "User" context provider gives the application access to the context object.
 */
export function UserProvider({ children }: {children : ReactNode}) {

  // State value(s)
  const [userData, setUserData] = useState<UserInterface | null>(null);

  return (
    <UserContext.Provider value={{userData, setUserData}}>
      {children}
    </UserContext.Provider>
  );
}