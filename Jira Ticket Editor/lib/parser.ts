import { AttachmentInterface } from "@/interfaces/AttachementInterface";
import request from "./nothrow_request";

export interface RichTextInterface {
  type: string;
  version?: number;
  content?: RichTextNodeInterface[];
}

interface RichTextNodeInterface {
  type: string;
  attrs?: Record<string, any>;
  content?: RichTextNodeInterface[];
  text?: string;
  marks?: SpanInterface[];
}

interface SpanInterface {
  type: string;
  attrs?: Record<string, any>;
}


export function stringToHTML(html: string): HTMLElement{

  const root: HTMLElement = document.createElement("div") as HTMLElement;
  root.innerHTML = html;

  return root;
}



function getIndentLevel(html: HTMLElement): number {
  const indentClass = Array.from(html.classList).find(c => c.startsWith("ql-indent-"));
  return indentClass ? parseInt(indentClass.replace("ql-indent-", ""), 10) : 0;
}



function parseList(elements: HTMLElement[], depth: number = 0): { nodes: RichTextNodeInterface[]; remaining: number } {

  let children: HTMLElement[] = [...elements];

  let index: number = children.length;

  const output: RichTextNodeInterface[] = [];

  let currentListType: string | undefined;

  let temp: RichTextNodeInterface | undefined;

  console.log(`Parsing list depth ${depth}`)

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
        for(let node of recursiveVal.nodes){
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


function rgbToHex(rgb: string): string {
  const result = rgb.match(/\d+/g);
  if (!result) return rgb;
  const [r, g, b] = result.map(Number);
  return "#" + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}



function parseParagraph(element: HTMLElement): RichTextNodeInterface[] {
  const output: RichTextNodeInterface[] = [];

  function walk(node: Node, marks: SpanInterface[] = []) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      if (text) {
        output.push({ type: "text", text, marks });
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();

      const newMarks = [...marks];

      switch (tag) {
        case "strong":
        case "em":
        case "code":
          newMarks.push({ type: tag });
          break;
        case "u":
          newMarks.push({ type: "underline" });
          break;
        case "s":
          newMarks.push({ type: "strike" });
          break;
        case "sub":
          newMarks.push({ type: "subsup", attrs: { type: "sub" } });
          break;
        case "sup":
          newMarks.push({ type: "subsup", attrs: { type: "sup" } });
          break;
        case "span":
          const color = el.style.color ? rgbToHex(el.style.color) : "#000000";
          newMarks.push({ type: "textColor", attrs: { color } });
          break;
        case "a":
          const href = el.getAttribute("href") || "#";
          newMarks.push({ type: "link", attrs: { href } });
          break;
      }

      el.childNodes.forEach(child => walk(child, newMarks));
    }
  }

  element.childNodes.forEach(child => walk(child));

  return output;
}


function createImageADF(html: HTMLImageElement): RichTextNodeInterface {

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

  return output;
}


export function parseHTMLtoADF(html: HTMLElement): RichTextNodeInterface[]{

  // The final return value
  let output: RichTextNodeInterface[] = [];

  // HTML Array
  const children: Element[] = Array.from(html.children);

  for(let i=0; i<children.length;  i++){

    let child: Element = children[i];

    switch(child.tagName.toLowerCase()){
      case "p":
        if(child.children.length > 0 && child.children[0].tagName.toLowerCase() === "img"){

          output.push({
            type: "mediaSingle",
            attrs: {
              layout: "align-start"
            },
            content: [
              createImageADF(child.children[0] as HTMLImageElement)
            ]
          });

        }else if(child.children.length > 0 && child.children[0].tagName.toLowerCase() === "br"){
          
          // pass

        }else{

          output.push({
            type: "paragraph",
            content: /* await */ parseParagraph(child as HTMLElement)
          });

        }

        break;
      case "h1":
        output.push({
          type: "heading",
          attrs: { "level": 1 },
          content: /* await */ parseParagraph(child as HTMLElement)
        }) 
        break;
      case "h2":
        output.push({
          type: "heading",
          attrs: { "level": 2 },
          content: /* await */ parseParagraph(child as HTMLElement)
        })  
        break;
      case "h3":
        output.push({
          type: "heading",
          attrs: { "level": 3 },
          content: /* await */ parseParagraph(child as HTMLElement)
        })  
        break;
      case "h4":
        output.push({
          type: "heading",
          attrs: { "level": 4 },
          content: /* await */ parseParagraph(child as HTMLElement)
        })  
        break;
      case "h5":
        output.push({
          type: "heading",
          attrs: { "level": 5 },
          content: /* await */ parseParagraph(child as HTMLElement)
        })  
        break;
      case "h6":
        output.push({
          type: "heading",
          attrs: { "level": 6 },
          content: /* await */ parseParagraph(child as HTMLElement)
        })  
        break;
      case "ol":
        
        if(child.children.length > 0){
          output = [...output, ...parseList(Array.from(child.children) as HTMLElement[]).nodes]
        }        

        break;
      case "blockquote":
        
        output.push({
          type: "blockquote",
          content: [{
            type: "paragraph",
            content: [{
              type: "text",
              text: child.textContent ?? undefined
            }]
          }]         
        })  
                
        break;
      case "img":

        output.push({
          type: "mediaSingle",
          attrs: {
            layout: "align-start"
          },
          content: [
            createImageADF(child as HTMLImageElement)
          ]
        });

        break;
      default:
        // Pass
        break;
    }

  }

  return output;
} 


export function parseADFtoHTML(content: RichTextNodeInterface[] = [], attachments: AttachmentInterface[] = [], depth: number = 0, previous: string | undefined = undefined, listType: string | undefined = undefined): string {

  let output: string = "";
  let index: number = 0;

  while(index < content.length){
    
    switch(content[index].type){
      case "paragraph" :
        if(previous === "listItem"){
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
      case "text" :
        if(previous === "listItem"){
          const indentClass = depth > 1 ? ` class="ql-indent-${depth - 1}"` : "";
          const dataList = listType ? `data-list="${listType}"` : "";
          output += `<li${indentClass} ${dataList}>${styleText(content[index].text!, content[index].marks)}</li>`;
        }else{
          output += styleText(content[index].text!, content[index].marks);
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
      case "blockquote":
        if(previous === "listItem"){
          const indentClass = depth > 1 ? ` class="ql-indent-${depth - 1}"` : "";
          const dataList = listType ? `data-list="${listType}"` : "";
          output += `<li${indentClass} ${dataList}><blockquote>${parseADFtoHTML(content[index].content)}</blockquote></li>`;
        }else{
          output += `<blockquote>${parseADFtoHTML(content[index].content)}</blockquote>`;
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
        break;
    }

    index++;
  }

  return output;
}


function styleText(text: string, marks: SpanInterface[] = []){

  let output: string = escapeHTML(text);

  // Return just the text if no styling is applied
  if(marks.length > 0){

    // Infinitely nest
    for(let mark of marks){
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
          output = `<span style="color: ${escapeAttr(mark.attrs!.color)}">${output}</span>`;
          break;
        case "link":
          const href = escapeAttr(mark.attrs?.href || "#");
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


function escapeHTML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}


function escapeAttr(str: string): string {
  return str.replace(/"/g, "&quot;").replace(/</g, "&lt;");
}


function extractMedia(mediaNode: RichTextNodeInterface, attachments: AttachmentInterface[]): string {

  const uuid: string = mediaNode.attrs!.id;
  let fileID: string | undefined;
  let mimeType: string | undefined;
  let output: string = "";

  for(let attachment of attachments){

    if(attachment.uuid && attachment.uuid === uuid){
      fileID = attachment.id;
      mimeType = attachment.mimeType;
      break;
    }
  }

  if(fileID && mimeType!.includes("image")){
    output = `<img class='custom-image' src="/proxy-api?pathname=%2Fattachment%2Fcontent%2F${fileID}" data-uuid="${uuid}" alt="${mediaNode.attrs!.alt}" data-width="${mediaNode.attrs!.width}" data-height="${mediaNode.attrs!.height}"><p><br></p><p><br></p>`;
  }

  return output;
}
