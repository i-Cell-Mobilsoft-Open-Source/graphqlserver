import { GqlApplication } from './application';
import { ApplicationConfig } from '@loopback/core';
import * as express from 'express';
import pEvent from 'p-event';
import { AnyObject } from '@loopback/repository';
const graphqlHTTP = require('express-graphql');
const bodyParser = require('body-parser');
const helmet = require('helmet');
import * as https from 'https';
import * as NoIntrospection from 'graphql-disable-introspection';
const csurf = require('csurf');
const session = require('cookie-session');

export class ExpressServer {
  public app: express.Application;
  public lbApp: GqlApplication;
  private server: any;
  private env: string = (process.env['ICGQL_ENV'] || 'prod').toLowerCase();

  constructor(options: ApplicationConfig = {}) {
    this.app = express();
    this.lbApp = new GqlApplication({
      ...options, ...{
        rest: {
          openApiSpec: {
            disabled: process.env['ICGQL_NOAPI'] === 'true',
            endpointMapping: {
              '/openapi.json': { version: '3.0.0', format: 'json' },
              '/openapi.yaml': { version: '3.0.0', format: 'yaml' },
              '/openapi': { version: '3.0.0', format: 'yaml' }
            },
          },
          apiExplorer: {
            disabled: this.isProd(),
          },
        }
      }
    });
  }

  isProd() {
    return this.env === 'prod';
  }

  addMiddlewares() {

    // TODO: Start here, and uncomment if session is needed...

    // const sessionExpiry = new Date(Date.now() + 60 * 60 * 1000);
    // this.app.use(session({
    //   name: 'session',
    //   keys: ['sessionToken'],
    //   cookie: {
    //     secure: true,
    //     httpOnly: true,
    //     domain: 'some.hu',
    //     path: '/',
    //     expires: sessionExpiry
    //   }
    // })
    // );
    this.app.use(helmet({
      noCache: true,
      permittedCrossDomainPolicies: false,
    }));

    const cspConfig: any = {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: !this.isProd() ? ["'unsafe-inline'", "'unsafe-eval'", "'self'"] : ["'none'"],
        styleSrc: !this.isProd() ? ["'unsafe-inline'", "'self'"] : ["'none'"],
        imgSrc: !this.isProd() ? ["data:", "'self'"] : ["'none'"],
        mediaSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: true,
        workerSrc: ["'none'"],
        fontSrc: ["'none'"],
        frameSrc: ["'none'"],
        frameAncestors: ["'none'"],
        formAction: ["'none'"],
        childSrc: ["'none'"],
        connectSrc: ["'self'"],
        blockAllMixedContent: true,
      }
    }

    if (this.isProd()) {
      cspConfig.directives.requireSriFor = ["script", "style"];
      process.env['DEBUG'] = process.env['DEBUG'] || 'http';
    }

    this.app.use(helmet.contentSecurityPolicy(cspConfig));

    //this.lbApp.mountExpressRouter('/', csurf());
    this.app.use(helmet.referrerPolicy({ policy: 'no-referrer' }))
    this.app.use(bodyParser.json());
    this.app.use('/api', this.lbApp.requestHandler);
    this.app.disable('x-powered-by');
    this.app.get('/', function (req, res) {
      res.json({ status: 'OK' })
    });
  }

  addGraphQLMiddleware() {
    let gqlConfig: AnyObject = {
      schema: this.lbApp.getSync('gqlSchema'),
    }

    if (!this.isProd()) {
      gqlConfig = {
        ...gqlConfig, ...{
          graphiql: true,
          pretty: true,
          // customFormatErrorFn: (error: any) => ({
          //   message: error.message,
          //   locations: error.locations,
          //   stack: error.stack ? error.stack.split('\n') : [],
          //   path: error.path,
          // })
        }
      };
    } else {
      gqlConfig.validationRules = [NoIntrospection];
    }

    this.app.use('/graphql', graphqlHTTP(gqlConfig));
  }

  async boot() {
    await this.lbApp.boot();
    this.addMiddlewares();
  }

  public async start() {
    await this.lbApp.start();

    const httpsOpts = {
      key: this.lbApp.getSync('serverKey'),
      cert: this.lbApp.getSync('serverCert')
    }

    if (httpsOpts.key) {
      this.server = https.createServer(httpsOpts as any, this.app);
      this.server.listen(this.lbApp.restServer.config.port, this.lbApp.restServer.config.host);
    } else {
      this.server = this.app.listen(this.lbApp.restServer.config.port, this.lbApp.restServer.config.host as any);
    }

    await pEvent(this.server, 'listening');
    await this.lbApp.loadOAS();
    this.addGraphQLMiddleware();
    this.app.get('*', function (req, res) {
      res.redirect('/');
    });
  }

  // For testing purposes
  public async stop() {
    if (!this.server) return;
    await this.lbApp.stop();
    this.server.close();
    await pEvent(this.server, 'close');
    this.server = undefined;
  }

}
