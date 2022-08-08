import { OmiLambda, OmiServerCtx } from "./typings";

/**
 * @ctx Controller的Context
 * @next 执行下一个中间件
 * @returnInterceptor 返回值拦截器，用来中断中间件链路，直接返回响应，这里可以尝试实现一下类型安全
 */
export type OmiMiddleware<Props extends any, ResponseType extends any> = (
  ctx: OmiServerCtx<Props>,
  next: () => Promise<void>,
  returnInterceptor: (val: ResponseType) => void
) => Promise<any>;

// 这个Error class就不导出了，这个几乎是returnInterceptor专用的，我想不到手动调它的场景
class MiddlewareReturnInterceptor extends Error {
  constructor() {
    super();
  }
}

export function Use<Props extends any, ResponseType extends any>(
  middlewareOrMiddlewareList:
    | OmiMiddleware<Props, ResponseType>
    | OmiMiddleware<Props, ResponseType>[]
) {
  type Lambda = OmiLambda<Props, ResponseType>;

  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    let lambda: Lambda = descriptor.value;
    const middlewareStack: OmiMiddleware<Props, ResponseType>[] = Array.isArray(
      middlewareOrMiddlewareList
    )
      ? middlewareOrMiddlewareList.reverse()
      : [middlewareOrMiddlewareList];
    // 经中间件包装后的OmiLambda
    middlewareStack.forEach((middleware) => {
      const lambdaFunc = lambda;
      const newLambda: Lambda = async (ctx) => {
        let result: ResponseType;
        let executed = false;
        // 这个是返回值拦截器，它可以在中间件中修改函数的返回值
        // 实际上就是抛出一个特定类型的Error中断函数的执行，同时用传入的参数值覆盖住result
        // 从而实现返回值的拦截处理
        const returnInterceptor = (returnVal: ResponseType) => {
          result = returnVal;
          throw new MiddlewareReturnInterceptor();
        };
        // 这是执行被中间件包裹的内容的函数，同时把返回值取出来保存
        const next = async () => {
          executed = true;
          result = await lambdaFunc(ctx);
        };

        // 先执行中间件
        try {
          await middleware(ctx, next, returnInterceptor);
        } catch (e) {
          // 如果不是中间件返回值拦截器引发的异常就继续抛
          // 让OmiServer Build方法里定义的错误处理器去处理
          if (!(e instanceof MiddlewareReturnInterceptor)) {
            throw e;
          }
        }

        // 如果发现中间件包裹的内容没有被执行，则执行中间内容
        // 这是为了在处理一些简单中间件的时候不用每次都去显式的声明await next()
        if (!executed) {
          await next();
        }
        return result!;
      };
      lambda = newLambda;
    });

    descriptor.value = lambda;
  };
}
