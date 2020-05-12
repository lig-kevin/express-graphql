const _ = require('lodash');
const loki = require('lokijs');
const express = require('express');
const faker = require('faker');
const { ApolloServer, gql } = require('apollo-server-express');

const _db = new loki('sample');

const User = _db.addCollection('users', { indices: ['id', 'email'] });

const db = {
  User
};

// initialize data
db.User.insert(_.times(10, (id) => ({
  id: id + 1,
  name: faker.name.findName(),
  email: faker.internet.email(),
  createdAt: faker.date.past(),
  updatedAt: faker.date.past(),
})));

const typeDefs = gql`
  input UserInput {
    email: String
    name: String
  }
  input ListInput {
    where: JSON
    limit: Int = 10
    offset: Int = 0
  }
  type response {
    code: String
    data: JSON
    user: user
  }
  type user {
    id: ID!
    name: String
    email: String
    createdAt: String
    updatedAt: String
    update(with: UserInput): response!
  }
  type root {
    user(id: ID): user
    users(
      limit: Int = 10
      offset: Int = 0
    ): [user]
  }
  schema {
    query: root
    mutation: root
  }
  scalar JSON
`;

const fieldsToJson = (fields) => {
  if (Array.isArray(fields)) {
    const jsonField = {};
    _.each(fields, (field) => {
      jsonField[field.name.value] = field.value.value;
    });
    return jsonField;
  }
  return null;
};

const hasOperation = (info, operationName) => {
  let operationExist = false;
  let operationParams = {};
  const selections = _.get(info, 'operation.selectionSet.selections[0].selectionSet.selections');
  _.each(selections, selection => {
  if (selection && selection.name.value === operationName) {
    operationExist = true;
    operationParams = fieldsToJson(selection.arguments[0].value.fields);
  }
  });
  return [operationExist, operationParams];
};

const resolvers = {
  root: {
    users: async (__, input) => {
      const {limit, offset, where} = input;
      console.log('i', input);
      const users = db.User.chain()
        .find(where)
        .offset(offset)
        .limit(limit)
        .data();
      return users;
    },
    user: async (__, input, ctx, info) => {
      const {id} = input;
      const user = db.User.findOne({
        id: parseInt(id, 10)
      });

      if (!user) {
        throw new Error('User not found');
      }

      let update;
      const [isUpdate, updateParams] = hasOperation(info, 'update');
      if (isUpdate) {
        Object.assign(user, updateParams);
        db.User.update(user);
        update = {
          code: 'SUCCESS',
          data: {},
          user: {...user}
        };
      }

      return {
        ...user,
        update
      }
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

const app = express();
server.applyMiddleware({ app });

const PORT = process.env.NODE_PORT || 3000;
app.listen({ port: PORT }, () => {
  console.log('server listening port:', PORT);
});
