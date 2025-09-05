'use client'

// Styles
import styles from "./ProjectAvatar.module.scss";


export default function ProjectAvatar({ avatarURL, displayName, className }: { avatarURL: string | undefined, displayName: string | undefined, className: string }) {

  return (
    <>
      <div className={`${styles.avatarCircle} ${className}`}>
          <img className={styles.avatarImg} src={avatarURL ? avatarURL : "./../Transparent.png"} alt={displayName ? `The avatar for the project ${displayName}`: "Project avatar logo couldn't be loaded"}/> 
      </div>
    </>
  );
}
