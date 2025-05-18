// Style Imports
import style from "./ProjectSearchList.module.scss";

// Internal Imports
import Project from "../../interfaces/ProjectInterface";
import ProjectList from "../../interfaces/ProjectListInterface";

// External Imports
import React, { JSX, RefObject, useEffect, useRef, useState } from "react";
import ProjectAvatar from "../ProjectAvatar/ProjectAvatar";
import request from "../../lib/nothrow_request";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { flushSync } from "react-dom";


export default function ProjectSearchList() : JSX.Element {

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const loaderRef: RefObject<HTMLDivElement | null> = useRef<HTMLDivElement | null>(null);
  const [projectData, setProjectData] = useState<Project[]>([]);
  const [startAt, setStartAt] = useState<number>(0);
  const loading = useRef<boolean>(false);
  const [input, setInput] = useState<string>("");
  const requestToken = useRef<number>(0);
  const [projectID, setProjectID] = useState<string | null>(null);


  /**
   * This function retrieves a list of all the projects
   */
  async function loadProjects(query: string = "") {

    let projectList: ProjectList | null = null;

    // Increment token for this request
    const currentToken = ++requestToken.current;

    // Set loading to true
    loading.current = true;

    // URL params
    const url = new URL("/proxy", window.location.origin);
    url.searchParams.append("pathname", "/project/search");
    url.searchParams.append("startAt", startAt.toString());
    if (query) { url.searchParams.append("query", query) }
  
    const response = await request(url.toString(), { method: "GET" });

    if(response?.status.toString().startsWith("2")){
      projectList = await response?.json();
    }
  
    // Only update if this is still the latest request
    if (currentToken === requestToken.current) {
      if (projectList && projectList.values.length > 0) {

        // Only reset the entire project list if the input has been updated
        if(input){
          setProjectData(projectList.values);
        }else{
          setProjectData(prev => prev.concat(projectList.values));
        }
        
        setStartAt(projectList.isLast ? -1 : projectList.startAt + projectList.maxResults);
      } else {
        setProjectData([]);
        setStartAt(-1);
      }
    }
  
    loading.current = false;
  }


  /**
   * Set up an observer on the element that triggers loading
   */
  useEffect(() => {

    // Create an observer
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.target === loaderRef.current && !loading.current) {
          loadProjects();
        }
      },
      { threshold: 1.0 }
    );

    // If loaderRef.current is defined observer it
    const loader = loaderRef.current;
    if (loader) {
      observer.observe(loader);
    } 

    // Clean up function
    return () => {
      if (loader) observer.unobserve(loader);
    };
  }, [startAt]);


  /**
   * The function sets the project-id as selected by the user.
   * 
   * @param id The new project-id that has been selected by the user.
   */
  function updateProjectID(id: string): void {

    flushSync(() => {
      setProjectID(id);
    });

    const params = new URLSearchParams(searchParams.toString());
    params.set("project-id", id);
    router.replace(`${pathname}?${params.toString()}`);
  }


  /**
   * This function sets the project search query
   * 
   * @param event event triggered by user updating the search field.
   */
  function handleInput(event: React.FormEvent<HTMLInputElement>): void {
    const value = (event.target as HTMLInputElement).value;
    setInput(value);
  }

  // Force query change to reset the project search
  useEffect(() => {
    setProjectData([]);
    setStartAt(0);
    loadProjects(input);
  }, [input]);



  // Set the "selected" project-id if the search parameters contain a project id
  useEffect(() => {
    
    // Get initial url param
    const id = searchParams.get('project-id');

    // Set url param as project ID
    if(id){
      setProjectID(id);
    }
    
  }, [])


  return (
    <div className={style.projectSearchList}>
      <div className={style.titleSection}>
        <h1>Projects</h1>
      </div>
      <div className={style.searchSection}>
        <input type="text" onInput={handleInput} placeholder="Search Projects"></input>
      </div>
      <div className={style.projectsBox}>
        {projectData.map((value) => {
          return (
            <div className={`${style.projectTile} ${projectID === value.id ? style.highlight : ""}`} key={value.id} onClick={() => updateProjectID(value.id)}>
              <p className={style.projectTitle}>{value.name}</p>
              <ProjectAvatar avatarURL={value.avatarUrls["48x48"]} displayName={value.name} className={style.avatar}/>
            </div>
          );
        }
        )}
        {startAt !== -1 && (
          <div ref={loaderRef} className={style.projectTile}>
            Loading projects...
          </div>
        )}
      </div>
    </div>
  );
};

