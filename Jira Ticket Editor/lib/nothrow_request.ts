
export default async function request(url: string, options: object): Promise<Response | null>{

  let response;

  try{

    response = await fetch(url, options);

    // If the request is invalid - return null
    if(response.status.toString().startsWith("4") || response.status.toString().startsWith("5")){
      response = null;
    }

  }catch(err){

    console.error(err); // Remove in production
    response = null;

  }

  return response;
}