'use client'

// Styles
import styles from "./ProjectAvatar.module.scss";


/**
 * This component displays the project avatar
 */
export default function UserAvatar({ avatarURL, displayName, className }: { avatarURL: string|undefined, displayName: string|undefined, className: string }) {

  return (
    <>
      <div className={`${styles.avatarCircle} ${className}`}>
          <img className={styles.avatarImg} src={avatarURL ? avatarURL: undefined} alt={displayName ? `The avatar for the project ${displayName}`: "Project avatar logo couldn't be loaded"}/> 
          <p className={styles.avatarTooltip}>{displayName ? displayName: "Unknown"}</p>
      </div>
    </>
  );
}
