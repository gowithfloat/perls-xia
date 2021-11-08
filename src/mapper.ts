export default class JsonMapper {
  source: any;
  mapper: any;
  destination: any;

  constructor(source: any, mapper: any) {
    this.source = source;
    this.mapper = mapper;
  }

  mapToDestination(): void {
    let destinationItem = {};
    // Map destination structure
    const self = this;
    this.source.forEach((sourceItem: any) => {
      Object.keys(self.mapper).forEach((mapKey) => {
        const sourceKey = self.mapper[mapKey];
        const value = self.getValueFromSource(sourceKey, sourceItem);
        self.toDestationObject(mapKey, value, destinationItem);
      });
    });
    this.destination = destinationItem;
  }

  private getValueFromSource(sourceKey: string, sourceItem: any): any {
    console.log(sourceKey);
    console.log(sourceItem);
    if (sourceKey.startsWith('STATIC::')) {
      return sourceKey.replace('STATIC::', '');
    }
    const keys = sourceKey.split('.');
    let i = 0;
    let sourceObject = sourceItem;

    while (i < keys.length) {
      let key = keys[i];
      if (key.includes('[]')) {
        key = key.replace('[]', '');
        const self = this;
        const elements = keys.splice(i + 1, keys.length).join('.');
        sourceObject = sourceObject[key].map((item: any) => {
          return self.getValueFromSource(elements, item);
        });
        i = keys.length;
        continue;
      }

      sourceObject = sourceObject[key];
      i++;
    }

    return sourceObject;
  }

  private toDestationObject(path: string, value: any, obj: any) {
    console.log(path);
    console.log(value);
    console.log(obj);
    const parts = path.split(".");
    let part: string | undefined;
    const last = parts.pop();
    if (!last) {
      return;
    }

    while(part = parts.shift()) {
      if (part.includes('[]')) {
        part = part.replace('[]', '');
        let arrayValue = value;
        if (!obj[part] || !Array.isArray(obj[part])) {
          obj[part] = [];
        }

        if (!Array.isArray(arrayValue)) {
          arrayValue = [arrayValue];
        }
        const self = this;
        const trailingPath = path.slice(path.indexOf(`${part}[]`) + `${part}[].`.length, path.length);

        // Only iterate on the last array on the path
        if (trailingPath.includes('[]')) {
          let index = obj[part!].length > 1 ? obj[part!].length - 1 : 0;
          let arrayObject = obj[part!][index] || {};
          self.toDestationObject(trailingPath, value, arrayObject);
          obj[part!][index] = arrayObject;
          return;
        }

        arrayValue.forEach((v: any, index: number) => {
          let arrayObject = obj[part!][index] || {};
          self.toDestationObject(trailingPath, v, arrayObject);
          obj[part!][index] = arrayObject;
        });
        return;
      }
      else if (typeof obj[part] != "object") {
        obj[part] = {};
      }
      obj = obj[part];
    }
    obj[last] = value;
  }

}
