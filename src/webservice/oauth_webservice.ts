import axios, { AxiosRequestConfig, AxiosPromise } from 'axios';
var FormData = require('form-data');

class OAuthWebservice {

  host: string
  username: string
  password: string
  client_id: string
  client_secret: string

  access_token: string|undefined;

  constructor(host: string, username: string, password: string, client_id: string, client_secret: string) {
    this.host = host;
    this.username = username;
    this.password = password;
    this.client_id = client_id;
    this.client_secret = client_secret;
  }

  async getAuthentication() {
    const host = this.host;
    const username = this.username;
    const password = this.password;
    const client_id = this.client_id;
    const client_secret = this.client_secret;

    const data: OAuth2Request = {
        grant_type: "password",
        client_id,
        client_secret,
        username,
        password
    };


    var formData = Object.entries(data).map(function(d) {
      return encodeURIComponent(d[0]) + '=' + encodeURIComponent(d[1])
    }).join('&')

    try {
      const response = await axios.post<string, ServerResponse>(`${host}/oauth/token`, formData, {
        withCredentials: true
      });
      this.access_token = response.data["access_token"];
    } catch (error) {
      console.error(error);

    }
  }


  async authenicatedRequest(url: string): Promise<any> {
    if (!this.access_token) {
      await this.getAuthentication();
    }

    try {
      const response = await axios.get(`${this.host}${url}`, {
        headers: {
          "Authorization": `Bearer ${this.access_token}`,
          "Accept": "*/*"
        }
      });
      return response.data;
    } catch (error) {
      console.error(error);
    }
  }

  async request(url: string): Promise<any> {
    return await axios.get(`${this.host}${url}`);
  }
}

interface ServerResponse {
  data: any
}

interface OAuth2Request {
  grant_type: string,
  client_id: string,
  client_secret: string,
  username: string,
  password: string
}

export default OAuthWebservice;
