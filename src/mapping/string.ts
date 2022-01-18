import { MappingInterface, MappedItem, MapSourceKey, BaseMapping } from './interface';

export class StringMapping extends BaseMapping implements MappingInterface {
  getValue(sourceKey: MapSourceKey, sourceItem: MappedItem): string[]|string|undefined {
    let value = this.getValueFromKey(sourceKey.key as string, sourceItem);
    if (!value) {
      return value;
    }
    if (sourceKey.prefix) {
      value = `${sourceKey.prefix}${value}`;
    }
    if (sourceKey.suffix) {
      value = `${value}${sourceKey.suffix}`;
    }

    return value;
  }
}
