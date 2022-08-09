import Koa from "koa";
import { OmiMiddleware } from "./decorator";

export type OmiServerCtx<Props extends any> = Koa.ParameterizedContext<
  Koa.DefaultState,
  Koa.DefaultContext,
  any
> & {
  props: Props;
};

export type OmiLambda<Props extends any, Response extends any> = (
  ctx: OmiServerCtx<Props>
) => Promise<Response>;

export abstract class BasicOmiController {
  abstract namespace: string;

  getLambda<Props extends any, ResponseType extends any>(
    lambdaName: string
  ): OmiLambda<Props, ResponseType> {
    const self: any = this;
    const lambda: OmiLambda<Props, ResponseType> = self[lambdaName];
    if (!lambda || typeof lambda !== "function") {
      throw new Error("获取Lambda的参数有误::" + lambdaName);
    }
    return lambda;
  }
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
