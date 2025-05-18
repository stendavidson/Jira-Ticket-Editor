'use client'

// Internal Imports
import ProjectBoard from "../../../components/ProjectBoard/ProjectBoard";
import ProjectSearchList from "../../../components/ProjectSearchList/ProjectSearchList";


/**
 * This component renders the 'Projects' page.
 * 
 * @returns A react component
 */
export default function Projects(): React.ReactNode {

  return (
    <>
      <ProjectSearchList/>
      <ProjectBoard/>
    </>
  );
}
