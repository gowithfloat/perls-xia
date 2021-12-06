export interface MappingInterface {
  getValue(sourceKey: MapSourceKey, sourceItem: MappedItem): string[]|string|undefined;
}

export abstract class BaseMapping {
  /**
   * Recursively finds a value (or null) from source data for a given key.
   * @param sourceKey The key to which to traverse to find a value.
   * @param sourceItem The data where to get the value.
   * @returns A string or string[] if the value is found. Undefined if the key is not found.
   */
  getValueFromKey(sourceKey: string, sourceItem: MappedItem): string[]|string|undefined {
    const keys = sourceKey.split('.');
    let i = 0;
    let value: string[]|string|undefined;
    let parsedObject = sourceItem;

    while (i < keys.length) {
      const key = keys[i];
      if (key.includes('[]')) {
        value = this.getValueFromArray(sourceKey, parsedObject, i);
        i = keys.length;
        continue;
      }

      if (!parsedObject) {
        value = undefined;
        return;
      }
      parsedObject = parsedObject[key] as MappedItem;
      if (typeof parsedObject != "object") {
        value = parsedObject;
      }
      i++;
    }
    return value;
  }

  private getValueFromArray(sourceKey: string, sourceItem: MappedItem, index: number): string[]|undefined {
    const keys = sourceKey.split('.');
    const key = keys[index].replace('[]', '');
    const self = this;
    const elements = keys.splice(index + 1, keys.length).join('.');
    const sourceArray = sourceItem[key] as MappedItem[];
    if (!sourceArray || !sourceArray.length) {
      return;
    }
    return sourceArray.map((item) => {
      if (typeof item === "string") {
        return item;
      }
      return self.getValueFromKey(elements, item) as string;
    });
  }
}

export type MapSourceKey = {"type": string, [key: string]: string};
export type Mapper = MappedItemGeneric<string|MapSourceKey>;
export interface MappedItemGeneric<T> { [key: string]: T; }
type MappedItemString = MappedItemGeneric<string>;
type MappedItemObject = MappedItemGeneric<MappedItemGeneric<string>>;
type MappedItemArray = MappedItemGeneric<MappedItemString[]|MappedItemObject[]>;
// JSON object
export type MappedItem = MappedItemString|MappedItemObject|MappedItemArray;
