import { AttachmentInterface } from "@/interfaces/AttachementInterface";
import { RichTextNodeInterface, SpanInterface } from "@/interfaces/RichTextInterface"


/**
 * This function converts a HTML formatted string to a HTMLElement object.
 * 
 * @param html The html string
 * 
 * @returns A HTML node
 */
export function stringToHTML(html: string): HTMLElement{

  const root: HTMLElement = document.createElement("div") as HTMLElement;
  root.innerHTML = html;

  return root;
}


/**
 * This function extracts the indent depth of a given HTML list node.
 * 
 * @param html The HTML element to extract list indent level from.
 * 
 * @returns The list indent level
 */
function getIndentLevel(html: HTMLElement): number {
  const indentClass = Array.from(html.classList).find(c => c.startsWith("ql-indent-"));
  return indentClass ? parseInt(indentClass.replace("ql-indent-", ""), 10) : 0;
}


/**
 * This function parses HTML content into an ADF format
 * 
 * @param elements The HTML Elements to parse
 * 
 * @param depth Recursion & list depth
 * 
 * @returns The ADF content and current recursion/list depth
 */
function parseList(elements: HTMLElement[], depth: number = 0): { nodes: RichTextNodeInterface[]; remaining: number } {

  const children: HTMLElement[] = [...elements];

  const output: RichTextNodeInterface[] = [];

  let currentListType: string | undefined;

  let temp: RichTextNodeInterface | undefined;

  let i: number;

  for(i=0; i<children.length; i++){

    const indent = getIndentLevel(children[i]);

    if(!currentListType){

      currentListType = children[i].dataset["list"]!;

      if(currentListType === "ordered"){
        temp = {
          type: currentListType + "List",
          attrs: {
            order: 1
          },
          content: []
        }
      }else{
        temp = {
          type: currentListType + "List",
          content: []
        }
      }
      
    }

    // If the indent < depth break after setting index = i
    if(indent < depth){
      break;
    }

    // If the indent === depth but children[i].dataset["list"] !== the "current list type" finish previous list and create a new one
    if(indent === depth && (children[i].dataset["list"]!) !== currentListType){

      // Finishing the previous list
      if(temp){
        output.push(temp);
        currentListType = undefined;
        temp = undefined;
        i--;
      }

    // If the indent > depth create a listItem containing a new list - slice children using "i" and call the function recursively
    }else if(indent > depth){

      const recursiveVal = parseList(children.slice(i), depth + 1);

      // Add list(s) to previous node
      if(temp!.content!.length > 0){
        for(const node of recursiveVal.nodes){
          temp!.content![temp!.content!.length - 1].content!.push(node);
        }
      }

      // Update "i" to skip parsed values
      i += recursiveVal.remaining - 1;

    // If the indent === depth then create a paragraph with content using parseParagraph
    }else if(indent === depth){

      temp!.content!.push({
        type: "listItem",
        content: [{
          type: "paragraph",
          content: parseParagraph(children[i])
        }]
      })

    }  
  }

  if(temp){
    output.push(temp);
  }

  return { nodes: output, remaining: i}; // Placeholder
}


/**
 * This function converts rgb color to hex.
 * 
 * @param rgb The css formatted rgb value
 * 
 * @returns A hex color value
 */
function rgbToHex(rgb: string): string {

  // Matcher extracts the R, G, B components of the 
  const result = rgb.match(/\d+/g);

  // Early exit if the RGB is un-parseable
  if (!result){
    return rgb;
  } 

  const [r, g, b] = result.map(Number);

  return "#" + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}



/**
 * This function converts a HTML paragraph element into an ADF object.
 * 
 * @param element HTML Element to parse into ADF content
 * 
 * @returns ADF content
 */
