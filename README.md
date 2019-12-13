# gql

## I-Cell GraphQL Server

A nearly zero conf GraphQL layer generator, GraphQL server and standalone NodeJS REST server in one.
It's easy to install and use.

### Features

General:

- Protected against many security threats
- Runs on HTTP or HTTPS
- Can be configured via command line args or ENV vars, no config file needed
- Requires very little config to run in prod.

GraphQL server:

- Can generate GQL layer from any OpenAPI Schema
- Supports OpeanAPI v2 and v3
- Supports YAML and JSON inputs
- Supports combining multiple schemas
- Can read schemas from any number of URLs or files.
- Automatically generates resolvers
- Comes with built-in GraphQL dev tool (GraphiQL)

NodeJS server:

- Built-in Loopack 4 & Express server
- Can use any Express middleware
- Automatically generates OpenAPI v3 schema
- Has REST enpoints
- Has GraphQL endpoint
- Comes with pre-configured Swagger UI

### Prequisites

This requires NodeJS 11+.

### Install

Git clone this repo, the run:

```
npm install
```
