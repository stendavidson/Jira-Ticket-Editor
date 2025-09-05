'use client'

// Styles
import styles from "./UserAvatar.module.scss";

// Component Imports
import { useRef } from "react";



export default function UserAvatar({className, avatarURL, displayName, display, hide}: {className?: string, avatarURL?: string, displayName?: string, display?: () => void, hide?: () => void}){

  // Refs
  const avatarRef = useRef<HTMLDivElement>(null);


  return (
    <>
      <div 
        className={`${styles.avatarCircle} ${className}`}
        tabIndex={-1}
        onMouseDown={() => {
          display?.();
        }}
        onBlur={(ev: React.FocusEvent<HTMLDivElement>) => {

          const nextFocused = ev.relatedTarget as Node | null;
          const currentNode = avatarRef.current;

          // Call hide or display depending on focus
          if (currentNode && (!nextFocused || !currentNode.contains(nextFocused))) {
            setTimeout(() => {
              hide?.();
            }, 200);
          }
          
        }}
        ref={avatarRef}
      >
        <img className={styles.avatarImg} src={avatarURL ? avatarURL : "./../defaultAvatar.png"} alt={displayName ? `The avatar for the user ${displayName}`: "Avatar logo couldn't be loaded"}/> 
      </div>
    </>
  );
}