function parseParagraph(element: HTMLElement): RichTextNodeInterface[] {

  const output: RichTextNodeInterface[] = [];

  /**
   * A recursive text parser.
   * 
   * @param node A HTML Node.
   * 
   * @param marks The output text styling attributes
   */
  function walk(node: Node, marks: SpanInterface[] = []) {
    
    if (node.nodeType === Node.TEXT_NODE) {

      const text = node.textContent ?? "";

      if (text.trim() !== "") {
        output.push({ type: "text", text, marks });
      }

    } else if (node.nodeType === Node.ELEMENT_NODE) {

      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();

      // Handle custom element that contains a "mention" leaf node
      if (tag === "mention" && el.classList.contains("custom-mention")) {
        const id = el.dataset.id ?? "";
        const text = el.dataset.text ?? "";
        const accessLevel = el.dataset.accessLevel ?? "";
        const localId = el.dataset.localId ?? "";
        output.push({ type: "mention", attrs: { id: id, text: text, accessLevel: accessLevel, localId: localId } });
        return;
      }else if(tag === "br"){
        output.push({ type: "hardBreak" });
        return;
      }

      const newMarks = [...marks];

      switch (tag) {
        case "strong":
        case "em":
        case "code":
          newMarks.push({ type: tag });

          // Handle color styles
          if (el.style.color) {
            newMarks.push({ type: "textColor", attrs: { color: rgbToHex(el.style.color) } });
          }
          break;
        case "u":
          newMarks.push({ type: "underline" });

          // Handle color styles
          if (el.style.color) {
            newMarks.push({ type: "textColor", attrs: { color: rgbToHex(el.style.color) } });
          }
          break;
        case "s":
          newMarks.push({ type: "strike" });

          // Handle color styles
          if (el.style.color) {
            newMarks.push({ type: "textColor", attrs: { color: rgbToHex(el.style.color) } });
          }
          break;
        case "sub":
          newMarks.push({ type: "subsup", attrs: { type: "sub" } });

          // Handle color styles
          if (el.style.color) {
            newMarks.push({ type: "textColor", attrs: { color: rgbToHex(el.style.color) } });
          }
          break;
        case "sup":
          newMarks.push({ type: "subsup", attrs: { type: "sup" } });

          // Handle color styles
          if (el.style.color) {
            newMarks.push({ type: "textColor", attrs: { color: rgbToHex(el.style.color) } });
          }
          break;
        case "span":

          // Handle color styles
          if (el.style.color) {
            newMarks.push({ type: "textColor", attrs: { color: rgbToHex(el.style.color) } });
          }
          break;
        case "a":
          const href = el.getAttribute("href") || "#";
          newMarks.push({ type: "link", attrs: { href } });

          // Handle color styles
          if (el.style.color) {
            newMarks.push({ type: "textColor", attrs: { color: rgbToHex(el.style.color) } });
          }
          break;
      }

      el.childNodes.forEach(child => walk(child, newMarks));
    }
  }

  element.childNodes.forEach(child => walk(child));

  return output;
}



/**
 * This function converts a HTML Image Element into a ADF compatibel Media Node.
 * 
 * @param html The input HTML Image Element
 * 
 * @returns An ADF media Node.
 */
function createImageADF(html: HTMLImageElement, includeTempMeta: boolean): RichTextNodeInterface {

  // Jira compatible ADF
  const output: RichTextNodeInterface = {
    type: "media",
    attrs: {
      type: "file",
      id: html.dataset.uuid,
      alt: html.alt,
      collection: "",
      height: parseInt(html.dataset.height!),
      width: parseInt(html.dataset.width!)
    }
  }

  // Include Temporary Meta Data
  if(html.dataset.attachment && includeTempMeta){
    output.attrs!["attachment"] = html.dataset.attachment;
  }

  return output;
}

/**
 * This function converts HTML into ADF formatted content.
 * 
 * @param html A parent HTML Node containing a block of content
 * 
 * @returns ADF formatted content
 */
export function parseHTMLtoADF(html: HTMLElement, includeTempMeta: boolean = false): RichTextNodeInterface[]{

  // The final return value
  let output: RichTextNodeInterface[] = [];

  // HTML Array
  const children: ChildNode[] = Array.from(html.children);

  for(let i=0; i<children.length;  i++){

    const child: HTMLElement = children[i] as HTMLElement;

    switch(child.tagName.toLowerCase()){
      case "p":

        // Handle all special <p> wrapped elements
        if(child.children.length > 0 && child.children[0].tagName.toLowerCase() === "img"){

          output.push({
            type: "mediaSingle",
            attrs: {
              layout: "align-start"
            },
            content: [
              createImageADF(child.children[0] as HTMLImageElement, includeTempMeta)
            ]
          });

        }else if(child.children.length === 1 && child.children[0].tagName.toLowerCase() === "br"){
          
          output.push({
            type: "paragraph"
          })

        }else{

          output.push({
            type: "paragraph",
            content: parseParagraph(child as HTMLElement)
          });

        }

        break;
      case "h1":
        output.push({
          type: "heading",
          attrs: { "level": 1 },
          content: parseParagraph(child as HTMLElement)
        }) 
        break;
      case "h2":
        output.push({
          type: "heading",
          attrs: { "level": 2 },
          content: parseParagraph(child as HTMLElement)
        })  
        break;
      case "h3":
        output.push({
          type: "heading",
          attrs: { "level": 3 },
          content: parseParagraph(child as HTMLElement)
        })  
        break;
      case "h4":
        output.push({
          type: "heading",
          attrs: { "level": 4 },
          content: parseParagraph(child as HTMLElement)
        })  
        break;
      case "h5":
        output.push({
          type: "heading",
          attrs: { "level": 5 },
          content: parseParagraph(child as HTMLElement)
        })  
        break;
      case "h6":
        output.push({
          type: "heading",
          attrs: { "level": 6 },
          content: parseParagraph(child as HTMLElement)
        })  
        break;
      case "ol":
        
        if(child.children.length > 0){
          output = [...output, ...parseList(Array.from(child.children) as HTMLElement[]).nodes]
        }        

        break;
      case "br":
        
        output.push({
          type: "hardBreak"
        })
      
      case "img":

        output.push({
          type: "mediaSingle",
          attrs: {
            layout: "align-start"
          },
          content: [
            createImageADF(child as HTMLImageElement, includeTempMeta)
          ]
        });

        break;
      case "div":

        const content: RichTextNodeInterface = JSON.parse(unescapeHTML(child.getAttribute("data-content")!));
        output.push(content);

        break;
      default:
        // Pass
        break;
    }
  }

  return output;
} 


