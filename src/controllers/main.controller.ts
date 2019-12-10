import { Request, RestBindings, get } from '@loopback/rest';
import { inject } from '@loopback/context';


export class MainController {

  constructor(
    @inject(RestBindings.Http.REQUEST) private req: Request,
    @inject('oasSchema') private oas: string) {
  }

  @get('/test', {
    parameters: [{ name: 'name', schema: { type: 'string' }, in: 'query' }],
    'x-operation-name': 'test',
    'x-controller-name': 'MyController',
    responses: {
      '200': {
        description: 'foo text',
        content: {
          'application/json': {
            schema: { type: 'object' },
          },
        },
      },
    },
  })
  async test(): Promise<any> {
    return JSON.stringify({ bar: 'test' });
  }
}
