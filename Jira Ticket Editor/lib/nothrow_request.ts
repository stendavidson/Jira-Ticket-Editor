
export default async function request(url: string, options: object): Promise<Response | null>{

  let response;

  try{

    response = await fetch(url, options);

  }catch(err){

    console.error(err); // Remove in production
    response = null;

  }

  return response;
}