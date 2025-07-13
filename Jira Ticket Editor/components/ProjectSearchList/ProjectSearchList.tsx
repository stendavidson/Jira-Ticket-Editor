// Style Imports
import style from "./ProjectSearchList.module.scss";

// Internal Imports
import { ProjectsResponseInterface, ProjectInterface } from "./ProjectInterface";

// External Imports
import React, { useEffect, useRef, useState } from "react";
import ProjectAvatar from "../ProjectAvatar/ProjectAvatar";
import request from "../../lib/nothrow_request";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function ProjectSearchList() {

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [projectID, setProjectID] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState<string>("");
  const [startAt, setStartAt] = useState<number>(0);
  const [permittedValues, setPermittedValues] = useState<ProjectInterface[]>([]);
  const [filteredPermittedValues, setFilteredPermittedValues] = useState<ProjectInterface[]>([]);
  const parentRef = useRef<HTMLDivElement | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const loading = useRef<boolean>(false);
  const initial = useRef<boolean>(true);

  // Debounce timer ref for input
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Fetch projects from API and append new results uniquely
  async function getProjects() {

    if (loading.current || startAt === -1){
      return;
    }

    loading.current = true;

    // Build URL with params
    const url = new URL("/proxy-api", window.location.origin);
    url.searchParams.append("pathname", "/project/search");
    url.searchParams.append("elevate", "true");
    url.searchParams.append("query", inputValue);
    url.searchParams.append("orderBy", "name");
    url.searchParams.append("startAt", startAt.toString());

    const response = await request(url.toString(), { method: "GET" });

    if (response?.status.toString().startsWith("2")) {
      const data = (await response.json()) as ProjectsResponseInterface;
      const newProjects = data.values.filter(p => !permittedValues.some(existing => existing.id === p.id));

      setPermittedValues(prev => [...prev, ...newProjects]);
      setStartAt(data.isLast ? -1 : data.startAt + data.maxResults);
    }

    loading.current = false;
  }

  // Initial load
  useEffect(() => {
    if (initial.current) {
      initial.current = false;
      getProjects();
    }
  }, []);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const loader = loaderRef.current;
    const parent = parentRef.current;
    if (!loader || !parent) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          getProjects();
        }
      },
      {
        root: parent,
        rootMargin: "0px 0px 250px 0px",
        threshold: 0,
      }
    );

    observer.observe(loader);

    return () => {
      if (loader) observer.unobserve(loader);
    };
  }, [startAt, permittedValues]); // re-subscribe when startAt or permittedValues change

  // Debounced filtering of permitted projects on input change
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      const filtered = permittedValues.filter(p =>
        p.name.toLowerCase().includes(inputValue.toLowerCase())
      );
      setFilteredPermittedValues(filtered);
    }, 300);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [inputValue, permittedValues]);

  // Input handler
  function handleInput(ev: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(ev.target.value);
  }

  // Update selected project ID and URL param
  function updateProjectID(id: string) {
    setProjectID(id);
    const params = new URLSearchParams(searchParams.toString());
    params.set("project-id", id);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className={style.projectSearchList}>
      <div className={style.titleSection}>
        <h1>Projects</h1>
      </div>
      <div className={style.searchSection}>
        <input
          type="text"
          onChange={handleInput}
          value={inputValue}
          placeholder="Search Projects"
        />
      </div>
      <div className={style.projectsBox} ref={parentRef}>
        {filteredPermittedValues.map(project => (
            <div
              key={project.id}
              className={`${style.projectTile} ${projectID === project.id ? style.highlight : ""}`}
              onClick={() => updateProjectID(project.id)}
            >
              <p className={style.projectTitle}>{project.name}</p>
              <ProjectAvatar
                avatarURL={project.avatarUrls["48x48"]}
                displayName={project.name}
                className={style.avatar}
              />
            </div>
          ))
        }
        {filteredPermittedValues.length === 0 && !loading.current && (
            <div className={style.rejectTile}>
              No Matching Projects
            </div>
          )
        }
        {startAt !== -1 && (
            <div ref={loaderRef} className={style.rejectTile}>
              Loading projects...
            </div>
          )
        }
      </div>
    </div>
  );
}
