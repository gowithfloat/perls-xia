import { MappingInterface, MappedItem, MapSourceKey, BaseMapping } from './interface';

/**
 * A mapping which prepends the env host name and allows mapping to specify
 * a pre-pending path.
 */
export class UriMapping extends BaseMapping implements MappingInterface {
  getValue(sourceKey: MapSourceKey, sourceItem: MappedItem): string[]|string|undefined {
    const uri = this.getValueFromKey(sourceKey.uri as string, sourceItem) as string;
    if (!uri) {
      return;
    }
    const sourceObject = sourceKey.path ? `${process.env.SOURCE_HOST}${sourceKey.path}${uri}` : `${process.env.SOURCE_HOST}${uri}`;
    return sourceObject;
  }
}
