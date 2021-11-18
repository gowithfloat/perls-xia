/**
 * This deserializes the JSON:API response
 * by automatically including the relationships
 * the request contains.
 */
class JsonAPIDeserializer {

  data: DataItem[];
  included: DataItem[]|undefined;
  nextPage: string|undefined;

  constructor(json: JsonApi) {
    this.data = json.data;
    this.mapIncludedData(json.included);
    this.nextPage = json.links?.next?.href;
  }

  private mapIncludedData(included: DataItem[]|undefined): void {
    if (!this.data || !included) {
      return;
    }

    const mappedIncluded: Includes = {};
    const self = this;
    included?.forEach((includedItem) => {
      // Map relationships inside included
      if(includedItem.relationships) {
        Object.keys(includedItem.relationships).forEach((relationshipKey) => {
          if (!includedItem.relationships || !includedItem.relationships[relationshipKey]) {
            return;
          }
          const itemData = includedItem.relationships[relationshipKey].data;
          if (!itemData) {
            return;
          }

          if (Array.isArray(itemData)) {
            itemData.forEach((d, dIndex) => {
              if (!includedItem.relationships) {
                return;
              }
              const value = included.find((i) => {
                return i.id == itemData[dIndex].id && i.type == itemData[dIndex].type;
              });
              if (!value) {
                return;
              }
              (includedItem.relationships[relationshipKey].data as DataItem[])[dIndex] = value;
            });
          }

          if ("type" in itemData) {
            const value = included.find((i) => {
              return i.id == itemData.id && i.type == itemData.type;
            });
            includedItem.relationships[relationshipKey].data = value;
            return;
          }
        });
      }

      if (!includedItem.type || !includedItem.id) {
        return;
      }
      if (!mappedIncluded[includedItem.type]) {
        mappedIncluded[includedItem.type] = {};
      }
      mappedIncluded[includedItem.type][includedItem.id] = includedItem;
    });

    // Map [included] relationships for data.
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
            (data[relationshipKey].data as DataItem[])[dIndex] = self.lookupIncluded(d, mappedIncluded);
          });
        }

        if ("type" in itemData) {
          const data = self.data[dataIndex].relationships || {};
          data[relationshipKey].data = self.lookupIncluded(itemData as DataItem, mappedIncluded);
          return;
        }
      });
    });
  }

  private lookupIncluded(itemData: DataItem, mappedIncluded: Includes): DataItem {
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

export interface JsonApi {
  data: DataItem[];
  included: DataItem[]|undefined;
  links: DataLinks|undefined;
}

export interface DataItem {
  type: string|undefined;
  id: string|undefined;
  links: DataLinks|undefined;
  relationships: DataRelationship|undefined;
}

interface DataLinks {
  self: DataLink|undefined;
  related: DataLink|undefined;
  next: DataLink|undefined;
}

interface DataLink {
  href: string|undefined;
}

interface DataRelationship {
  [key: string]: {
    data: DataItem|DataItem[]|undefined;
    links: DataLinks;
  }
}

interface Includes {
  [key: string]: {
    [key: string]: DataItem
  }
}

export default JsonAPIDeserializer;
