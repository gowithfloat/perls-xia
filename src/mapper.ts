import * as Mappers from './mapping/';
import { MappedItem, MapSourceKey } from './mapping/interface';

export default class JsonMapper {

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
        "value": sourceKey
      };
    const mapType = `${JsonMapper.capitalize(source.type)}Mapping`;
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
    const last = parts.pop();
    if (!last) {
      return;
    }
    part = parts.shift();
    while(part) {
      if (part.includes('[]')) {
        part = part.replace('[]', '');
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
        if (trailingPath.includes('[]') && part) {
          const index = (obj[part] as MappedItem[]).length > 1 ? (obj[part] as MappedItem[]).length - 1 : 0;
          const arrayObject = (obj[part] as MappedItem[])[index] || {};
          self.mapValueToDestinationObject(trailingPath, value, arrayObject);
          (obj[part] as MappedItem[])[index] = arrayObject;
          return;
        }

        arrayValue.forEach((v: string|string[], index: number) => {
          if (!part || !obj[part]) {
            return;
          }
          const arrayObject = (obj[part] as MappedItem[])[index] || {};
          self.mapValueToDestinationObject(trailingPath, v, arrayObject);
          (obj[part] as MappedItem[])[index] = arrayObject;
        });
        return;
      }
      else if (typeof obj[part] != "object") {
        obj[part] = {};
      }
      obj = obj[part] as MappedItem;
      part = parts.shift();
    }
    (obj[last] as string | string[]) = value;
  }

  private static capitalize(s: string) {
      return s[0].toUpperCase() + s.slice(1);
  }
}
