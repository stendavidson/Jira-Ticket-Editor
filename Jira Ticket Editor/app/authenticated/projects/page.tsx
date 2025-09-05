'use client'

// External Imports
import { useState } from "react";

// Internal Imports
import ProjectBoard from "../../../components/ProjectBoard/ProjectBoard";
import ProjectSearchList from "../../../components/ProjectSearchList/ProjectSearchList";


export default function Projects(){

  // State value(s)
  const [projectID, setProjectID] = useState<string | null>(null);

  return (
    <>
      <ProjectSearchList selectedProject={projectID} projectSetter={setProjectID}/>
      <ProjectBoard selectedProject={projectID}/>
    </>
  );
}
