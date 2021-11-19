import { MappingInterface, MappedItem, MapSourceKey, BaseMapping } from './interface';


export class StaticMapping extends BaseMapping implements MappingInterface {
  getValue(sourceKey: MapSourceKey, sourceItem: MappedItem): string[]|string|undefined {
    if (!sourceKey.key) {
      return sourceKey.value as string;
    }

    const keys = this.getValueFromKey(sourceKey.key as string, sourceItem);
    if (!keys) {
      return;
    }

    if (Array.isArray(keys)) {
      return keys.map(() => sourceKey.value as string);
    }
    return sourceKey.value as string;
  }
}
