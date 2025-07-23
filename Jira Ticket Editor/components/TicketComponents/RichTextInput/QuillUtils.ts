import { AttachmentInterface } from "@/interfaces/AttachementInterface";
import request from "@/lib/nothrow_request";
import ReactQuill from "react-quill-new";

/**
 * This function parses the attachments UUID from a URL.
 * 
 * @param url The url from which to extract the UUID of the attachment
 */
function extractMediaUUID(url: string): string | null {
  const match = url.match(/\/file\/([0-9a-fA-F-]{36})\//);
  return match ? match[1] : null;
}


/**
 * This function returns a loaded HTML Image object.
 * 
 * @param src The image url to load
 * 
 * @returns The rendered/loaded image
 */
function loadImageAsync(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}


/**
 * This function uploads the user selected File to Jira's attachments endpoint
 * 
 * @param issueID The issue that the file is to be attached to
 * 
 * @param file The file to be uploaded
 * 
 * @param quillRef A reference to the quill editor
 */
async function uploadImage(issueID: string, file: File | undefined, quillRef: React.RefObject<ReactQuill | null>) {
  
  // Early exit
  if (!file){
    return;
  } 

  let imageURL: URL | undefined;
  let uuid: string | null = null;
  let alt: string | null = null;
  let width: number | null = null;
  let height: number | null = null;

  // URL Parameters
  const url = new URL("/proxy-api", window.location.origin);
  url.searchParams.append("pathname", `/issue/${issueID}/attachments`);
  url.searchParams.append("elevate", "true");

  // Request body / form-data
  const formData = new FormData();
  formData.append('file', file, file.name);

  // Upload request
  let response = await request(url.toString(), {
    method: "POST",
    body: formData
  });

  // Process response
  let attachment: AttachmentInterface[] = [];

  if (response?.status.toString().startsWith("2")) {
    
    attachment = (await response.json()) as AttachmentInterface[];

    if (attachment.length > 0) {
      imageURL = new URL("/proxy-api", window.location.origin);
      imageURL.searchParams.append("pathname", `/attachment/content/${attachment[0].id}`);
      imageURL.searchParams.append("elevate", "true");
    }
  }


  // Retrieve image data: width, height, alt, uuid
  if (imageURL) {

    let image: HTMLImageElement | null = await loadImageAsync(imageURL.toString());

    if (image) {
      alt = image.alt && image.alt !== "" ? image.alt : file.name;
      width = image.naturalWidth;
      height = image.naturalHeight;
    }

    response = await request(imageURL.toString(), {
      method: "GET"
    });

    if (response?.status.toString().startsWith("2")) {
      let sourceURL: string | null = response.headers.get("origin-location");
      uuid = sourceURL ? extractMediaUUID(sourceURL) : null;
    }
  }

  // Embed the image
  if (uuid && alt) {

    const editor = quillRef.current?.getEditor();
    const range = editor?.getSelection();

    if (range) {
      editor!.insertEmbed(range.index, 'customImage', {
        src: imageURL!.toString(),
        uuid: uuid,
        alt: alt,
        width: width,
        height: height
      }, 'user');
      editor!.setSelection(range.index + 1, 1);
    }
  }
}

/**
 * This function is used to manage the uploading/adding of images to the quill editor.
 * 
 * @param issueID The issue ID - used to correctly attach images to the issue
 * 
 * @param onBlurRef This is used to prevent the file handler from triggering the "onblur" event
 * 
 * @param quillRef A quill editor reference
 */
export function imageHandler(issueID: string, onBlurRef: React.RefObject<boolean>, quillRef: React.RefObject<ReactQuill | null>) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';

  onBlurRef.current = false;
  input.click();

  input.onchange = () => {
    onBlurRef.current = true;
    uploadImage(issueID, input.files?.[0], quillRef);
  };

  setTimeout(() => {
    onBlurRef.current = true;
  }, 500);
}