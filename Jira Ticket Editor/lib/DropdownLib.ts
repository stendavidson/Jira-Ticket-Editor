  
/**
 * This function is used to detect if insufficient dropdown options are visible and load more.
 * 
 * @param loader The element used to trigger loading - if visible
 * 
 * @param parentContainer The parent element used to detect if the "loader" is visible
 * 
 * @param showDropdown The visibility of the parent element
 * 
 * @param textInput The user's input
 * 
 * @param getDropdownOptions The function being used to retrieve the dropdown options
 * 
 * @param overrideToken A boolean indicator
 */
export function checkIfLoaderVisibleAndFetch(loader: HTMLDivElement | null, parentContainer: HTMLDivElement | null, showDropdown: boolean, textInput: string, getDropdownOptions: (textInput: string, overrideToken?: boolean) => Promise<void>, overrideToken: boolean = false) {

  // Early exit
  if (!loader || !parentContainer || !showDropdown){
    return;
  }

  const loaderRect = loader.getBoundingClientRect();
  const parentRect = parentContainer.getBoundingClientRect();

  // Check if loader is visible inside parent container
  const visibleInParent =
    loaderRect.top <= parentRect.bottom &&
    loaderRect.bottom >= parentRect.top;

  // Check if loader is visible inside viewport
  const visibleInViewport =
    loaderRect.top <= window.innerHeight &&
    loaderRect.bottom >= 0 &&
    loaderRect.left <= window.innerWidth &&
    loaderRect.right >= 0;

  if(visibleInParent && visibleInViewport){
    getDropdownOptions(textInput, overrideToken);
  }
}