/**
 * This function converts an ADF object into HTML formatted content.
 * 
 * @param content An ADF formated block of content
 * 
 * @param attachments Supplementary attachment information used to populate the output HTML
 * 
 * @param depth The current recursion depth
 * 
 * @param previous The previous node type
 * 
 * @param listType The current list type
 * 
 * @returns HTML formatted text
 */
export function parseADFtoHTML(content: RichTextNodeInterface[] = [], attachments: AttachmentInterface[] = [], depth: number = 0, previous: string | undefined = undefined, listType: string | undefined = undefined): string {

  let output: string = "";
  let index: number = 0;

  while(index < content.length){
    
    switch(content[index].type){
      case "paragraph" :
        if(content[index].content === undefined){
          output += `<p><br></p>`;
        }else if(previous === "listItem"){
          const indentClass = depth > 1 ? ` class="ql-indent-${depth - 1}"` : "";
          const dataList = listType ? `data-list="${listType}"` : "";
          output += `<li${indentClass} ${dataList}><p>${parseADFtoHTML(content[index].content)}</p></li>`;
        }else{
          output += `<p>${parseADFtoHTML(content[index].content)}</p>`;
        }
        break;
      case "heading" :
        if(previous === "listItem"){
          const indentClass = depth > 1 ? ` class="ql-indent-${depth - 1}"` : "";
          const dataList = listType ? `data-list="${listType}"` : "";
          output += `<li${indentClass} ${dataList}><h${content[index].attrs!.level}>${parseADFtoHTML(content[index].content)}</h${content[index].attrs!.level}></li>`;
        }else{
          output += `<h${content[index].attrs!.level}>${parseADFtoHTML(content[index].content)}</h${content[index].attrs!.level}>`;
        }
        break;
      case "hardBreak" :
        output += "<br>"
        break;
      case "text" :
        if(previous === "listItem"){
          const indentClass = depth > 1 ? ` class="ql-indent-${depth - 1}"` : "";
          const dataList = listType ? `data-list="${listType}"` : "";
          output += `<li${indentClass} ${dataList}>${styleText(content[index].text!, content[index].marks)}</li>`;
        }else{
          output += styleText(content[index].text!, content[index].marks);
        }
        break;
      case "mention" :
        if(previous === "listItem"){
          const indentClass = depth > 1 ? ` class="ql-indent-${depth - 1}"` : "";
          const dataList = listType ? `data-list="${listType}"` : "";
          output += `<li${indentClass} ${dataList}>${createMention(content[index].attrs!)}</li>`;
        }else{
          output += createMention(content[index].attrs!);
        }
        break;
      case "codeBlock":
        if(previous === "listItem"){
          const indentClass = depth > 1 ? ` class="ql-indent-${depth - 1}"` : "";
          const dataList = listType ? `data-list="${listType}"` : "";
          output += `<li${indentClass} ${dataList}><code>${parseADFtoHTML(content[index].content)}</code></li>`;
        }else{
          output += `<code>${parseADFtoHTML(content[index].content)}</code>`;
        }
        break;
      case "mediaSingle":
        if(previous === "listItem"){
          const indentClass = depth > 1 ? ` class="ql-indent-${depth - 1}"` : "";
          const dataList = listType ? `data-list="${listType}"` : "";
          output += `<li${indentClass} ${dataList}>${extractMedia(content[index].content![0], attachments)}</li>`;
        }else{
          output += `${extractMedia(content[index].content![0], attachments)}`;
        }
        break;
      case "bulletList":
        if(depth > 0){
          output += `${parseADFtoHTML(content[index].content, attachments, depth + 1, previous, "bullet")}`
        }else{
          output += `<ol>${parseADFtoHTML(content[index].content, attachments, 1, previous, "bullet")}</ol>`
        }
        break;
      case "orderedList":
        if(depth > 0){
          output += `${parseADFtoHTML(content[index].content, attachments, depth + 1, previous, "ordered")}`
        }else{
          output += `<ol>${parseADFtoHTML(content[index].content, attachments, 1, previous, "ordered")}</ol>`
        }
        break;
      case "listItem":
        output += `${parseADFtoHTML(content[index].content, attachments, depth, "listItem", listType)}`
        break;
      default:
        output += `${createSkeleton(content[index])}`;
        break;
    }

    index++;
  }

  return output;
}


