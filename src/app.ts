import OAuthWebservice from './webservice/oauth_webservice';
import Webservice from './webservice/webservice';
import JsonAPIDeserializer, { DataItem, JsonApi } from './drupal_json_deserializer';
import JsonMapper from './mapper';
import { MappedItem, Mapper } from './mapping/interface';
import { Schema, Validator, ValidatorResult } from 'jsonschema';
import { exit } from "process";
import sourceSchema from './schema/jsonapi.json';
import mapping from './schema/mapping.json';
import destinationSchema from './schema/p2881.json';
import md5 from 'md5';

class App {

  validator: Validator;
  sourceWebService: OAuthWebservice;
  destinationWebService: Webservice|undefined;

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

    if (process.env.DESTINATION_HOST) {
      this.destinationWebService = new Webservice(process.env.DESTINATION_HOST);
    }
  }

  /**
   * This methods executes the XIA.
   */
  async run() {
    let url: string|undefined = process.env.SOURCE_ENDPOINT;
    const sourceSchema = await this.getSourceSchema();
    const transformationMapping = this.getTransformationMapping();

    // Get current courses in provider
    const currentRecords = await this.getCurrentDestinationRecords();

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
      const destinationData: MappedItem = await this.transformSourceData(jsonApiData.data, transformationMapping, {});
      // Get the destination schema.
      const destinationSchema = await this.getDestinationSchema();
      const values = Object.values(destinationData);
      for (let i = 0; i < values.length; i++) {
        let value = values[i];
        value = this.addHashes(value);
        // Validate the destination data against the schema.
        const destinationValidated = this.validateData(value, destinationSchema);
        if (!destinationValidated.valid) {
          this.outputToConsole(destinationValidated.errors, 'error');
          exit(2);
        }
        await this.sendDestinationData(value, currentRecords as MappedItem[]|undefined);
      }
      url = jsonApiData.nextPage;
      url = url?.replace(this.sourceWebService.host, '');
    }
    await this.submitDestinationData();
  }

  /**
   * Gets the source data in from the provided URL.
   * @param url The URL path from which to get the data.
   * @returns The source data.
   */
  private async getSourceJSONData(url: string): Promise<unknown> {
    // Request
    this.outputToConsole('requesting data');
    // FIXME: This should really not be JSON:API/Drupal specific.
    if (process.env.SOURCE_ENDPOINT_ADDITIONAL_FILTER_DAYS) {
      let now = parseInt((new Date().getTime() / 1000).toFixed(0));
      // Milliseconds, Seconds, Hours, Day
      now += 60 * 60 * 24 * parseInt(process.env.SOURCE_ENDPOINT_ADDITIONAL_FILTER_DAYS);
      const filter = `filter[status][value]=1&filter[date-group][group][conjunction]=OR&filter[created][condition][path]=created&filter[created][condition][operator]=%3E&filter[created][condition][value]=${now}&filter[created][condition][memberOf]=date-group&filter[changed][condition][path]=changed&filter[changed][condition][operator]=%3E&filter[changed][condition][value]=${now}&filter[changed][condition][memberOf]=date-group`;
      url += `&${filter}`;
    }

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
   * Gets the source schema;
   * intentionally an async method if the
   * schema lives outside this agent.
   * @returns The source schema.
   */
   private async getCurrentDestinationRecords(): Promise<unknown> {
    // Get schema
    this.outputToConsole('requesting source schema');
    if (!this.destinationWebService) {
      return;
    }

    try {
      // FIXME: Has the potential to get a lot of data.
      // This would be better suited if we already knew the data
      // to which to update or insert which out querying the XIS.
      // This is a fail safe though for those IDs that failed to be inserted.
      const query = `provider=${process.env.PROVIDER}`;
      return await this.destinationWebService.request(`${process.env.DESTINATION_ENDPOINT}?${query}`);
    } catch (error) {
      this.outputToConsole(error, 'error');
    }
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
    // Map destination structure
    sourceData.forEach((sourceItem, index) => {
      destinationItem[index] = {};
      Object.keys(mapFile).forEach((mapKey) => {
        const sourceKey = mapFile[mapKey];
        const value = JsonMapper.getValueFromSource(sourceKey, (sourceItem as unknown) as MappedItem);
        if (!value) {
          return;
        }
        JsonMapper.mapValueToDestinationObject(mapKey, value, destinationItem[index] as MappedItem);
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
   * Adds metadata_key and metadata_key_hash.
   * @param value The destination data.
   * @returns The destination data with hash.
   */
  private addHashes(value: MappedItem): MappedItem {
    value["metadata_key_hash"] = md5(value.metadata_key as string);
    value["metadata_hash"] = md5(value.metadata as string);
    return value;
  }

  /**
   * Outputs and/or sends the destination data.
   * @param data The formatted data.
   */
  private async sendDestinationData(data: MappedItem, currentRecords: MappedItem[]|undefined) {
    if (!this.destinationWebService || !process.env.DESTINATION_ENDPOINT) {
      return;
    }
    const currentRecord = currentRecords?.find((record: MappedItem) =>
    (record as MappedItem).unique_identifier === data.unique_identifier) as MappedItem;
    if (currentRecord && data.metadata_hash === currentRecord.metadata_hash) {
      // Nothing to update.
      return;
    }
    this.outputToConsole('sending output');
    this.outputToConsole(JSON.stringify(data, null, 2));
    if (currentRecord) {
      // Specific Implementation for XIS.
      // Once the metadata is inserted into the XIS,
      // it is inserted into a metadata ledger.
      const metadata = data.metadata;
      delete data.metadata;
      data.metadata = {};
      (data.metadata as MappedItem).Metadata_Ledger = metadata;
      try {
        this.outputToConsole('record exists... patching');
        await this.destinationWebService.patch(`${process.env.DESTINATION_ENDPOINT}${data.unique_identifier}/`, data);
      } catch (error) {
        this.outputToConsole(error, 'error');
      }
      return;
    }

    try {
      this.outputToConsole('new record posting');
      await this.destinationWebService.post(process.env.DESTINATION_ENDPOINT, data);
    } catch (error) {
      this.outputToConsole(error, 'error');
    }
  }
  /**
   * Submit the the destination data transactions.
   */
  private async submitDestinationData() {
    this.outputToConsole('submitting destintaion data');
    if (!this.destinationWebService || !process.env.DESTINATION_ENDPOINT_FINALIZE) {
      return;
    }
    try {
      await this.destinationWebService.request(process.env.DESTINATION_ENDPOINT_FINALIZE);
    } catch (error) {
      this.outputToConsole(error, 'error');
    }
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
