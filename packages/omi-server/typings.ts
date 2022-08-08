import Koa from "koa";

export type OmiLambda<Props extends any, Response extends any> = (
  ctx: Koa.ParameterizedContext<Koa.DefaultState, Koa.DefaultContext, any> & {
    props: Props;
  }
) => Response | Promise<Response>;

export abstract class BasicOmiController {
  abstract namespace: string;
}

interface IOmiErrorConstructProps {
  message: string;
  code: number;
}

export class OmiError extends Error {
  constructor({ message, code }: IOmiErrorConstructProps) {
    super(message);
    this.code = code ?? -1;
  }

  /** 错误码 */
  code: number;
}
