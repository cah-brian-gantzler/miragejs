import {Server, Model, Serializer, hasMany, belongsTo} from "miragejs";

describe("External | Shared | Serializers | Base | Transforms", function () {
  let server;

  beforeEach(function () {
    server = new Server({
      models: {
        wordSmith: Model.extend({
          blogPosts: hasMany(),
          address: belongsTo(),
        }),
        address: Model.extend({}),
        blogPost: Model.extend({
          wordSmith: belongsTo(),
        }),
      },
      serializers: {
        application: Serializer,
      },
    });
  });

  afterEach(function () {
    server.shutdown();
  });

  test(`it renames the attributes`, () => {
    server.serializerOrRegistry.registerSerializers({
      wordSmith: Serializer.extend({
        serializeIds: "always",
        transforms: {
          name: "externalName",
        }
      }),
    });

    let wordSmith = server.schema.wordSmiths.create({
      id: 1,
      name: "Link",
      age: 123,
    });

    let result = server.serializerOrRegistry.serialize(wordSmith);

    expect(result).toEqual({
      wordSmith: {
        age: 123,
        blogPostIds: [],
        id: "1",
        externalName: "Link",
      },
    });

  });

  test(`it renames the attributes when serializing a collection`, () => {
    server.serializerOrRegistry.registerSerializers({
      wordSmith: Serializer.extend({
        serializeIds: "always",
        transforms: {
          name: "externalName",
        }
      }),
    });

    server.schema.wordSmiths.create({id: 1, name: "Link", age: 123});
    server.schema.wordSmiths.create({id: 2, name: "Zelda", age: 456});

    let collection = server.schema.wordSmiths.all();
    let result = server.serializerOrRegistry.serialize(collection);

    expect(result).toEqual({
      wordSmiths: [
        {age: 123, blogPostIds: [], id: "1", externalName: "Link"},
        {age: 456, blogPostIds: [], id: "2", externalName: "Zelda"},
      ],
    });
  });

  test(`it serializes the relations as embedded when specified`, () => {
    server.serializerOrRegistry.registerSerializers({
      wordSmith: Serializer.extend({
        serializeIds: "always",
        transforms: {
          address: {serialize: "records"},
          name: {key: "externalName"}
        },
      }),
    });

    let address = server.schema.addresses.create({
      id: 11,
      street: "123 Maple",
    });

    let wordSmith = server.schema.wordSmiths.create({
      id: 1,
      name: "Link",
      age: 123,
      address: address,
    });

    let blogPost = server.schema.blogPosts.create({
      id: 2,
      wordSmith: wordSmith
    });

    let result = server.serializerOrRegistry.serialize(wordSmith);

    expect(result).toEqual({
      wordSmith: {
        age: 123,
        blogPostIds: ["2"],
        address: {id: "11", street: "123 Maple"},
        id: "1",
        externalName: "Link",
      },
    });

  });

});