/**
 * This function styles text provided in an ADF format.
 * 
 * @param text The contents of the text ADF node.
 * 
 * @param marks The styling to apply to the text.
 * 
 * @returns A HTML string formatted in accordance with the ADF attributes.
 */
function styleText(text: string, marks: SpanInterface[] = []): string{

  let output: string = escapeHTML(text);

  // Return just the text if no styling is applied
  if(marks.length > 0){

    // Infinitely nest
    for(const mark of marks){
      switch (mark.type) {
        case "strong":
          output = `<strong>${output}</strong>`;
          break;
        case "em":
          output = `<em>${output}</em>`;
          break;
        case "underline":
          output = `<u>${output}</u>`;
          break;
        case "strike":
          output = `<s>${output}</s>`;
          break;
        case "code":
          output = `<code>${output}</code>`;
          break;
        case "subsup":
          output = `<${mark.attrs!.type}>${output}</${mark.attrs!.type}>`;
          break;
        case "textColor":
          output = `<span style="color: ${escapeHTML(mark.attrs!.color)}">${output}</span>`;
          break;
        case "link":
          const href = escapeHTML(mark.attrs?.href || "#");
          output = `<a href="${href}" target="_blank" rel="noopener noreferrer">${output}</a>`;
          break;
        default:
          // Pass
          break;
      }
    }

  }

  return output;
}


/**
 * This function creates a custom "mention" element for the rich text editor
 * 
 * @param attrs The ADF "mention" meta-data
 * 
 * @returns A HTML formatted string
 */
function createMention(attrs: Record<string, any>): string {
  return `<mention class="custom-mention" data-id="${attrs.id}" data-text="${attrs.text}" data-accessLevel="${attrs.accessLevel}" data-localId="${attrs.localId}">${attrs.text}</mention>`;
}



/**
 * This function creates a custom "skeleton" element for the rich text editor
 * 
 * @param content The ADF "skeleton" meta-data
 * 
 * @returns A HTML formatted string
 */
function createSkeleton(content: RichTextNodeInterface): string {
  return `<div class="custom-skeleton" data-content="${escapeHTML(JSON.stringify(content))}" contenteditable="false">content cannot be rendered</div>`;
}



/**
 * This function converts strings into HTML friendly "escaped" strings
 * 
 * @param str The string to "escape"
 * 
 * @returns An "escaped" string
 */
export function escapeHTML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}


/**
 * This function converts HTML friendly escaped strings back into valid text
 * 
 * @param str The string to "unescape"
 * 
 * @returns An "un-escaped" string
 */
export function unescapeHTML(str: string): string {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}


/**
 * This function extracts the media data from the ADF Rich Text input and creates HTML output.
 * 
 * @param mediaNode The media node containing the image data
 * 
 * @param attachments Supplementary attachment data.
 * 
 * @returns A HTML image formatted for use in Quill.js
 */
function extractMedia(mediaNode: RichTextNodeInterface, attachments: AttachmentInterface[]): string {

  const uuid: string = mediaNode.attrs!.id;
  let attachmentID: string | undefined;
  let mimeType: string | undefined;
  let output: string = "";

  // If the value is pre-loaded skip retrieval process.
  if(mediaNode.attrs!.attachment){

    attachmentID = mediaNode.attrs!.attachment;
    mimeType = "image"

  }else{

    // Manually retrieve the attachment id
    for(const attachment of attachments){
      if(attachment.uuid && attachment.uuid === uuid){
        attachmentID = attachment.id;
        mimeType = attachment.mimeType;
        break;
      }
    }

  }

  if(attachmentID && mimeType!.includes("image")){
    output = `<p><img class='custom-image' src="/proxy-api?pathname=%2Fattachment%2Fcontent%2F${attachmentID}" data-uuid="${uuid}" data-attachment="${attachmentID}" alt="${mediaNode.attrs!.alt}" data-width="${mediaNode.attrs!.width}" data-height="${mediaNode.attrs!.height}" style="width: ${mediaNode.attrs!.width}px; height: ${mediaNode.attrs!.height}px"></p>`;
  }else{
    output = `<p><img class='custom-image' src="./../altImage.png" data-uuid="${uuid}" alt="Image waiting to render..." data-width="${mediaNode.attrs!.width}" data-height="${mediaNode.attrs!.height}"></p>`;
  }

  return output;
}
