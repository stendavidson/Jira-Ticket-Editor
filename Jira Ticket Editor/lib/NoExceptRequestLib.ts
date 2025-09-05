
  /**
   * This function performs an exception safe HTTP request - and returns null if an except is thrown.
   * 
   * @param url The request url
   * 
   * @param options Request options
   * 
   * @returns The response as returned from the fetch request or null if an exception has been thrown.
   */
  export default async function request(url: string, options: object): Promise<Response | null>{

    let response;

    try{

      response = await fetch(url, options);

    }catch{

      response = null;

    }

    return response;
  }