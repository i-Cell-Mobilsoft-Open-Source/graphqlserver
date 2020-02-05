import { Request, RestBindings, get } from '@loopback/rest';
import { inject } from '@loopback/context';


export class TestController {

  constructor(
    @inject(RestBindings.Http.REQUEST) private req: Request,
    @inject('oasSchema') private oas: string) {
  }

  @get('/ping', {
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
    return 'pong';
  }
}
