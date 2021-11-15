export default class JsonMapper {
  source: MappedItemsArray;
  mapper: Mapper;
  destination: unknown;

  constructor(source: MappedItemsArray, mapper: Mapper) {
    this.source = source;
    this.mapper = mapper;
  }

  mapToDestination(): void {
    const destinationItem = {};
    // Map destination structure
    const self = this;
    this.source.forEach((sourceItem) => {
      Object.keys(self.mapper).forEach((mapKey) => {
        const sourceKey = self.mapper[mapKey];
        const value = self.getValueFromSource(sourceKey, sourceItem as MappedItem);
        self.toDestinationObject(mapKey, value, destinationItem);
      });
    });
    this.destination = destinationItem;
  }

  private getValueFromSource(sourceKey: string, sourceItem: MappedItem): string[]|string {
    if (sourceKey.startsWith('STATIC::')) {
      return sourceKey.replace('STATIC::', '');
    }
    const keys = sourceKey.split('.');
    let i = 0;
    let sourceObject: unknown = sourceItem;

    while (i < keys.length) {
      let key = keys[i];
      if (key.includes('[]')) {
        key = key.replace('[]', '');
        const self = this;
        const elements = keys.splice(i + 1, keys.length).join('.');
        sourceObject = ((sourceObject as MappedItem)[key]) as MappedItemsArray;
        sourceObject = (sourceObject as MappedItemsArray).map((item) => {
          return self.getValueFromSource(elements, item as MappedItem) as string[]|string;
        });
        i = keys.length;
        continue;
      }

      sourceObject = (sourceObject as MappedItem)[key] as MappedItem;
      i++;
    }

    return sourceObject as string[]|string;
  }

  private toDestinationObject(path: string, value: string|string[], obj: MappedItem|MappedItemArrayValue) {
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
          const index = (obj[part] as MappedItemsArray).length > 1 ? (obj[part] as MappedItemsArray).length - 1 : 0;
          const arrayObject = (obj[part] as MappedItemsArray)[index] || {};
          self.toDestinationObject(trailingPath, value, arrayObject);
          (obj[part] as MappedItem)[index] = arrayObject;
          return;
        }

        arrayValue.forEach((v: string|string[], index: number) => {
          if (!part || !obj[part]) {
            return;
          }
          const arrayObject = (obj[part] as MappedItemsArray)[index] || {};
          self.toDestinationObject(trailingPath, v, arrayObject);
          (obj[part] as MappedItemsArray)[index] = arrayObject;
        });
        return;
      }
      else if (typeof obj[part] != "object") {
        obj[part] = {};
      }
      obj = obj[part] as MappedItem|MappedItemArrayValue;
      part = parts.shift();
    }
    obj[last] = value;
  }
}

export interface MappedItemGeneric<T> {
  [key: string]: T;
}

export type Mapper = MappedItemGeneric<string>;

// JSON object
export type MappedItem = MappedItemGeneric<unknown>;
// JSON array
export type MappedItemsArray = MappedItemGeneric<unknown>[];
// JSON object of array
export type MappedItemArrayValue = MappedItemGeneric<MappedItemsArray>;
