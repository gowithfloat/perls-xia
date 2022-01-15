import * as Mappers from './mapping/';
import { MappedItem, MapSourceKey } from './mapping/interface';

export default class JsonMapper {

  /* istanbul ignore next */ // https://stackoverflow.com/a/59101498
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  private static createInstance(className: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (<any>Mappers)[className]();
  }

  /**
   * Recursively finds a value (or null) from source data for a given key.
   * It uses different mappers to perform different transformations
   * based on the type within the mapper file.
   * @param sourceKey The key to which to traverse to find a value.
   * @param sourceItem The data where to get the value.
   * @returns A string or string[] if the value is found. Undefined if the key is not found.
   */
  static getValueFromSource(sourceKey: MapSourceKey|string, sourceItem: MappedItem): string[]|string|undefined {
      const source: MapSourceKey = typeof sourceKey == "object" ?
      sourceKey :
      {
        "type": "string",
        "key": sourceKey
      };
    const className = source.type[0].toUpperCase() + source.type.slice(1);
    const mapType = `${className}Mapping`;
    const mapper = JsonMapper.createInstance(mapType) as Mappers.MappingInterface;
    return mapper.getValue(source, sourceItem);
  }

  /**
   * Recursively maps data to a particular destination path.
   * @param path The path to which to store the data.
   * @param value The value to store at the path.
   * @param obj The object to which to map the values.
   */
  static mapValueToDestinationObject(path: string, value: string|string[], obj: MappedItem) {
    const parts = path.split(".");
    let part: string | undefined;
    let last = parts.pop();
    if (!last) {
      return;
    }
    part = parts.shift();
    while(part) {
      if (part.includes('[]')) {
        part = part.replace('[]', '');
        if (!part || part.length === 0) {
          return;
        }
        let arrayValue = value;

        if (!obj[part] || !Array.isArray(obj[part])) {
          obj[part] = [];
        }

        if (!Array.isArray(arrayValue)) {
          arrayValue = [arrayValue];
        }
        const self = this;
        const trailingPath = path.slice(path.indexOf(`${part}[]`) + `${part}[].`.length, path.length);

        // Only iterate on the last array on the path
        if (trailingPath.includes('[]')) {
          const index = (obj[part] as MappedItem[]).length > 1 ? (obj[part] as MappedItem[]).length - 1 : 0;
          const arrayObject = (obj[part] as MappedItem[])[index] || {};
          self.mapValueToDestinationObject(trailingPath, value, arrayObject);
          (obj[part] as MappedItem[])[index] = arrayObject;
          return;
        }
        // We check if part if undefined or empty above
        const validatedPart: string = part;
        arrayValue.forEach((v: string|string[], index: number) => {
          const arrayObject = (obj[validatedPart] as MappedItem[])[index] || {};
          self.mapValueToDestinationObject(trailingPath, v, arrayObject);
          (obj[validatedPart] as MappedItem[])[index] = arrayObject;
        });
        return;
      }
      else if (typeof obj[part] != "object") {
        obj[part] = {};
      }
      obj = obj[part] as MappedItem;
      part = parts.shift();
    }
    // Special case when the mapping ends in []
    // Assume the value should be an array
    if (last.length > 2 && last.slice(-2) === "[]") {
      last = last.slice(0, last.length - 2);
      if (typeof value === "string") {
        value = [value];
      }
    }
    (obj[last] as string | string[]) = value;
  }
}
