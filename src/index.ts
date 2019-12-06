import { GqlApplication } from './application';
import { ExpressServer } from './server';
import { ApplicationConfig } from '@loopback/core';

export { GqlApplication, ExpressServer };

export async function main(options: ApplicationConfig = {}) {
  const server = new ExpressServer(options);
  await server.boot();
  await server.start();

  const config = server.lbApp.restServer.config;
  console.log(`Server is running at ${config.host || '127.0.0.1'}:${config.port}`);

  return server;
}
