import { Request, RestBindings, get } from '@loopback/rest';
import { inject } from '@loopback/context';


export class MainController {

  constructor(
    @inject(RestBindings.Http.REQUEST) private req: Request,
    @inject('oasConf') private oas: string) {
  }

  @get('/graphql', {
    responses: {
      '200': {},
    },
  })
  async graphql(): Promise<any> {
    return 'test';
  }
}
