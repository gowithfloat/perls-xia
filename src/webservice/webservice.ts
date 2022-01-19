import axios from 'axios';

class Webservice {

  host: string

  constructor(host: string) {
    this.host = host;
  }

  /**
   * A method to post data to a server.
   * @param url The path of the URL to which to post information.
   * @param data The data to post.
   * @returns The response data.
   */
  async post(url: string, data: object): Promise<unknown> {
    const response = await axios.post(`${this.host}${url}`, data);
    return response.data;
  }

  /**
   * A method to post data to a server.
   * @param url The path of the URL to which to post information.
   * @param data The data to post.
   * @returns The response data.
   */
  async patch(url: string, data: object): Promise<unknown> {
    const response = await axios.patch(`${this.host}${url}`, data);
    return response.data;
  }

  /**
   * Basic request with no authentication.
   * @param url The path of the URL to which to get information.
   * @returns The response.
   */
  async request(url: string): Promise<unknown> {
    return (await axios.get(`${this.host}${url}`)).data;
  }
}

export default Webservice;
