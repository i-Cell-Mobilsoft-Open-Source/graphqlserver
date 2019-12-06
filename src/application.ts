import { BootMixin } from '@loopback/boot';
import { ApplicationConfig } from '@loopback/core';
import {
  RestExplorerBindings,
  RestExplorerComponent,
} from '@loopback/rest-explorer';
import { RepositoryMixin, AnyObject } from '@loopback/repository';
import { RestApplication } from '@loopback/rest';
import { ServiceMixin } from '@loopback/service-proxy';
import * as path from 'path';
import { MySequence } from './sequence';
import { string as strValidator } from '@hapi/joi';
import * as _ from 'lodash';
import { OpenApiService, GraphQLService } from './services';
import * as fs from 'fs';

export class GqlApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {

  private argv: any = null;
  private openApi: OpenApiService;
  private graphQL: GraphQLService;

  constructor(
    options: ApplicationConfig = {}) {
    super(options);

    // Parse args and load OAS

    this.init();

    // Set up the custom sequence
    this.sequence(MySequence);

    // Set up default home page
    this.static('/', path.join(__dirname, '../public'));

    // Customize @loopback/rest-explorer configuration here
    this.bind(RestExplorerBindings.CONFIG).to({
      path: '/explorer',
    });
    this.component(RestExplorerComponent);

    this.projectRoot = __dirname;
    // Customize @loopback/boot Booter Conventions here
    this.bootOptions = {
      controllers: {
        // Customize ControllerBooter Conventions here
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };

  }

  async init() {
    this.parseArgs();
    this.openApi = new OpenApiService();
    this.graphQL = new GraphQLService(this.getSync('opsMap'));
    if (this.argv.validate) {
      await this.openApi.validate(this.argv.oas);
    }

  }

  async loadOAS() {

    let oasData: string[] = [];
    let openAPISchema: AnyObject[] = [];

    oasData = await this.openApi.load(this.argv.oas);
    openAPISchema = await this.openApi.parse(oasData);

    const ops: AnyObject[] = this.getSync('opsMap');

    let { schema: graphQLSchema, report: graphQLReport } = await this.graphQL.createSchema(this.argv, openAPISchema as any, ops);

    if (this.argv.report) {
      console.log('Stats:\n\n');
      console.log(_.omit(graphQLReport, 'warnings'));
      if (graphQLReport.warnings) {
        console.log('There are warnings:\n');
        for (const warn of graphQLReport.warnings) {
          console.log(`
          Message: ${warn.message}
          Mitigation: ${warn.mitigation}
          `);
        }
      }
    }


    this.bind('oasSchema').to(openAPISchema);
    this.bind('gqlSchema').to(graphQLSchema);
    this.bind('gqlReport').to(graphQLReport);

  }

  parseArgs(): GqlApplication {
    const uriSchema = strValidator().uri({ scheme: ['http', 'https'] });

    const toArray = function (arg: any) {
      return Array.isArray(arg) ? arg : [arg];
    };
    const toOpArray = function (type: string) {
      return function (value: any) {
        const data = value.split(':');
        return { type, method: data[0], path: data[1] };
      };
    }

    const toObject = (arg: any) => {
      const ret: { [key: string]: any } = {}
      for (const item of arg) {
        const pair = item.split(':');
        ret[pair[0]] = pair[1];
      }
      return ret;
    }
    const kvPairTest = (v: any) => /^[a-z0-9_\-]+:[a-z0-9_\-\/]+$/i.test(v);
    const urlOrFileTest = (v: any) => {
      const isURL = Boolean(!uriSchema.validate(v).error)
      return isURL || fs.existsSync(v)
    }
    this.argv = require('yargs')
      .option('baseUrl', {
        alias: 'b',
        type: 'string',
        describe: 'The base url'
      })
      .option('oas', {
        alias: 'o',
        type: 'string',
        describe: 'Path or URL of an OAS 2 / 3 YAML or JSON spec. You may supply this flag multiple times.'
      })
      .option('limit', {
        alias: 'l',
        type: 'boolean',
        default: true,
        describe: 'Wether or not to add limit to lists'
      })
      .option('fill', {
        alias: 'f',
        type: 'boolean',
        default: true,
        describe: 'Wether or not to fill empty responses'
      })
      .option('strict', {
        alias: 's',
        type: 'boolean',
        default: false,
        describe: 'Wether or not to run in strict mode'
      })
      .option('errors', {
        alias: 'e',
        type: 'boolean',
        default: true,
        describe: 'Wether or not print debug info and extra verbose op descriptions.'
      })
      .option('header', {
        alias: 'H',
        type: 'string',
        describe: 'A custom HTTP header in headerName:value format. You may supply this flag multiple times'
      })
      .option('queryStr', {
        alias: 'q',
        type: 'string',
        describe: 'A custom HTTP query string parameter in paramName:value format. You may supply this flag multiple times'
      })
      .option('query', {
        alias: 'Q',
        type: 'string',
        describe: 'Treat this op as query. Argument is the HTTP method - path separated by colon. You may supply this flag multiple times.'
      })
      .option('mutation', {
        alias: 'M',
        type: 'string',
        describe: 'Treat this op as mutation. Argument is the HTTP method - path separated by colon. You may supply this flag multiple times.'
      })
      .option('report', {
        alias: 'r',
        type: 'boolean',
        default: false,
        describe: 'Print report after generating GraphQL schema.'
      })
      .option('validate', {
        alias: 'V',
        type: 'boolean',
        default: false,
        describe: 'Strict OAS validation. If false, only JSON / YAML conformity will be checked.'
      })
      .coerce('H', toArray)
      .coerce('q', toArray)
      .coerce('Q', toArray)
      .coerce('M', toArray)
      .coerce('o', toArray)
      .check((argv: any) => {
        setTimeout(() => {
          if (!argv.oas.every(urlOrFileTest)) {
            throw new Error(`OAS is not URL or existing path: "${argv.oas.join(',')}"`);
          } else if (argv.baseUrl && uriSchema.validate(argv.baseUrl).error) {
            throw new Error(`The base URL is invalid: "${argv.baseUrl}"`);
          } else if (argv.header && !argv.header.every(kvPairTest)) {
            throw new Error(`One or more header is not fromatted  correctly: "${argv.header.join(',')}"`);
          } else if (argv.queryStr && !argv.queryStr.every(kvPairTest)) {
            throw new Error(`One or more query param is not fromatted  correctly: "${argv.queryStr.join(',')}"`);
          } else if (argv.query && !argv.query.every(kvPairTest)) {
            throw new Error(`One or more query mappings are not fromatted correctly: "${argv.query.join(',')}"`);
          } else if (argv.mutation && !argv.mutation.every(kvPairTest)) {
            throw new Error(`One or more mutation mappings are not fromatted correctly: "${argv.mutation.join(',')}"`);
          }
        })
        return true;
      })
      .demandOption(['oas'], 'The "--oas or -o" paramneter is required!')
      .argv;

    if (this.argv.header) {
      this.argv.headerObj = toObject(this.argv.header);
    }

    if (this.argv.queryStr) {
      this.argv.queryObj = toObject(this.argv.queryStr);
    }

    let ops: any = [];

    if (this.argv.query) {
      ops = [...this.argv.query.map(toOpArray('query'))];
    }

    if (this.argv.mutation) {
      ops = [...ops, ...this.argv.mutation.map(toOpArray('mutation'))];
    }

    this.bind('opsMap').to(ops);

    return this;
  }

}
