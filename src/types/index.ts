export interface OperationParamType {
  name: string;
  in: 'header' | 'query' | 'path' | 'cookie';
  schema: {type: any};
}
