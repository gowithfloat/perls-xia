import axios from 'axios';

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


    const formData = Object.entries(data).map(function(d) {
      return encodeURIComponent(d[0]) + '=' + encodeURIComponent(d[1]);
    }).join('&');
    const response = await axios.post<string, ServerResponse<OAuth2Response>>(`${host}/oauth/token`, formData, {
      withCredentials: true
    });
    this.access_token = response.data.access_token;
  }


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

  async request(url: string): Promise<unknown> {
    return await axios.get(`${this.host}${url}`);
  }
}

interface ServerResponse<T> {
  data: T
}

interface OAuth2Request {
  grant_type: string,
  client_id: string,
  client_secret: string,
  username: string,
  password: string
}

interface OAuth2Response {
  access_token: string,
  refresh_token: string
}

export default OAuthWebservice;
