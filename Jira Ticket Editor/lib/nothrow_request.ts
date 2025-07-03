
export default async function request(url: string, options: object): Promise<Response | null>{

  let response;

  try{

    response = await fetch(url, options);

  }catch(err){

    response = null;

  }

  return response;
}