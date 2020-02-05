import { GqlApplication } from './application';
import { ExpressServer } from './server';
import { ApplicationConfig } from '@loopback/core';
import { omit } from 'lodash';

export { GqlApplication, ExpressServer };

export async function main(options: ApplicationConfig = {}) {
  const server = new ExpressServer(options);
  await server.boot();
  await server.start();

  const config = server.lbApp.restServer.config;
  const logo = require('asciiart-logo');
  const packageJson = omit(require('../package.json'), 'description');
  console.log(logo(packageJson).render());
  console.log(`Server is running at ${config.host || '127.0.0.1'}:${config.port}`);

  return server;
}
