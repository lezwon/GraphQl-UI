
function GraphQLClient(endpoint, token){
    this.endpoint = endpoint;
    this.token = token;
}

GraphQLClient.prototype.introspectionQuery =  async function () {
    if (typeof this.schema !== 'undefined') {
      return this.schema
    }
    return fetch(window.location.href + "/schema", {
      "method": "POST",
      "headers": {
        "content-type": "application/json"
      },
      "body": JSON.stringify({
          "endpoint": this.endpoint
        })
    })
};

GraphQLClient.prototype.setupMutationMapping = function(){
  if (this.schema['__schema']['mutationType'] == null) return this.mutations = []
  this.mutations = this.schema['__schema']['mutationType']['fields'].map((el) => {
    this.queryMapping[el['name']] = {
      'input': el['args'],
      'output': el['type'],
      'type': 'mutation'
    }
    return el['name']
  })
}

GraphQLClient.prototype.setupQueryMapping = function(){
  if (this.schema['__schema']['queryType'] == null) return this.queries = []
  this.queries = this.schema['__schema']['queryType']['fields'].map((el) => {
    this.queryMapping[el['name']] = {
      'input': el['args'],
      'output': el['type'],
      'type': 'query'
    }
    return el['name']
  })
}

GraphQLClient.prototype.setupTypes = function(){
  this.typesMapping = {}
  this.types = this.schema['__schema']['types'].map((el) => {
    this.typesMapping[el['name']] = el
    return el['name']
  })
}

GraphQLClient.prototype.setup = async function () {
  var response = await this.introspectionQuery()
  this.schema = await response.json();
  this.queryMapping = {}
  this.setupMutationMapping()
  this.setupQueryMapping()
  this.setupTypes()
};

GraphQLClient.prototype.getFullList = function () {
  return this.queries.concat(this.mutations)
}

GraphQLClient.prototype.resolveKind = function(element) {
  let element_kind = element['kind']
  let element_name = element['name']


  if (element_kind == "INPUT_OBJECT" || element_kind == "SCALAR"){
    return {
      '__type': 'system',
      '__name': element_name,
      '__kind': element_kind,
      '__id': Math.random().toString(36).substring(2)
    }
  }
  else if(element_kind == "ENUM" || element_kind == "OBJECT"){
    return this.resolveType(element_name)
  }
  else if (element_kind == "NON_NULL"){
    let non_null_type = element['ofType']
    return this.resolveKind(non_null_type)
  }
  else if (element_kind == "LIST"){
    let list_type = element['ofType']
    return [ this.resolveKind(list_type) ]
  }
}

GraphQLClient.prototype.resolveObject = function (input) { 
  let payload = {}
  
  input.forEach(element => {
      value = this.resolveKind(element['type'])
      key = element['name']
      payload[key] = value
  });



  return payload
}

GraphQLClient.prototype.resolveEnum = function (enumValues) { 
  values =  enumValues.map((obj) => { return obj['name'] })
  return {
    '__type': 'system',
    '__name': 'Enum',
    '__kind': 'ENUM',
    '__values': values,
    '__id': Math.random().toString(36).substring(2)
  }
}


GraphQLClient.prototype.resolveType = function (element_name) {
  let data = this.typesMapping[element_name]
  if (data['kind'] == 'INPUT_OBJECT' || data['kind'] == 'OBJECT'){
    return this.resolveObject(data['inputFields'] || data['fields'])
  }
  else if (data['kind'] == 'ENUM'){
    return this.resolveEnum(data['enumValues'])
  }
}

GraphQLClient.prototype.resolveQueryInput = function (queryName) {
  let payload = this.resolveObject(this.queryMapping[queryName]['input'])
  return payload
}

GraphQLClient.prototype.resolveQueryOutput = function (queryName) {
  let payload = this.resolveKind(this.queryMapping[queryName]['output'])
  return payload
}


GraphQLClient.prototype.parseGql = function(payload){
  if(payload['__type'] == 'system'){
    return null
  } 
  else if (Array.isArray(payload)){
    let result = payload.map((el) => { return this.parseGql(el) })
    return (result[0] == null) ? null:result[0]
  } 
  else if(payload instanceof Object){
    let query = Object.entries(payload).map(([key, value]) => {
        if (value instanceof Object){
            let result = this.parseGql(value)
            if(result == null){
              return key
            }
            else{
              return key + result
            }
        }
    })
    return `{ ${query.join(' ')} }`
  }
}

GraphQLClient.prototype.getOutputQuery = function(queryName){
  let payload = this.resolveQueryOutput(queryName)
  let queryType = this.queryMapping[queryName]['type']
  let output = `${queryType}{  ${queryName} ${this.parseGql(payload)} }`
  let prettyQuery = prettier.format(output, { parser: 'graphql', plugins: prettierPlugins });
  return prettyQuery
}

GraphQLClient.prototype.execute = function(payload){
  return fetch(window.location.href + "/request", {
    "method": "POST",
    "headers": {
      "content-type": "application/json"
    },
    "body": JSON.stringify({
      "query": payload,
      "token": this.token,
      "endpoint": this.endpoint
    })
  })
}

async function getClient(endpoint, headers) {

  var graphQLClient = new GraphQLClient(endpoint, headers)


  await graphQLClient.setup()
  // let fullList = graphQLClient.getFullList()
  // let payload = graphQLClient.resolveQuery('createFlow')
  // let output = parseObject(payload)
  // console.log(output)
  return graphQLClient
}