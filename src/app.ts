import OAuthWebservice from './webservice/oauth_webservice';
import DrupalJson, { DrupalDataItem, DrupalJsonApi } from './drupal_json_deserializer';
import JsonMapper from './mapper';
import { Schema, Validator } from 'jsonschema';
import { exit } from "process";
var sourceSchema = require('./schema/jsonapi.json');
var mapping = require('./schema/mapping.json');
var destinationSchema = require('./schema/p2881.json');

class App {

  validator: Validator;
  sourceWebService: OAuthWebservice;

  constructor() {
    this.validator = new Validator();
    this.sourceWebService = new OAuthWebservice(
      process.env.SOURCE_HOST!,
      process.env.SOUCRE_USERNAME!,
      process.env.SOURCE_PASSWORD!,
      process.env.SOURCE_CLIENT_ID!,
      process.env.SOURCE_CLIENT_SECRET!);
  }

  async run() {

    let url: string|undefined = process.env.SOURCE_ENDPOINT;
    let sourceData: DrupalDataItem[] = [];
    const sourceSchema = await this.getSourceSchema();

    while (url) {
      const sourceJSONData = await this.getSourceJSONData(url);
      if (!sourceJSONData) {
        url = undefined;
        return;
      }
      const sourceValidated = this.validateData(sourceJSONData, sourceSchema);
      if (!sourceValidated.valid) {
        console.error(sourceValidated.errors);
        exit(1);
      }
      const drupalData: DrupalJson = new DrupalJson(sourceJSONData as DrupalJsonApi);
      sourceData = sourceData.concat(drupalData.data);
      url = drupalData.nextPage;
      url = url?.replace(this.sourceWebService.host, '');
    }

    const transformationMapping = this.getTransformationMapping();
    const destinationData = await this.transformSourceData(sourceData, transformationMapping);
    const destinationSchema = await this.getDestinationSchema();
    const destinationValidated = this.validateData(destinationData, destinationSchema);
    if (!destinationValidated.valid) {
      console.error(destinationValidated.errors);
      exit(2);
    }

    this.outputDestinationData(destinationData);
    await this.sendDestinationData(destinationData);
    exit();
  }

  private async getSourceJSONData(url: string): Promise<any> {
    // Request
    console.log('requesting data');
    try {
      return await this.sourceWebService.authenicatedRequest(url);
    } catch (error) {
      console.error(error);
    }
  }

  private async getSourceSchema(): Promise<Schema> {
    // Get schema
    console.log('requesting source schema');
    return sourceSchema;
  }

  private validateData(data: any, schema: Schema): any {
    // Validate
    console.log('validating data');
    return this.validator.validate(data, schema);
  }

  private getTransformationMapping(): any {
    // Get mapping
    console.log('requesting source to destination mapping');
    return mapping;
  }

  private transformSourceData(sourceData: any, mapping: any): any {
    // Transform
    console.log('transforming source to destination');
    const mapper = new JsonMapper(sourceData, mapping);
    mapper.mapToDestination();
    return mapper.destination;
  }

  private async getDestinationSchema(): Promise<any> {
    // Get P2881 Schema
    console.log('requesting destination schema');
    return destinationSchema;
  }

  private outputDestinationData(data: object) {
    // Output
    console.log('Outputting data');
    console.log(data);

  }

  private async sendDestinationData(data: object) {
    if (!process.env.DESTINATION_ENDPOINT) {
      return
    }
    // Send
    console.log('sending output');
    try {
      await this.sourceWebService.request('/');
    } catch (error) {
      console.log(error);
    }
  }
}

export default App;
