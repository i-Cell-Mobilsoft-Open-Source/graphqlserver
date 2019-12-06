import { bind, BindingScope } from '@loopback/core';
const oasValidator = require('openapi-enforcer');
import { inspect } from 'util';
import * as YAML from 'yaml';
import * as fs from 'fs';
import { get } from 'request-promise-native';
import { string as strValidator } from '@hapi/joi';
import { AnyObject } from '@loopback/repository';

@bind({ scope: BindingScope.TRANSIENT })
export class OpenApiService {
  constructor() { }


  async validate(paths: string[]): Promise<boolean> {

    for (const path of paths) {
      oasValidator(path, { fullResult: true })
        .then((error: any, warning: any) => {
          if (!error) {
            if (warning) {
              throw new Error(`OAS produced warnings: ${warning}`);
            }
          } else {
            throw new Error(`OAS is invalid: ${inspect(error, { showHidden: false, depth: null })}`);
          }
        });
    }

    return Promise.resolve(true);
  }

  async load(paths: string[]): Promise<string[]> {
    let oasData: string[] = [];
    const uriSchema = strValidator().uri({ scheme: ['http', 'https'] });
    try {
      for (const path of paths) {
        const isURL = Boolean(!uriSchema.validate(path).error);

        if (!isURL) {
          oasData.push(fs.readFileSync(path, { encoding: 'utf8' }).toString());
        } else {
          oasData.push(await get(path));
        }
      }
    }
    catch (e) {
      throw new Error(`Could not load file or URL: "${e}".`);
    }

    return Promise.resolve(oasData);
  }

  parse(oasData: string[]): Promise<AnyObject[]> {

    return Promise.resolve(oasData.map((oas: string) => {
      try {
        return JSON.parse(oas);
      }
      catch (e) {
        try {
          return YAML.parse(oas);
        }
        catch (e) {
          throw new Error(`Could not parsed OAS, should YAML or JSON: "${e}"`)
        }
      }
    }))
  }

}
