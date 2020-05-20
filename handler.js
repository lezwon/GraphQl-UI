'use strict';

const fs = require('fs')
const {introspectionQuery, graphqlRequest} = require('./gql-interface')

module.exports.index = (event, context, callback) => {
  html = fs.readFileSync('index.html', 'utf8')
  const response = {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html',
    },
    body: html,
  };

  callback(null, response);
};

module.exports.introspectionQuery = async (event, context, callback) => {
  let body = JSON.parse(event.body)
  let endpoint = body['endpoint']
  let resp = await introspectionQuery(endpoint)
  let response = {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(resp),
  };
  callback(null, response);
};

module.exports.graphqlRequest = async (event, context, callback) => {
  let body = JSON.parse(event.body)
  let query = body['query']
  let token = body['token']
  let endpoint = body['endpoint']
  let resp = await graphqlRequest(endpoint, token, query)
  let response = {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(resp),
  };
  callback(null, response);
};