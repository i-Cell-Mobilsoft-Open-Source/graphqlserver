import {bind, inject, BindingScope} from '@loopback/core';
import {AnyObject} from '@loopback/repository';
import {createGraphQlSchema} from 'openapi-to-graphql';
import {
  parse,
  printSchema,
  visit,
  buildASTSchema,
  GraphQLSchema,
} from 'graphql';
import {Oas3} from 'openapi-to-graphql/lib/types/oas3';
import {Oas2} from 'openapi-to-graphql/lib/types/oas2';

@bind({scope: BindingScope.TRANSIENT})
export class GraphQLService {
  constructor(@inject('ops') private ops: AnyObject) {}

  getAST(schema: GraphQLSchema) {
    return parse(printSchema(schema));
  }

  reMapOperations(schema: GraphQLSchema, ops: AnyObject[]) {
    const queries: AnyObject[] = [];

    const result = visit(this.getAST(schema), {
      enter: (node: any) => {
        if (node.name && node.name.value === 'Mutation') {
          node.fields = node.fields.filter((field: any) => {
            for (const op of ops) {
              if (field.name.value === op.name) {
                queries.push(field);
                return false;
              }
            }
            return true;
          });
          return node;
        } else if (node.name && node.name.value === 'Query') {
          node.fields = [...node.fields, ...queries];
          return node;
        }
      },
    });

    return buildASTSchema(result);
  }

  createOperationMapping(
    openAPISchemas: (Oas3 | Oas2)[],
    opsMap: AnyObject[] = [],
  ): AnyObject {
    const ret: any = {};

    for (const schema of openAPISchemas) {
      const pathKeys = Object.keys(schema.paths);
      for (const path of pathKeys) {
        const op: any = opsMap.find(cuRop => {
          return (
            cuRop.path === path &&
            Object.keys(schema.paths[path]).includes(cuRop.method)
          );
        });

        if (op) {
          ret[schema.info.title] = {
            ...ret[schema.info.title],
            ...{
              [op.path]: {
                [op.method]: op.type === 'query' ? 0 : 1,
              },
            },
          };
        }
      }
    }

    return ret;
  }

  async createSchema(
    cliArgs: AnyObject,
    openAPISchemas: (Oas3 | Oas2)[],
    opsMap: AnyObject[] = [],
  ): Promise<any> {
    const gqlOptions: AnyObject = {
      baseUrl: cliArgs.baseUrl || null,
      headers: cliArgs.headerObj || {},
      qs: cliArgs.queryObj || {},
      fillEmptyResponses: cliArgs.fill,
      addLimitArgument: cliArgs.limit,
      strict: cliArgs.strict,
      operationIdFieldNames: cliArgs.strict,
      provideErrorExtensions: cliArgs.errors,
      equivalentToMessages: cliArgs.errors,
      selectQueryOrMutationField: this.createOperationMapping(
        openAPISchemas,
        opsMap,
      ),
    };

    const {schema, report} = await createGraphQlSchema(
      openAPISchemas,
      gqlOptions,
    );

    return Promise.resolve({schema, report});
  }
}
