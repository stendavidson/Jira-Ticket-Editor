import request from "./NoExceptRequestLib";
import { stringToHTML } from "./QuillLib/ParserLib";

/**
 * This function deletes unnecessary attachements.
 * 
 * @param attachmentID The ID of the attachment being deleted
 */
export async function deleteAttachments(attachmentID: string): Promise<void>{

  // URL Parameters
  const url = new URL("/proxy-api", window.location.origin);
  url.searchParams.append("pathname", `/attachment/${attachmentID}`);
  url.searchParams.append("elevate", "true");

  // Execute Request
  await request(url.toString(), {
    method: "DELETE"
  });
}


/**
 * This function iterates over all attachments and deletes them.
 * 
 * @param inputHTML The html containing the attachements to be deleted.
 */
export function cleanUpAttachments(inputHTML: string){

  const html: HTMLElement = stringToHTML(inputHTML);
  const images: HTMLImageElement[] = Array.from(html.querySelectorAll("img.custom-image"));

  for(const image of images){
    if(image.dataset.attachment! !== ""){
      deleteAttachments(image.dataset.attachment!);
    }
  }
}