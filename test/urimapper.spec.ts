import { expect } from 'chai';
import 'mocha';
import { MappedItem } from '../src/mapping/interface';
import { UriMapping } from '../src/mapping';

describe('UriMapping functions', () => {

  const uriMapper = new UriMapping();

  before(() => {
    process.env.SOURCE_HOST = "http://example.com";
  });

  it('should return uri appended with item', () => {
    const mapping  = {
      "type": "uri",
      "uri": "sourceKey"
    };
    const result = uriMapper.getValue(mapping, { sourceKey: "/item" });
    expect(result).to.equal('http://example.com/item');
  });

  it('should return uri appended with path "/node/" and item', () => {
    const mapping  = {
      "type": "uri",
      "uri": "sourceKey",
      "path": "/node/"
    };
    const result = uriMapper.getValue(mapping, { sourceKey: "item" });
    expect(result).to.equal('http://example.com/node/item');
  });

  it('should return nested item', () => {
    const mapping  = {
      "type": "uri",
      "uri": "sourceKey.nested"
    };
    const result = uriMapper.getValue(mapping, { sourceKey: {
      nested: "/nested/item"
    } });
    expect(result).to.equal('http://example.com/nested/item');
  });

  it('should return array of items', () => {
    const mapping  = {
      "type": "uri",
      "uri": "sourceKey[].array"
    };
    const result = uriMapper.getValue(mapping, { sourceKey: [{
        array: "/arrayitemone"
      },{
        array: "/arrayitemtwo"
      }]
    });
    expect(result).to.members(['http://example.com/arrayitemone', 'http://example.com/arrayitemtwo']);
  });

  it('should return array of items with path', () => {
    const mapping  = {
      "type": "uri",
      "uri": "sourceKey[].array",
      "path": "/node"
    };
    const result = uriMapper.getValue(mapping, { sourceKey: [{
        array: "/arrayitemone"
      },{
        array: "/arrayitemtwo"
      }]
    });
    expect(result).to.members(['http://example.com/node/arrayitemone', 'http://example.com/node/arrayitemtwo']);
  });

  it('should return nested array', () => {
    const mapping  = {
      "type": "uri",
      "uri": "sourceKey.nested[]"
    };
    const sourceItem = {
      "sourceKey": {
        "nested": ["/nested/itemone", "/nested/itemtwo"]
      }
    };
    const result = uriMapper.getValue(mapping, (sourceItem as unknown) as MappedItem);
    expect(result).to.members(['http://example.com/nested/itemone', 'http://example.com/nested/itemtwo']);
  });

  it('should return nested array of items', () => {
    const mapping  = {
      "type": "uri",
      "uri": "sourceKey.nested[].array"
    };

    const sourceItem = {
      "sourceKey": {
        "nested": [
          {
            "array": "/nested/item/one"
          },
          {
            "array": "/nested/item/two"
          }
        ]
      }
    };
    const result = uriMapper.getValue(mapping, (sourceItem as unknown) as MappedItem);
    expect(result).to.members(['http://example.com/nested/item/one', 'http://example.com/nested/item/two']);
  });

  it('should return undefined because the key isn\'t defined', () => {
    const mapping  = {
      "type": "uri",
      "uri": "sourceKey1"
    };
    const sourceItem = {
      "sourceKey": {
        "value": "/itemone"
      }
    };

    const result = uriMapper.getValue(mapping, (sourceItem as unknown) as MappedItem);
    expect(result).to.eql(undefined);
  });

});
