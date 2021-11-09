import OAuthWebservice from './webservice/oauth_webservice';
import DrupalJson, { DrupalDataItem, DrupalJsonApi } from './drupal_json_deserializer';
import JsonMapper, { MappedItemsArray, Mapper } from './mapper';
import { Schema, Validator, ValidatorResult } from 'jsonschema';
import { exit } from "process";
import sourceSchema from './schema/jsonapi.json';
import mapping from './schema/mapping.json';
import destinationSchema from './schema/p2881.json';

class App {

  validator: Validator;
  sourceWebService: OAuthWebservice;

  constructor() {
    this.validator = new Validator();
    if (!process.env.SOURCE_HOST ||
      !process.env.SOUCRE_USERNAME ||
      !process.env.SOURCE_PASSWORD ||
      !process.env.SOURCE_CLIENT_ID ||
      !process.env.SOURCE_CLIENT_SECRET) {
        this.outputToConsole('Invalid source properties', 'error');
        exit(-1);

    }

    this.sourceWebService = new OAuthWebservice(
      process.env.SOURCE_HOST,
      process.env.SOUCRE_USERNAME,
      process.env.SOURCE_PASSWORD,
      process.env.SOURCE_CLIENT_ID,
      process.env.SOURCE_CLIENT_SECRET);
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
        this.outputToConsole(sourceValidated.errors, 'error');
        exit(1);
      }
      const drupalData: DrupalJson = new DrupalJson(sourceJSONData as DrupalJsonApi);
      sourceData = sourceData.concat(drupalData.data);
      url = drupalData.nextPage;
      url = url?.replace(this.sourceWebService.host, '');
    }

    const transformationMapping = this.getTransformationMapping();
    const destinationData = await this.transformSourceData(sourceData, transformationMapping as Mapper);
    const destinationSchema = await this.getDestinationSchema();
    const destinationValidated = this.validateData(destinationData, destinationSchema);
    if (!destinationValidated.valid) {
      this.outputToConsole(destinationValidated.errors, 'error');
      exit(2);
    }
    await this.sendDestinationData(destinationData);
    exit();
  }

  private async getSourceJSONData(url: string): Promise<unknown> {
    // Request
    this.outputToConsole('requesting data');
    try {
      return await this.sourceWebService.authenicatedRequest(url);
    } catch (error) {
      this.outputToConsole(error, 'error');
    }
  }

  private async getSourceSchema(): Promise<Schema> {
    // Get schema
    this.outputToConsole('requesting source schema');
    return sourceSchema;
  }

  private validateData(data: unknown, schema: Schema): ValidatorResult {
    // Validate
    this.outputToConsole('validating data');
    return this.validator.validate(data, schema);
  }

  private getTransformationMapping(): unknown {
    // Get mapping
    this.outputToConsole('requesting source to destination mapping');
    return mapping;
  }

  private transformSourceData(sourceData: DrupalDataItem[], mapping: Mapper): unknown {
    // Transform
    this.outputToConsole('transforming source to destination');
    const data = (sourceData as unknown) as MappedItemsArray;
    const mapper = new JsonMapper(data, mapping);
    mapper.mapToDestination();
    return mapper.destination;
  }

  private async getDestinationSchema(): Promise<Schema> {
    // Get P2881 Schema
    this.outputToConsole('requesting destination schema');
    return destinationSchema;
  }

  private async sendDestinationData(data: unknown) {
    this.outputToConsole(data);
    if (!process.env.DESTINATION_ENDPOINT) {
      return;
    }
    // Send
    this.outputToConsole('sending output');
    try {
      await this.sourceWebService.request('/');
    } catch (error) {
      this.outputToConsole(error, 'error');
    }
  }

  private outputToConsole(output: unknown, type = 'verbose') {
    if (!process.env.CONSOLE_OUTPUT) {
      return false;
    }

    switch (process.env.CONSOLE_OUTPUT) {
      case "verbose":
        type == 'verbose' ? console.log(output) : console.error(output);
        break;
      case "error":
        if (type != 'error') {
          break;
        }
        console.error(output);
        break;
      default:
        return;
    }
  }
}

export default App;
