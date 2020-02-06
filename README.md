# I-Cell GraphQL Server

- [I-Cell GraphQL Server](#i-cell-graphql-server)
  - [Features](#features)
  - [Prerequisites](#prerequisites)
  - [Install](#install)
  - [Usage - General](#usage---general)
  - [Usage - as GraphQL layer](#usage---as-graphql-layer)
    - [General info](#general-info)
    - [Passing parameters at startup](#passing-parameters-at-startup)
    - [Passing parameters at runtime](#passing-parameters-at-runtime)
    - [Transforming OAS operations](#transforming-oas-operations)
  - [Usage - as NodeJS server](#usage---as-nodejs-server)
  - [Additional help](#additional-help)
  - [Running in production](#running-in-production)

A nearly zero conf GraphQL layer generator, GraphQL server and NodeJS REST API service in one. It has a dual purpose:

- It can generate a fully functional GraphQL layer from any number of OpenAPI specs, providing a single endpoint for all your REST APIs.
- It is also able to run as a standalone NodeJS service which can be used as a foundation for building secure REST APIs.

The goal of the project is to provide a minimalist, "out-of-the-box" solution for the above problems. This is a tool that requires **very little config** and builds **zero coding** GraphQL layers.

### Features

General:

- Protected against many security threats
- Runs on HTTP or HTTPS
- Can be configured via command line args or ENV vars, no config files needed
- Requires very little effort to run in prod.

GraphQL server:

- Can generate GQL layer from any OpenAPI Schema
- Supports OpeanAPI v2 and v3
- Can read OpeanAPI spec in YAML and JSON formats
- Can read schemas from any number of URLs or files.
- Supports combining multiple schemas
- Automatically generates resolvers
- Comes with built-in GraphQL dev tool (GraphiQL)

NodeJS service:

- A Loopack 4 & Express server (both can be used)
- Can use any Express middleware
- Automatically generates OpenAPI v3 schema
- Can provide REST enpoints
- Has GraphQL endpoint
- Comes with pre-configured Swagger UI

### Coming soon

- Containerization (Docker)
- Better logging
- Feature requests are welcome! :)

### Prerequisites

This requires [NodeJS](http://nodejs.org) 11+, but installing **NodeJS LTS** is recommended.

### Install

Git clone this repo, then run:

```
git clone https://github.com/icellmobilsoft/graphqlserver.git /some/dir
cd /some/dir
npm install
```

### Usage - General

The easiest way to run this is:

```
npm start --  --baseUrl http://127.0.0.1:3000/api
```

By default, the server will run on host **127.0.0.1** and port **3000**. You may change this using the **-host** and **--port** flags, respectively.
It's gonna run on HTTP unless you supply a valid certificate and a key file via the **--cert** and **--key** flags.

Once it's started, the following paths are available:

Once

| URL                | Description                                       |
| ------------------ | ------------------------------------------------- |
| GET /              | Health check                                      |
| /api               | The API root. All REST endoints live under this   |
| GET /api/explorer  | Swagger UI for REST endpoints                     |
| GET, POST /graphql | GraphQL query endpoint, GraphiQL UI (in dev mode) |
| GET /openapi       | OpenAPI 3.x spec (YAML)                           |
| GET /openapi.json  | OpenAPI 3.x spec (JSON)                           |
| GET /openapi.yaml  | OpenAPI 3.x spec (YAML)                           |

### Usage - as GraphQL layer

#### General info

In order to set up a GraphQL layer, simply execute the following command.

```
npm start -- --oas http://domain.com:10001/openapi.json  --baseUrl http://domain.com
```

This will fire up a GraphQL layer which is able to query the service running at port 10001 via GQL.
However, you may supply multiple OAS arguments! fFr example, the following would generate a combined GQL layer for services running at port 10001 and 10002.

```
npm start -- --oas http://domain.com:10001/openapi.json --oas http://domain.com:10002/openapi.json  --baseUrl http://domain.com
```

#### Passing parameters at startup

You may pass one or more **--header** flags at startup time, as shown in the example below:

```
npm start -- --oas http://domain.com:10001/openapi.json   --baseUrl http://domain.com --header secretId:aba2332
```

Each flag represents a HTTP header which will be passed to each request GraphQL makes to your REST API(s). This is a great way of defining values that don't change after startup (like constants). A header should be formatted like this: **name:value**.

If you need to pass data as part of the **query string** instead, use the **--queryStr** flag. It works the same way as **--header**.

#### Passing parameters at runtime

Another flag you may find useful is **--param**. This allows you to define runtime parameters. Since this is stuff that may change after startup, it's up to the user to provide values of these parameters at runtime. The format is **type:schema:name** where **type** is one of "path, query, header, cookie", **schema** is the OpenAPI schema data type, such as "string" and **name** is the name of the parameter. For example, check this out:

```
npm start -- --oas http://domain.com:10001/openapi.json   --baseUrl http://domain.com --param header:string:login --param header:string:accessToken
```

This defines two runtime parameters, "login" and "accessToken". These will be available in all OAS operations (as OP params) and will be passed to the generated HTTP requests as headers (hence type=header), allowing you to write queries like this:

```
  customerResponse(login: "someUser", sessionToken: "someToken") {
    customer {
      email
    }
  }
```

To learn more about OpenAPI parameter objects, see [this page](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.0.0.md#parameterObject).

#### Transforming OAS operations

When building the GraphQL layer, this tool will "convert" each OpenAPI operation to a GQL operation, either a mutation or a query. By default, only GET requests will be turned into queries. You may change this via the **--query** and **--mutation** flags. These will explicitly instruct the server to treat a certain OP as mutation or query, overriding the default behavior. The format is **httpMethod:path**. For instance:

```
npm start -- --oas http://domain.com:10001/openapi.json --oas http://domain.com:10002/openapi.jso --baseUrl http://domain.com --param header:string:login --param header:string:sessionToken --query post:/some/ep  --query post:/other/thing
```

This would convert the POST /some/ep and POST /other/thing to query ops. This **does not** mean that the requests will be called using GET, they gonna still use POST and whatever parameters they have defined in the OpenAPI schema. But now you can use these OPs in GraphQL queries.

### Usage - as NodeJS server

In order to run this as a normal NodeJS service, just execute the command:

```
npm start -- --baseUrl http://127.0.0.1:3000/api
```

You may have to replace "127.0.0.1" with your host and "3000" with your port number.

This will fire up a Loopback 4 + [Express](https://expressjs.com/) server, a NodeJS service. Using the [Loopback 4](https://loopback.io/) framework, you can add as many endpoints as you need. You may also extend the server's functionality using any Express-compatible middleware.

The **/graphql** endpoint will be still available, but now it's gonna query the server's own endpoints.

### Additional help

The GQL server has various other options. You might or might not need these, depending on how do you wish to use this product. For a list of all available options and their descriptions please run the following:

```
node . --help
```

### Running in production

Good news! This does not require any special config.
However, before you start the server, you should set the following environment variable:

```
export ICGQL_ENV=prod
npm start [options]
```

This will trigger "production mode", with the following effects:

- /api/explorer will be disabled (no swagger UI)
- /graphql will produce JSON responses only and GraphiQL will be unavailable.
- /api/openapi endpoints can be disabled by setting the "ICGQL_NO_SCHEMA" env var.
- The server won't respond to GraphQL introspection requests.
- Opening any URL in a browser, it won't be possible to execute JS code, CSS, request any media file or any external resource.
- All important security related headers will be injected into server responses, preventing a series of attacks.

Additionally, instead of starting the server using command line, you should define the required flags as environment variables with the "ICGQL" prefix.
So for example, you should set base URL this way:

```
export ICGQL_BASE_URL=http://some.url
```

The server will parse all env vars and will transform the ones with the ICGQL prefix into config options, allowing you to pass config data in a secure way.
