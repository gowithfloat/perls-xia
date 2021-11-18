import { MappingInterface, MappedItem, MapSourceKey, BaseMapping } from './interface';

export class StringMapping extends BaseMapping implements MappingInterface {
  getValue(sourceKey: MapSourceKey, sourceItem: MappedItem): string[]|string|undefined {
    return this.getValueFromKey(sourceKey.value as string, sourceItem);
  }
}
