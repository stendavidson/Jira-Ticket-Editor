// Import styles
import styles from "./IssueLinkTypeInput.module.scss";

// External imports
import { useEffect, useState } from "react";
import React from "react";

// Internal imports
import request from "@/lib/NoExceptRequestLib";
import { IssueLinkTypeInterface, IssueLinkTypesResponseInterface, SimplifiedIssueLinkTypeInterface } from "./IssueLinkTypesInterface";


export default function IssueLinkTypeInput({ className, projectID, setLinkType}: { className?: string, projectID: string, setLinkType: (value: SimplifiedIssueLinkTypeInterface) => void}){

  // State values
  const [inputValue, setInputValue] = useState<string>("");
  const [selectedOption, setSelectedOption] = useState<SimplifiedIssueLinkTypeInterface | null>(null);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [permittedValues, setPermittedValues] = useState<SimplifiedIssueLinkTypeInterface[]>([]);
  const [filteredPermittedValues, setFilteredPermittedValues] = useState<SimplifiedIssueLinkTypeInterface[]>([]);
  const [focused, setFocused] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);



  ///////////////////////////////////////////////////////////////////////////////
  //////////////////////////////// API Functions ////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////



  /**
   * This function retrieves the valid options for the dropdown
   * 
   */
  async function getDropdownOptions(){

    // Set Loading
    setLoading(true);
    
    // URL Params
    const url: URL = new URL("/proxy-api", window.location.origin);
    url.searchParams.append("pathname", `/issueLinkType`);
    url.searchParams.append("projectId", projectID);
    url.searchParams.append("elevate", "true");

    // GET request
    const response = await request(
      url.toString(),
      {
        method: "GET"
      }
    );

    // Process response
    let issueLinkTypeResponse: IssueLinkTypesResponseInterface | null = null;
    let issueLinkTypes: IssueLinkTypeInterface[] = [];
    let options: SimplifiedIssueLinkTypeInterface[] = [];

    if(response?.status.toString().startsWith("2")){
      issueLinkTypeResponse = (await response.json()) as IssueLinkTypesResponseInterface;
      issueLinkTypes = issueLinkTypeResponse.issueLinkTypes;
      options = [
        ...(issueLinkTypes.flatMap((value: IssueLinkTypeInterface) => {
          if(value.name !== "relates to"){
            return [{
              id: value.id,
              name: value.inward,
              type: value.name,
              direction: -1
            }];
          }else{
            return [];
          }
        })),
        ...(issueLinkTypes.flatMap((value: IssueLinkTypeInterface) => {
          if(value.name !== "relates to"){
            return [{
              id: value.id,
              name: value.outward,
              type: value.name,
              direction: 1
            }];
          }else{
            return [{
              id: value.id,
              name: value.name,
              type: value.name,
              direction: 1
            }];
          }
        }))
      ]

    }
    
    setPermittedValues(options);
    setFilteredPermittedValues(options);

    // Set NOT Loading
    setLoading(false);
  }



  ///////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////// Callbacks //////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////


  /**
   * This function filters the dropdown list
   * 
   * @param textInput The user input
   */
  function filterDropdown(textInput: string){

    // If allowed values exist - then filtered the restricted list
    if (permittedValues.length > 0) {

      setFilteredPermittedValues(permittedValues.filter((value: SimplifiedIssueLinkTypeInterface) => {
        return (value.name.toLowerCase().includes(textInput.toLowerCase()));
      }));

    }
  }



  ///////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////// Effects ///////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////



  /**
   * This retrieves the initial list of dropdown options - NO LAZY LOADING, ALL OPTIONS ARE 
   * LOADED AT INITIALIZATION.
   */
  useEffect(() => {

    getDropdownOptions();

  }, []);



  return (
    <div className={`${styles.fieldEditor} ${className ? className : ""} ${focused ? styles.focused : ""}`}>
      <input 
        className={styles.inputField} 
        type="text" 
        value={inputValue} 
        placeholder={selectedOption ? selectedOption.name: "Select Link Type..."}
        onFocus={() => {
          setFocused(true);
          setShowDropdown(true);
        }}
        onBlur={() => {
          setInputValue("");
          setFilteredPermittedValues(permittedValues);
          setFocused(false);
          setShowDropdown(false);
        }}
        onInput={(ev: React.ChangeEvent<HTMLInputElement>) => {
          setInputValue(ev.target.value);
          filterDropdown(ev.target.value);
        }}
      />
      <div className={`${styles.fieldDropdown} ${showDropdown ? styles.displayDropdown : ""}`}>
        {
          filteredPermittedValues.map((option: SimplifiedIssueLinkTypeInterface) => {
              if(selectedOption?.id !== option.id){
                return (
                  <div 
                    className={styles.dropdownOption} 
                    onMouseDown={() => {
                      setSelectedOption(option);
                      setLinkType(option);
                    }} 
                    key={option.id + option.direction.toString()}>
                    <p className={styles.dropdownOptionName}>{option.name}</p>
                  </div>
                )
              }
            }
          )
        }
        {loading &&  (
            <div className={styles.invalidDropdownOption}>
              Loading...
            </div>
          )}
      </div>
    </div>
  );
}
