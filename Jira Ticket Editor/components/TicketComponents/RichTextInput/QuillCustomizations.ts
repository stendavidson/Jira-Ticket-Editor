
// Imports
import { Quill } from 'react-quill-new';
const Embed = Quill.import('blots/embed');
const SCOPE = Quill.import('parchment').Scope.INLINE;

/**
 * A custom media interface quill & jira ADF compatible
 */
export interface CustomMediaInterface {
  src: string;
  uuid: string;
  alt: string;
  width: number;
  height: number;
}

/**
 * A custom image class to extend quill's functionality.
 */
// @ts-expect-error: BlockEmbed is a class
export class CustomImage extends Embed {
  
  static blotName = 'customImage';
  static tagName = 'img';
  static className = 'custom-image';
  static scope = SCOPE;

  static create(value: CustomMediaInterface): HTMLImageElement {
    const node = super.create() as HTMLImageElement;
    node.setAttribute('src', value.src);
    node.setAttribute('data-uuid', value.uuid);
    node.setAttribute('alt', value.alt);
    node.setAttribute('data-width', value.width.toString());
    node.setAttribute('data-height', value.height.toString());
    node.classList.add(CustomImage.className);
    return node;
  }

  static value(node: HTMLImageElement): CustomMediaInterface {
    return {
      src: node.getAttribute('src') || '',
      uuid: node.getAttribute('data-uuid') || '',
      alt: node.getAttribute('alt') || '',
      width: parseInt(node.getAttribute('data-width') || '') || 0,
      height: parseInt(node.getAttribute('data-height') || '') || 0,
    };
  }

  static formats(node: HTMLImageElement) {
    return {
      src: node.getAttribute('src'),
      uuid: node.getAttribute('data-uuid'),
      alt: node.getAttribute('alt'),
      width: parseInt(node.getAttribute('data-width') || '') || 0,
      height: parseInt(node.getAttribute('data-height') || '') || 0,
    };
  }
}

// Register the custom block(s)
if (typeof window !== 'undefined' && !Quill.imports['formats/customImage']) {
  Quill.register({ 'formats/customImage': CustomImage }, true);
}