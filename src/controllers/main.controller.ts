import { Request, RestBindings, get } from '@loopback/rest';
import { inject } from '@loopback/context';


export class MainController {

  constructor(
    @inject(RestBindings.Http.REQUEST) private req: Request,
    @inject('oasSchema') private oas: string) {
  }

  @get('/test', {
    responses: {
      '200': {
        description: 'test desc',
        content: {
          'application/json': {
            schema: { type: 'object' },
          },
        },
      },
    },
  })
  async test(): Promise<any> {
    return { result: 'test' };
  }

  @get('/test2', {
    responses: {
      '200': {
        description: 'test desc',
        content: {
          'text/plain': {
            schema: { type: 'string' },
          },
        },
      },
    },
  })
  async test2(): Promise<any> {
    return 'foo';
  }
}
