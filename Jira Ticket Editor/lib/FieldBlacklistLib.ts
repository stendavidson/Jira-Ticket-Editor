
// Internal Imports
import { IssueInterface } from "@/interfaces/IssueInterface";


/**
 * This function removes unnecessary or difficult to handle fields.
 * 
 * @param data The issue to be "cleansed"
 * 
 * @returns A cleansed issue object
 */
export function getVisibleFields(data: IssueInterface): IssueInterface{

  const blockedFields = new Set([
    "statuscategorychangedate",
    "fixVersions",
    "workratio",
    "watches",
    "lastViewed",
    "created",
    "versions",
    "updated",
    "timeoriginalestimate",
    "aggregatetimeestimate",
    "creator",
    "votes",
    "timespent",
    "aggregatetimespent",
    "aggregatetimeoriginalestimate",
    "customfield_10032",
    "customfield_10000",
    "customfield_10034",
    "customfield_10035",
    "customfield_10031",
    "customfield_10019",
    "customfield_10026"
  ]);

  // Remove unnecessary fields:
  //   > Uneditable fields with no allowed allowedValues --> NOTE: system generated fields are not included in this
  //   > System generated fields fields that contain NO data
  for(const key in data.fields){
    if((data.fields[key] === null || (data.fields[key] instanceof Array && data.fields[key].length === 0)) && data.editmeta.fields[key]?.operations?.length === 0 && data.editmeta.fields[key]?.allowedValues?.length === 0){
      delete data.editmeta.fields[key];
      delete data.fields[key];
    }else if((data.fields[key] === null || (data.fields[key] instanceof Array && data.fields[key].length === 0)) && !data.editmeta.fields.hasOwnProperty(key)){
      delete data.fields[key];
    }
  }

  // Remove blocked fields --> fields deemed unnecessary
  for(const key of blockedFields){
    if(data.fields.hasOwnProperty(key)){
      delete data.fields[key];
    }
    if(data.editmeta.fields.hasOwnProperty(key)){
      delete data.editmeta.fields[key];
    }
  }

  return data;
}