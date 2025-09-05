
// Imports
import '@/styles/RichTextInput.css';
import { Quill } from 'react-quill-new';
import request from '@/lib/NoExceptRequestLib';
import { RichTextNodeInterface } from '@/interfaces/RichTextInterface';
import { escapeHTML, unescapeHTML } from './ParserLib';

// Classes to extend
const Embed = Quill.import('blots/embed');
const BlockEmbed = Quill.import('blots/block/embed');

// Quill Scopes
const INLINE_SCOPE = Quill.import('parchment').Scope.INLINE;
const BLOCK_BLOT_SCOPE = Quill.import('parchment').Scope.BLOCK_BLOT;


/**
 * A custom media interface quill & jira ADF compatible
 */
export interface CustomMediaInterface {
  src: string;
  uuid: string;
  attachment: string;
  alt: string;
  width: number;
  height: number;
}


/**
 * This function deletes unnecessary attachements.
 * 
 * @param attachmentID The ID of the attachment being deleted
 */
async function deleteAttachments(attachmentID: string): Promise<void>{

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
 * A custom image class to extend quill's functionality.
 */
export class CustomImage extends (Embed as any) {
  
  static blotName = 'customImage';
  static tagName = 'img';
  static className = 'custom-image';
  static scope = INLINE_SCOPE;

  static create(value: CustomMediaInterface): HTMLImageElement {
    const node = super.create() as HTMLImageElement;
    node.setAttribute('src', value.src);
    node.setAttribute('data-uuid', value.uuid);
    node.setAttribute('data-attachment', value.attachment);
    node.setAttribute('alt', value.alt);
    node.setAttribute('data-width', value.width.toString());
    node.setAttribute('data-height', value.height.toString());
    node.classList.add(CustomImage.className);
    return node;
  }

  static value(node: HTMLImageElement): CustomMediaInterface {
    return {
      src: node.getAttribute('src') ?? '',
      uuid: node.getAttribute('data-uuid') ?? '',
      attachment: node.getAttribute('data-attachment') ?? '',
      alt: node.getAttribute('alt') ?? '',
      width: parseInt(node.getAttribute('data-width') ?? '0') || 0,
      height: parseInt(node.getAttribute('data-height') ?? '0') || 0,
    };
  }

  static formats(node: HTMLImageElement) {
    return {
      src: node.getAttribute('src') ?? '',
      uuid: node.getAttribute('data-uuid') ?? '',
      attachment: node.getAttribute('data-attachment') ?? '',
      alt: node.getAttribute('alt') ?? '',
      width: parseInt(node.getAttribute('data-width') ?? '') || 0,
      height: parseInt(node.getAttribute('data-height') ?? '') || 0,
    };
  }

  deleteAt(index: number, length: number){

    const attachmentID = this.domNode.dataset.attachment;

    if (index === 0 && length === 1 && attachmentID) {
      deleteAttachments(attachmentID);
    }

    super.deleteAt(index, length);
  }
}



/**
 * A custom mention class to extend quill's functionality.
 */
export class CustomMention extends (Embed as any) {
  
  static blotName = 'customMention';
  static tagName = 'mention';
  static className = 'custom-mention';
  static scope = INLINE_SCOPE;

  static create(attrs: Record<string, any>): HTMLElement {
    const node = super.create() as HTMLElement;
    node.setAttribute('data-id', attrs.id);
    node.setAttribute('data-text', attrs.text);
    node.setAttribute('data-accessLevel', attrs.accessLevel);
    node.setAttribute('data-localId', attrs.localId);
    node.textContent = attrs.text;
    node.classList.add(CustomMention.className);
    return node;
  }

  static value(node: HTMLElement) {
    return {
      id : node.getAttribute("data-id") ?? '',
      text : node.getAttribute("data-text") ?? '',
      accessLevel : node.getAttribute("data-accessLevel") ?? '',
      localId : node.getAttribute("data-localId") ?? '',
    };
  }

  static formats(node: HTMLElement) {
    return {
      id : node.getAttribute("data-id") ?? '',
      text : node.getAttribute("data-text") ?? '',
      accessLevel : node.getAttribute("data-accessLevel") ?? '',
      localId : node.getAttribute("data-localId") ?? '',
    };
  }

  length() {
    return 1;
  }

  deleteAt(index: number, length: number) {
    if (index === 0 && length === 1) {
      super.deleteAt(0, 1);
    }
  }
  
}


/**
 * A custom skeleton class to extend quill's functionality.
 */
export class CustomSkeleton extends (BlockEmbed as any) {
  
  static blotName = 'customSkeleton';
  static tagName = 'div';
  static className = 'custom-skeleton';
  static scope = BLOCK_BLOT_SCOPE;

  static create(content: RichTextNodeInterface): HTMLDivElement {
    const node = super.create() as HTMLDivElement;
    node.setAttribute('data-content', escapeHTML(JSON.stringify(content)));
    node.setAttribute('contenteditable', 'false');
    node.textContent = "content cannot be rendered";
    node.classList.add(CustomSkeleton.className);
    return node;
  }

  static value(node: HTMLDivElement): RichTextNodeInterface {
    return JSON.parse(unescapeHTML(node.getAttribute("data-content")!)) as RichTextNodeInterface;
  }

  static formats(node: HTMLDivElement): RichTextNodeInterface {
    return JSON.parse(unescapeHTML(node.getAttribute("data-content")!)) as RichTextNodeInterface;
  }

  length() {
    return 1;
  }

  deleteAt(index: number, length: number) {
    // Overriding an existing method
  }
}



// Register the custom elements
if (typeof window !== 'undefined') {

  if(!Quill.imports['formats/customImage']){
    Quill.register({ 'formats/customImage': CustomImage }, true);
  }

  if(!Quill.imports['formats/customMention']){
    Quill.register({ 'formats/customMention': CustomMention }, true);
  }

  if(!Quill.imports['formats/customSkeleton']){
    Quill.register({ 'formats/customSkeleton': CustomSkeleton }, true);
  }

}

