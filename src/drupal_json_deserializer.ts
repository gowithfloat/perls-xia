class DrupalJson {

  data: DrupalDataItem[];
  included: DrupalDataItem[]|undefined;
  nextPage: string|undefined;

  constructor(json: DrupalJsonApi) {
    this.data = json.data;
    this.mapIncludedData(json.included);
    this.nextPage = json.links?.next?.href;
  }

  private mapIncludedData(included: DrupalDataItem[]|undefined): void {
    if (!this.data || !included) {
      return;
    }

    const mappedIncluded: DrupalIncludes = {};
    included?.forEach((includedItem) => {
      if (!includedItem.type || !includedItem.id) {
        return;
      }
      if (!mappedIncluded[includedItem.type]) {
        mappedIncluded[includedItem.type] = {};
      }
      mappedIncluded[includedItem.type][includedItem.id] = includedItem;
    });

    const self = this;
    this.data.forEach((item, dataIndex) => {
      if(!item.relationships) {
        return;
      }
      Object.keys(item.relationships).forEach((relationshipKey) => {
        if (!item.relationships || !item.relationships[relationshipKey]) {
          return;
        }
        const itemData = item.relationships[relationshipKey].data;
        if (!itemData) {
          return;
        }

        if (Array.isArray(itemData)) {
          itemData.forEach((d, dIndex) => {
            const data = self.data[dataIndex].relationships || {};
            (data[relationshipKey].data as DrupalDataItem[])[dIndex] = self.lookupIncluded(d, mappedIncluded);
          });
        }

        if ("type" in itemData) {
          const data = self.data[dataIndex].relationships || {};
          data[relationshipKey].data = self.lookupIncluded(itemData as DrupalDataItem, mappedIncluded);
          return;
        }
      });
    });
  }

  private lookupIncluded(itemData: DrupalDataItem, mappedIncluded: DrupalIncludes): DrupalDataItem {
    const itemType = itemData.type;
    const itemId = itemData.id;
    if (!itemType || !itemId) {
      return itemData;
    }
    if (!mappedIncluded[itemType] || !mappedIncluded[itemType][itemId]) {
      return itemData;
    }

    return mappedIncluded[itemType][itemId];
  }
}

export interface DrupalJsonApi {
  data: DrupalDataItem[];
  included: DrupalDataItem[]|undefined;
  links: DrupalDataLinks|undefined;
}

export interface DrupalDataItem {
  type: string|undefined;
  id: string|undefined;
  links: DrupalDataLinks|undefined;
  attributes: DrupalDataAttribute|undefined;
  relationships: DrupalDataRelationship|undefined;
}

interface DrupalDataLinks {
  self: DrupalDataLink|undefined;
  related: DrupalDataLink|undefined;
  next: DrupalDataLink|undefined;
}

interface DrupalDataLink {
  href: string|undefined;
}

interface DrupalDataAttribute {
  drupal_internal__nid: number;
  drupal_internal__vid: number;
  langcode: string;
  revision_timestamp: string;
  revision_log: string|undefined;
  status: boolean;
  title: string;
  created: string;
  changed: string;
  promote: boolean;
  sticky: boolean;
  default_langcode: boolean;
  revision_translation_affected: boolean;
  path: { alias: string; pid: number; langcode: string; }|undefined;
}

interface DrupalDataRelationship {
  [key: string]: {
    data: DrupalDataItem|DrupalDataItem[]|undefined;
    links: DrupalDataLinks;
  }
}

interface DrupalIncludes {
  [key: string]: {
    [key: string]: DrupalDataItem
  }
}

export default DrupalJson;
