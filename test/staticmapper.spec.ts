import { expect } from 'chai';
import 'mocha';
import { MappedItem } from '../src/mapping/interface';
import { StaticMapping } from '../src/mapping';

describe('StaticMapper functions', () => {

  const staticMapper = new StaticMapping();

  it('should return item', () => {
    const mapping  = {
      "type": "static",
      "key": "sourceKey",
      "value": "tag"
    };
    const result = staticMapper.getValue(mapping, { sourceKey: "item" });
    expect(result).to.equal('tag');
  });

  it('should return nested item', () => {
    const mapping  = {
      "type": "static",
      "key": "sourceKey.nested",
      "value": "tag"
    };
    const result = staticMapper.getValue(mapping, { sourceKey: {
      nested: "nested item"
    } });
    expect(result).to.equal('tag');
  });

  it('should return array of items', () => {
    const mapping  = {
      "type": "static",
      "key": "sourceKey[].array",
      "value": "tag"
    };
    const result = staticMapper.getValue(mapping, { sourceKey: [{
        array: "array item one"
      },{
        array: "array item two"
      }]
    });
    expect(result).to.members(['tag', 'tag']);
  });

  it('should return nested array', () => {
    const mapping  = {
      "type": "static",
      "key": "sourceKey.nested[]",
      "value": "tag"
    };
    const sourceItem = {
      "sourceKey": {
        "nested": ["nested item one", "nested item two"]
      }
    };
    const result = staticMapper.getValue(mapping, (sourceItem as unknown) as MappedItem);
    expect(result).to.members(['tag', 'tag']);
  });

  it('should return nested array of items', () => {
    const mapping  = {
      "type": "static",
      "key": "sourceKey.nested[].array",
      "value": "tag"
    };

    const sourceItem = {
      "sourceKey": {
        "nested": [
          {
            "array": "nested item one"
          },
          {
            "array": "nested item two"
          }
        ]
      }
    };
    const result = staticMapper.getValue(mapping, (sourceItem as unknown) as MappedItem);
    expect(result).to.members(['tag', 'tag']);
  });

  it('should return null because the key isn\'t defined', () => {
    const mapping  = {
      "type": "static",
      "key": "sourceKey1",
      "value": "tag"
    };
    const sourceItem = {
      "sourceKey": {
        "value": "item one"
      }
    };

    const result = staticMapper.getValue(mapping, (sourceItem as unknown) as MappedItem);
    expect(result).to.eql(undefined);
  });

  it('should return value because the key isn\'t defined in mapping', () => {
    const mapping  = {
      "type": "static",
      "value": "tag"
    };
    const sourceItem = {
      "sourceKey": {
        "value": "item one"
      }
    };

    const result = staticMapper.getValue(mapping, (sourceItem as unknown) as MappedItem);
    expect(result).to.eql("tag");
  });
});
