import { expect } from 'chai';
import 'mocha';
import { StringMapping } from '../src/mapping';
import { MappedItem } from '../src/mapping/interface';

describe('StringMapper functions', () => {

  const stringMapper = new StringMapping();

  it('should return item', () => {
    const mapper = {
      type: "string",
      key: "sourceKey"
    };
    const result = stringMapper.getValue(mapper, { sourceKey: "item" });
    expect(result).to.equal('item');
  });

  it('should return nested item', () => {
    const mapper = {
      type: "string",
      key: "sourceKey.nested"
    };
    const result = stringMapper.getValue(mapper, { sourceKey: {
      nested: "nested item"
    } });
    expect(result).to.equal('nested item');
  });

  it('should return array of items', () => {
    const mapper = {
      type: "string",
      key: "sourceKey[].array"
    };
    const result = stringMapper.getValue(mapper, { sourceKey: [{
      array: "array item one"
    },{
      array: "array item two"
    }]
    });
    expect(result).to.members(["array item one", "array item two"]);
  });

  it('should return nested array', () => {
    const mapper = {
      type: "string",
      key: "sourceKey.nested[]"
    };
    const sourceItem = {
      "sourceKey": {
        "nested": ["nested item one", "nested item two"]
      }
    };
    const result = stringMapper.getValue(mapper, (sourceItem as unknown) as MappedItem);
    expect(result).to.members(["nested item one", "nested item two"]);
  });

  it('should return nested array of items', () => {
    const mapper = {
      type: "string",
      key: "sourceKey.nested[].array"
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
    const result = stringMapper.getValue(mapper, (sourceItem as unknown) as MappedItem);
    expect(result).to.members(["nested item one", "nested item two"]);
  });

  it('should return undefined because the key isn\'t defined', () => {
    const mapping  = {
      "type": "string",
      "key": "sourceKey1"
    };
    const sourceItem = {
      "sourceKey": {
        "value": "item one"
      }
    };

    const result = stringMapper.getValue(mapping, (sourceItem as unknown) as MappedItem);
    expect(result).to.eql(undefined);
  });
});
