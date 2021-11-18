import OAuthWebservice from './webservice/oauth_webservice';
import JsonAPIDeserializer, { DataItem, JsonApi } from './drupal_json_deserializer';
import JsonMapper from './mapper';
import { MappedItem, Mapper } from './mapping/interface';
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
      !process.env.SOURCE_CLIENT_ID ||
      !process.env.SOURCE_CLIENT_SECRET) {
        this.outputToConsole('Invalid source properties', 'error');
        exit(-1);

    }

    this.sourceWebService = new OAuthWebservice(
      process.env.SOURCE_HOST,
      process.env.SOURCE_CLIENT_ID,
      process.env.SOURCE_CLIENT_SECRET);
  }

  /**
   * This methods executes the XIA.
   */
  async run() {
    let url: string|undefined = process.env.SOURCE_ENDPOINT;
    const sourceSchema = await this.getSourceSchema();
    const transformationMapping = this.getTransformationMapping();
    // Set up the destination object.
    let destinationData: MappedItem = {"learning_experience_sets": []};

    // Loop through JSON:API pages. This will download the a single page,
    // then transforms the data by adding all of the included data,
    // then maps each source object within the page to a learning experience.
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
      const jsonApiData = new JsonAPIDeserializer(sourceJSONData as JsonApi);
      destinationData = await this.transformSourceData(jsonApiData.data, transformationMapping, destinationData);
      url = jsonApiData.nextPage;
      url = url?.replace(this.sourceWebService.host, '');
    }

    // Get the destination schema.
    const destinationSchema = await this.getDestinationSchema();
    // Validate the destination data against the schema.
    const destinationValidated = this.validateData(destinationData, destinationSchema);
    if (!destinationValidated.valid) {
      this.outputToConsole(destinationValidated.errors, 'error');
      exit(2);
    }
    await this.sendDestinationData(destinationData);
  }

  /**
   * Gets the source data in from the provided URL.
   * @param url The URL path from which to get the data.
   * @returns The source data.
   */
  private async getSourceJSONData(url: string): Promise<unknown> {
    // Request
    this.outputToConsole('requesting data');
    try {
      return await this.sourceWebService.authenicatedRequest(url);
    } catch (error) {
      this.outputToConsole(error, 'error');
    }
  }

  /**
   * Gets the source schema;
   * intentionally an async method if the
   * schema lives outside this agent.
   * @returns The source schema.
   */
  private async getSourceSchema(): Promise<Schema> {
    // Get schema
    this.outputToConsole('requesting source schema');
    return sourceSchema;
  }

  /**
   * Validates the data against a schema.
   * @param data The data to valid.
   * @param schema The schema to which to validate against.
   * @returns A ValidatorResult which contains if validation succeeded or not.
   */
  private validateData(data: unknown, schema: Schema): ValidatorResult {
    // Validate
    this.outputToConsole('validating data');
    return this.validator.validate(data, schema);
  }

  /**
   * Get the mapping file (from source to destination).
   * @returns The mappin file.
   */
  private getTransformationMapping(): Mapper {
    // Get mapping
    this.outputToConsole('requesting source to destination mapping');
    return mapping as Mapper;
  }

  /**
   * Transforms the source data into learning experiences.
   * @param sourceData The source data.
   * @param mapFile The mapping.
   * @param destinationItem The existing destination object to which to map the data.
   * @returns The destination object after mapping.
   */
  private transformSourceData(sourceData: DataItem[], mapFile: Mapper, destinationItem: MappedItem): MappedItem {
    // Transform
    this.outputToConsole('transforming source to destination');
    const indexOffset = (destinationItem.learning_experience_sets as MappedItem[]).length;
    // Map destination structure
    sourceData.forEach((sourceItem, index) => {
      (destinationItem.learning_experience_sets as MappedItem[])[index + indexOffset] = {};
      Object.keys(mapFile).forEach((mapKey) => {
        const sourceKey = mapFile[mapKey];
        const value = JsonMapper.getValueFromSource(sourceKey, (sourceItem as unknown) as MappedItem);
        if (!value) {
          return;
        }
        JsonMapper.mapValueToDestinationObject(mapKey, value, (destinationItem.learning_experience_sets as MappedItem[])[index + indexOffset]);
      });
    });

    return destinationItem;
  }

  /**
   * Gets the destination schema;
   * intentionally an async method if the
   * schema lives outside this agent.
   * @returns The destination schema.
   */
  private async getDestinationSchema(): Promise<Schema> {
    // Get P2881 Schema
    this.outputToConsole('requesting destination schema');
    return destinationSchema;
  }

  /**
   * Outputs and/or sends the destination data.
   * @param data The formatted data.
   */
  private async sendDestinationData(data: unknown) {
    this.outputToConsole(JSON.stringify(data, null, 2));
    if (!process.env.DESTINATION_ENDPOINT) {
      return;
    }
    // TODO: Send
    this.outputToConsole('sending output');
  }

  /**
  * Gets an output method either console.log or stdout
  */
  private get outputFunction(): (...args: string[]) => void {
    return process.env.NODE_ENV == "debug" ? console.log : process.stdout.write.bind(process.stdout);
  }

  /**
  * Gets an output method either console.error or stderr
  */
  private get errorFunction(): (...args: string[]) => void {
    return process.env.NODE_ENV == "debug" ? console.error : process.stderr.write.bind(process.stderr);
  }

  /**
   * A helper method to output messages and data.
   * @param output The item to output.
   * @param type The type of message verbose|error.
   */
  private async outputToConsole(output: unknown, type = 'verbose') {
    if (!process.env.CONSOLE_OUTPUT) {
      return false;
    }
    const out = typeof output == "string" ? output : JSON.stringify(output, null, 2);
    switch (process.env.CONSOLE_OUTPUT) {
      case "verbose":
        type == 'verbose' ? this.outputFunction(out) : this.errorFunction(out);
        break;
      case "error":
        if (type != 'error') {
          break;
        }
        this.errorFunction(out);
        break;
      default:
        return;
    }
    if (process.env.NODE_ENV != "debug") {
      type == 'verbose' ? this.outputFunction('\n') : this.errorFunction('\n');
    }
  }
}

export default App;
