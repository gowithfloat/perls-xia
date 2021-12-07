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
    if (Array.isArray(uri)) {
      const self = this;
      return uri.map((value) => self.createUri(sourceKey.path, value));
    }
    return this.createUri(sourceKey.path, uri);
  }

  private createUri(path: string|undefined, uri: string) : string {
    const sourceObject = path ? `${process.env.SOURCE_HOST}${path}${uri}` : `${process.env.SOURCE_HOST}${uri}`;
    return sourceObject;
  }
}
