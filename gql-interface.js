const { request, GraphQLClient } = require('graphql-request')
const fs = require('fs'); 


module.exports.introspectionQuery =  function (endpoint) {
  const IntrospectionQuery = fs.readFileSync('./introspectionQuery.gql', 'utf8')
  return request(endpoint, IntrospectionQuery)
};


module.exports.graphqlRequest = function (endpoint, token, query){
  const client = new GraphQLClient(endpoint, {
    headers: {
      Authorization: token
    }
  })
   
  return client.request(query)
}

