import { MappingInterface, MappedItem, MapSourceKey, BaseMapping } from './interface';

export class StringMapping extends BaseMapping implements MappingInterface {
  getValue(sourceKey: MapSourceKey, sourceItem: MappedItem): string[]|string|undefined {
    const value = this.getValueFromKey(sourceKey.key as string, sourceItem);
    return sourceKey.prefix && value ? `${sourceKey.prefix}${value}` : value;
  }
}
