import { expect } from 'chai';
import 'mocha';
import JsonMapper from '../src/mapper';
import { MappedItem } from '../src/mapping/interface';

describe('JsonMapper Get Value functions', () => {

  before(() => {
    process.env.SOURCE_HOST = "http://example.com";
  });

  it('should return test the selection of default (string) mapper', () => {
    const mapping  = "sourceKey";
    const result = JsonMapper.getValueFromSource(mapping, { sourceKey: "item" });
    expect(result).to.equal('item');
  });

  it('should return test the selection of string mapper', () => {
    const mapping  = {
      "type": "string",
      "key": "sourceKey",
    };
    const result = JsonMapper.getValueFromSource(mapping, { sourceKey: "item" });
    expect(result).to.equal('item');
  });

  it('should return test the selection of static mapper', () => {
    const mapping  = {
      "type": "static",
      "key": "sourceKey",
      "value": "tag"
    };
    const result = JsonMapper.getValueFromSource(mapping, { sourceKey: "item" });
    expect(result).to.equal('tag');

  });

  it('should return test the selection of uri mapper', () => {
    const mapping  = {
      "type": "uri",
      "uri": "sourceKey"
    };
    const result = JsonMapper.getValueFromSource(mapping, { sourceKey: "/item" });
    expect(result).to.equal('http://example.com/item');
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

    const result = JsonMapper.getValueFromSource(mapping, sourceItem);
    expect(result).to.eql(undefined);
  });

  it('should return undefined because the array key isn\'t defined', () => {
    const mapping  = {
      "type": "string",
      "key": "sourceKey.nested1[]",
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

    const result = JsonMapper.getValueFromSource(mapping, (sourceItem as unknown) as MappedItem);
    expect(result).to.eql(undefined);
  });

  it('should return undefined because the object key isn\'t defined', () => {
    const mapping  = {
      "type": "string",
      "key": "sourceKey.nested",
    };
    const sourceItem = {
      "sourceKey": undefined
    };

    const result = JsonMapper.getValueFromSource(mapping, (sourceItem as unknown) as MappedItem);
    expect(result).to.eql(undefined);
  });
});

describe('JsonMapper Set Destination Value functions', () => {
  it('should not set the destination object value', () => {
    const path = "";
    const value = "test";
    const obj: MappedItem = {};

    JsonMapper.mapValueToDestinationObject(path, value, obj);
    expect(obj).to.be.empty;
  });
  it('should set the destination object value', () => {
    const path = "learning_experience";
    const value = "test";
    const obj: MappedItem = {};

    JsonMapper.mapValueToDestinationObject(path, value, obj);
    expect(obj).to.contain.keys("learning_experience");
  });
  it('should set the destination object value', () => {
    const path = "learning_experience";
    const value = "test";
    const obj: MappedItem = {};

    JsonMapper.mapValueToDestinationObject(path, value, obj);
    expect(obj).to.contain.keys("learning_experience");
    expect(obj["learning_experience"]).to.eql("test");
  });
  it('should set the destination object value nested', () => {
    const path = "learning_experience.nested";
    const value = "test";
    const obj: MappedItem = {};

    JsonMapper.mapValueToDestinationObject(path, value, obj);
    expect(obj).to.contain.keys("learning_experience");
    expect(obj["learning_experience"]).to.contain.keys("nested");
    expect((obj["learning_experience"] as MappedItem)["nested"]).to.eql("test");
  });

  it('should set the destination object value array', () => {
    const path = "learning_experience.array[]";
    const value = ["test", "test"];
    const obj: MappedItem = {};

    JsonMapper.mapValueToDestinationObject(path, value, obj);
    expect(obj).to.contain.keys("learning_experience");
    expect(obj["learning_experience"]).to.contain.keys("array");
    expect((obj["learning_experience"] as MappedItem)["array"]).members(value);
  });

  it('should set the destination object value array string', () => {
    const path = "learning_experience.array[]";
    const value = "test";
    const obj: MappedItem = {};

    JsonMapper.mapValueToDestinationObject(path, value, obj);
    expect(obj).to.contain.keys("learning_experience");
    expect(obj["learning_experience"]).to.contain.keys("array");
    expect((obj["learning_experience"] as MappedItem)["array"]).members([value]);
  });

  it('should set the destination object value array of objects', () => {
    const path = "learning_experience.array[].test";
    const value = ["test1", "test2"];
    const obj: MappedItem = {};

    JsonMapper.mapValueToDestinationObject(path, value, obj);
    expect(obj).to.contain.keys("learning_experience");
    expect(obj["learning_experience"]).to.contain.keys("array");
    expect((obj["learning_experience"] as MappedItem)["array"].length).to.eql(2);
    expect(((obj["learning_experience"] as MappedItem)["array"] as MappedItem)[0]).to.contain.keys("test");
    expect((((obj["learning_experience"] as MappedItem)["array"] as MappedItem)[0] as MappedItem).test).to.eql("test1");
    expect(((obj["learning_experience"] as MappedItem)["array"] as MappedItem)[1]).to.contain.keys("test");
    expect((((obj["learning_experience"] as MappedItem)["array"] as MappedItem)[1] as MappedItem).test).to.eql("test2");
  });

  it('should set the destination object to array when given a string', () => {
    const path = "learning_experience.array[].test";
    const value = "test1";
    const obj: MappedItem = {};

    JsonMapper.mapValueToDestinationObject(path, value, obj);
    expect(obj).to.contain.keys("learning_experience");
    expect(obj["learning_experience"]).to.contain.keys("array");
    expect((obj["learning_experience"] as MappedItem)["array"].length).to.eql(1);
    expect(((obj["learning_experience"] as MappedItem)["array"] as MappedItem)[0]).to.contain.keys("test");
    expect((((obj["learning_experience"] as MappedItem)["array"] as MappedItem)[0] as MappedItem).test).to.eql("test1");
  });

  it('should override last mapping to destination object to array', () => {
    const path = "learning_experience[].test";
    const value = ["test1", "test2"];
    const obj = { "learning_experience": [
      { "test": 1 },
      { "test": 2 },
    ]};

    JsonMapper.mapValueToDestinationObject(path, value, obj as unknown as MappedItem);

    expect(obj).to.contain.keys("learning_experience");
    expect((obj["learning_experience"] as unknown as MappedItem).length).to.eql(2);
    expect(((obj["learning_experience"] as unknown as MappedItem) as MappedItem)[0]).to.contain.keys("test");
    expect((((obj["learning_experience"] as unknown as MappedItem) as MappedItem)[0] as MappedItem).test).to.eql("test1");
  });

  it('should set existing destination object to array', () => {
    const path = "learning_experience[].test";
    const value = ["test1", "test2"];
    const obj: MappedItem = { "learning_experience": "array" };

    JsonMapper.mapValueToDestinationObject(path, value, obj);

    expect(obj).to.contain.keys("learning_experience");
    expect((obj["learning_experience"] as unknown as MappedItem).length).to.eql(2);
    expect(((obj["learning_experience"] as unknown as MappedItem) as MappedItem)[0]).to.contain.keys("test");
    expect((((obj["learning_experience"] as unknown as MappedItem) as MappedItem)[0] as MappedItem).test).to.eql("test1");
  });

  it('should set the destination object to nested array', () => {
    const path = "learning_experience.array[].nested[].test1";
    const value = ["test1", "test2"];
    const obj: MappedItem = {};

    JsonMapper.mapValueToDestinationObject(path, value, obj);

    expect(obj).to.contain.keys("learning_experience");
    expect(obj["learning_experience"]).to.contain.keys("array");
    expect((obj["learning_experience"] as MappedItem)["array"].length).to.eql(1);
    expect(((obj["learning_experience"] as MappedItem)["array"] as MappedItem)[0]).to.contain.keys("nested");
    expect((((obj["learning_experience"] as MappedItem)["array"] as MappedItem)[0] as MappedItem).nested)
      .to.have.deep.members([{"test1": "test1"}, {"test1": "test2"}]);
  });

  it('should append the destination object to nested array', () => {
    const path = "learning_experience.array[].nested[].test1";
    const value = ["test1", "test2"];
    const obj = {
      "learning_experience": {
        "array": [
          {
            "nested": [
              { "test": "one"}
            ]
          },
          {
            "nested": [
              { "test": "two"}
            ]
          }
        ]
      }
    };

    const mappedObject: MappedItem = obj as unknown as MappedItem;
    JsonMapper.mapValueToDestinationObject(path, value, mappedObject);

    expect(mappedObject).to.contain.keys("learning_experience");
    expect(mappedObject["learning_experience"]).to.contain.keys("array");
    expect((mappedObject["learning_experience"] as MappedItem)["array"].length).to.eql(2);
    expect(((mappedObject["learning_experience"] as MappedItem)["array"] as MappedItem)[0]).to.contain.keys("nested");
    expect((((mappedObject["learning_experience"] as MappedItem)["array"] as MappedItem)[0] as MappedItem).nested)
      .to.have.deep.members([{"test": "one"}]);
      expect(((mappedObject["learning_experience"] as MappedItem)["array"] as MappedItem)[1]).to.contain.keys("nested");
      expect((((mappedObject["learning_experience"] as MappedItem)["array"] as MappedItem)[1] as MappedItem).nested)
        .to.have.deep.members([{"test": "two", "test1": "test1"}, {"test1": "test2"}]);
  });

  it('should not set invalid destination object array', () => {
    const path = "learning_experience.[].test";
    const value = ["test1", "test2"];
    const obj: MappedItem = {};

    JsonMapper.mapValueToDestinationObject(path, value, obj);

    expect(obj).to.contain.keys("learning_experience");
    expect((Object.keys(obj["learning_experience"])).length).to.eql(0);
  });

  it('should append item to destination object', () => {
    const path = "hello.testing";
    const value = "test1";
    const obj: MappedItem = { "hello" : { "world": "test" } };

    JsonMapper.mapValueToDestinationObject(path, value, obj);

    expect(obj).to.contain.keys("hello");
    expect((obj["hello"] as MappedItem)["testing"] as MappedItem).to.eql("test1");
  });
});
