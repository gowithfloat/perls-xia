import axios from 'axios';
import Webservice from './webservice';

class OAuthWebservice extends Webservice {

  client_id: string
  client_secret: string

  access_token: string|undefined;

  constructor(host: string, client_id: string, client_secret: string) {
    super(host);
    this.client_id = client_id;
    this.client_secret = client_secret;
  }

  /**
   * Method to request OAuth tokens via client credential grant type.
   */
  async getAuthentication() {
    const host = this.host;
    const client_id = this.client_id;
    const client_secret = this.client_secret;

    const data: OAuth2ClientRequest = {
        grant_type: "client_credentials",
        client_id,
        client_secret
    };

    const formData = Object.entries(data).map(function(d) {
      return encodeURIComponent(d[0]) + '=' + encodeURIComponent(d[1]);
    }).join('&');
    const response = await axios.post<string, ServerResponse<OAuth2Response>>(`${host}/oauth/token`, formData);
    this.access_token = response.data.access_token;
  }

  /**
   * A method to request data from a server.
   * Automatically gets OAuth2 token if one does not exist.
   * This method is basic and assumes a token will live through
   * the process.
   * @param url The path of the URL to which to get information.
   * @returns The response.
   */
  async authenicatedRequest(url: string): Promise<unknown> {
    if (!this.access_token) {
      await this.getAuthentication();
    }

    const response = await axios.get(`${this.host}${url}`, {
      headers: {
        "Authorization": `Bearer ${this.access_token}`,
        "Accept": "*/*"
      }
    });
    return response.data;
  }
}

interface ServerResponse<T> {
  data: T
}

interface OAuth2ClientRequest {
  grant_type: string,
  client_id: string,
  client_secret: string
}

interface OAuth2Response {
  access_token: string,
  refresh_token: string
}

export default OAuthWebservice;
