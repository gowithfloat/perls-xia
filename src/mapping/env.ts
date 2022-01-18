import { MappingInterface, MappedItem, MapSourceKey, BaseMapping } from './interface';

export class EnvMapping extends BaseMapping implements MappingInterface {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getValue(sourceKey: MapSourceKey, sourceItem: MappedItem): string[]|string|undefined {
    const value = process.env[sourceKey.key];
    return sourceKey.prefix && value ? `${sourceKey.prefix}${value}` : value;
  }
}
