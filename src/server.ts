import { GqlApplication } from './application';
import { ApplicationConfig } from '@loopback/core';
import * as express from 'express';
import pEvent from 'p-event';
import { AnyObject } from '@loopback/repository';
const graphqlHTTP = require('express-graphql');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const csurf = require('csurf');
const session = require('cookie-session');

export class ExpressServer {
  public app: express.Application;
  public lbApp: GqlApplication;
  private server: any;

  constructor(options: ApplicationConfig = {}) {
    this.app = express();
    this.lbApp = new GqlApplication(options);
  }

  regMiddlewares() {
    const env = (process.env['GQL_ENV'] || 'prod').toLowerCase();
    let gqlConfig: AnyObject = {
      schema: this.lbApp.getSync('gqlSchema'),
    }

    if (env === 'dev') {
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
    }

    // TODO: Uncomment if session is needed...

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
    this.app.use(helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: env === 'dev' ? ["'unsafe-inline'", "'unsafe-eval'"] : ["'none'"],
        styleSrc: [env === 'dev' ? "'unsafe-inline'" : "'none'"],
        imgSrc: ["'none'"],
        mediaSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: false,
        workerSrc: ["'none'"],
        fontSrc: ["'none'"],
        blockAllMixedContent: true,
      }
    }));
    this.lbApp.mountExpressRouter('/', csurf());
    this.app.use(helmet.referrerPolicy({ policy: 'no-referrer' }))
    this.app.use(bodyParser.json());
    this.app.use('/graphql', graphqlHTTP(gqlConfig));
    this.app.use('/api', this.lbApp.requestHandler);

  }

  async boot() {
    await this.lbApp.boot();
    await this.lbApp.loadOAS();
    this.regMiddlewares();
  }

  public async start() {
    await this.lbApp.start();
    const port = this.lbApp.restServer.config.port || 3000;
    const host = this.lbApp.restServer.config.host || '127.0.0.1';
    this.server = this.app.listen(port, host);
    await pEvent(this.server, 'listening');
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
