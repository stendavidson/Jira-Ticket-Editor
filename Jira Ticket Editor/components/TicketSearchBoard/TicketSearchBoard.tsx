import style from "./TicketSearchBoard.module.scss";
import { useEffect, useRef, useState } from "react";
import request from "../../lib/nothrow_request";
import IDListInterface from "@/interfaces/IDListInterface";
import TicketTile from "../TicketTile/TicketTile";

export default function ProjectBoard() {
  const [ticketIDs, setTicketIDs] = useState<{ id: string }[]>([]);

  const jql = `assignee = currentUser() AND NOT (status = "Closed" or status = "Closed Lost" or status = "Closed won" or status = "Resolved" or status = "Done" or status = "DONE (IN PROD)" or status = "DONE (IN UAT)" or status = Completed or status = Canceled)`;

  const [input, setInput] = useState<string>(jql); // 👈 Set initial value directly here
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    async function fetchTicketIDs() {
      let IDList: IDListInterface | null = null;
      let IDs: { id: string }[] = [];

      const url: URL = new URL("/proxy", window.location.origin);
      url.searchParams.append("pathname", "/search/jql");

      const postBody = {
        fields: ["id"],
        jql: input,
      };

      const response = await request(url.toString(), {
        method: "POST",
        body: JSON.stringify(postBody),
      });

      if (response?.status.toString().startsWith("2")) {
        IDList = await response?.json();
        IDs = IDList?.issues ?? [];
      }

      setTicketIDs(IDs);
    }

    fetchTicketIDs();
  }, [input]);

  // Resize observer for auto-height textarea
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;

    const resize = () => {
      el.style.height = "max(1.8vh, 18px)";
      el.style.height = `max(${(el.scrollHeight - 15) / 10}vh, ${el.scrollHeight - 15}px)`;
    };

    resize(); // trigger resize on mount

    const observer = new ResizeObserver(resize);
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  function handleInput(event: React.FormEvent<HTMLTextAreaElement>): void {
    const value = event.currentTarget.value;
    setInput(value); // this will trigger fetch
  }

  return (
    <div className={style.ticketSearchBoard}>
      <div className={style.titleSection}>
        <h1>Your Work</h1>
      </div>
      <div className={style.ticketSection}>
        <div className={style.boardWrapper}>
          <div className={style.ticketBoard}>
            <textarea
              onInput={handleInput}
              placeholder="Ticket Search - JQL"
              ref={inputRef}
              value={input}
            />
            {ticketIDs.length === 0 ? (
              <TicketTile />
            ) : (
              ticketIDs.map(({ id }) => <TicketTile ticketID={id} key={id} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
