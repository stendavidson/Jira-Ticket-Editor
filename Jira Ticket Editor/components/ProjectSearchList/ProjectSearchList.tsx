// Style Imports
import style from "./ProjectSearchList.module.scss";

// External Imports
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// Internal Imports
import { ProjectsResponseInterface, ProjectInterface } from "./ProjectInterface";
import ProjectAvatar from "../ProjectAvatar/ProjectAvatar";
import request from "../../lib/NoExceptRequestLib";
import { checkIfLoaderVisibleAndFetch } from "@/lib/DropdownLib";



export default function ProjectSearchList({selectedProject, projectSetter}: {selectedProject: string | null, projectSetter: (projectID: string | null) => void}) {

  // Next.js hooks
  const router = useRouter();

  // State values
  const [inputValue, setInputValue] = useState<string>("");
  const [startAt, setStartAt] = useState<number>(0);
  const [permittedValues, setPermittedValues] = useState<ProjectInterface[]>([]);
  const [filteredPermittedValues, setFilteredPermittedValues] = useState<ProjectInterface[]>([]);
  const [triggerLoad, setTriggerLoad] = useState<boolean>(false);

  // Refs
  const parentRef = useRef<HTMLDivElement | null>(null);
  const loadDiv = useRef<HTMLDivElement | null>(null);
  const requestToken = useRef<number>(0);
  const abortRef = useRef<AbortController | null>(null);


  
  ///////////////////////////////////////////////////////////////////////////////
  //////////////////////////////// API Functions ////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////



  /**
   * This function retrieves all projects
   * 
   * @param textInput The user's search/filter input
   * 
   * @param overrideToken An indicator that the startAt value should be ignored
   */
  async function getProjects(textInput: string, overrideToken: boolean = false){
    
    // Early exit
    if(!overrideToken && startAt === -1){
      return;
    }

    // Max results
    const maxResults = 50;

    // Set request token
    requestToken.current++;
    const token = requestToken.current;
    
    // Abort previous request
    abortRef.current?.abort();

    // Create new AbortController to exit early if necessary
    const abortController = new AbortController();
    abortRef.current = abortController;

    // URL Params
    const url = new URL("/proxy-api", window.location.origin);
    url.searchParams.append("pathname", "/project/search");
    url.searchParams.append("elevate", "true");
    url.searchParams.append("query", inputValue);
    url.searchParams.append("orderBy", "name");
    url.searchParams.append("startAt", startAt.toString());
    url.searchParams.append("maxResults", maxResults.toString());

    // GET request
    const response = await request(
      url.toString(),
      {
        method: "GET",
        signal: abortController.signal
      }
    );

    // If the request was aborted exit early
    if (!response){
      setStartAt(-1);
      return;
    }

    // Process response
    let projectResponse: ProjectsResponseInterface | null = null;
    let projects: ProjectInterface[] = [];
    let filteredProjects: ProjectInterface[] = [];

    if(response?.status.toString().startsWith("2")){

      projectResponse = ((await response?.json()) as ProjectsResponseInterface);
      projects = projectResponse.values.filter((newValue: ProjectInterface) => !permittedValues.some((oldValue: ProjectInterface) => newValue.id === oldValue.id));
      filteredProjects = projects.filter((value: ProjectInterface) => {
        return (value.key.toLowerCase().includes(textInput.toLowerCase()) || value.name.toLowerCase().includes(textInput.toLowerCase()));
      })

      // Set next start
      if(!projectResponse.isLast){
        setStartAt(startAt + maxResults);
      }else{
        setStartAt(-1);
      }
    }

    // If the request is out of date exit.
    if(token !== requestToken.current){
      return;
    }

    // Set permitted values or recurse
    if(projects.length > 0){

      setPermittedValues(prev => [...prev, ...projects]);

      if(filteredProjects.length > 0){
        setFilteredPermittedValues(prev => [...prev, ...filteredProjects]);
      }else{
        setTriggerLoad(prev => !prev);
      }

    }else{
      setTriggerLoad(prev => !prev);
    }
  }



  ///////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////// Callbacks //////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////



  /**
   * This function filters the dropdown list
   * 
   * @param textInput The user input
   */
  function filterProjects(textInput: string){

    // If allowed values exist - then filtered the restricted list
    if (permittedValues.length > 0) {

      setFilteredPermittedValues(permittedValues.filter((value: ProjectInterface) => {
        return (value.key.toLowerCase().includes(textInput.toLowerCase()) || value.name.toLowerCase().includes(textInput.toLowerCase()));
      }));

    }

    checkIfLoaderVisibleAndFetch(loadDiv.current, parentRef.current, true, textInput, getProjects, true);
  }



  /**
   * This function "selects" the project ID.
   * 
   * @param projectID The selected project's ID
   */
  function updateProjectID(projectID: string) {
    projectSetter(projectID);
    const currentURL: URL = new URL(window.location.href);
    currentURL.searchParams.set("project-id", projectID);
    router.push(`${currentURL.pathname}?${currentURL.searchParams.toString()}`);
  }



  ///////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////// Effects ///////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////



  /**
   * This retrieves the initial list of projects
   */
  useEffect(() => {

    // Initial load
    getProjects("", false);

    // Check for "selected" project ID
    const currentURL: URL = new URL(window.location.href);
    const projectID: string | null = currentURL.searchParams.get("project-id");
    ;
    projectSetter(projectID);

  }, []);


  /**
   * Lazy loading triggered - if no items have been loaded initially.
   */
  useEffect(() => {

    getProjects("", false);

  }, [triggerLoad]);


  /**
   * Lazy loading Scroll Check triggered - if more items can be loaded
   */
  useEffect(() => {
    
    checkIfLoaderVisibleAndFetch(loadDiv.current, parentRef.current, true, inputValue, getProjects, false);
  
  }, [startAt]);

  

  return (
    <div className={style.projectSearchList}>
      <div className={style.titleSection}>
        <h1>Projects</h1>
      </div>
      <div className={style.searchSection}>
        <input
          type="text"
          onChange={(ev: React.ChangeEvent<HTMLInputElement>) => {
            setInputValue(ev.target.value);
            filterProjects(ev.target.value);
          }}
          value={inputValue}
          placeholder="Search projects..."
        />
      </div>
      <div 
        className={style.projectsBox} 
        onScroll={() => {
            checkIfLoaderVisibleAndFetch(loadDiv.current, parentRef.current, true, inputValue, getProjects, false);
          }}
        ref={parentRef}>
        {filteredPermittedValues.map(project => (
            <div
              key={project.id}
              className={`${style.projectTile} ${selectedProject === project.id ? style.highlight : ""}`}
              onClick={() => updateProjectID(project.id)}
            >
              {project.name}
              <ProjectAvatar
                avatarURL={project.avatarUrls["48x48"]}
                displayName={project.name}
                className={style.avatar}
              />
            </div>
          ))
        }
        {filteredPermittedValues.length === 0 && startAt === -1 && (
            <div className={style.rejectTile}>
              No Matching Projects
            </div>
          )
        }
        {startAt !== -1 && (
            <div ref={loadDiv} className={style.rejectTile}>
              Loading projects...
            </div>
          )
        }
      </div>
    </div>
  );
}
