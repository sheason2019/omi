import { BasicOmiController, OmiLambda, OmiServerCtx } from "./typings";
import { getLambdas, packMiddleware } from "./utils";

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

export function Use<Props extends any, ResponseType extends any>(
  middlewareOrMiddlewareList:
    | OmiMiddleware<Props, ResponseType>
    | OmiMiddleware<Props, ResponseType>[]
) {
  type Lambda = OmiLambda<Props, ResponseType>;

  function useMiddleware(
    target: any,
    propertyKey?: string,
    descriptor?: PropertyDescriptor
  ): any {
    const middlewareStack: OmiMiddleware<Props, ResponseType>[] = Array.isArray(
      middlewareOrMiddlewareList
    )
      ? middlewareOrMiddlewareList.reverse()
      : [middlewareOrMiddlewareList];
    // target类型为Object时表示装饰器的装饰对象是在控制器内修饰的方法
    // 这里的target指的是实例化后的控制器类对象
    if (typeof target === "object") {
      let lambda: Lambda = descriptor?.value;
      // 经中间件包装后的OmiLambda
      middlewareStack.forEach((middleware) => {
        lambda = packMiddleware(lambda, middleware);
      });

      if (descriptor) {
        descriptor.value = lambda;
        return;
      }
    }

    // 当target类型为function时表示当前修饰的对象是类（这里的target指的是类的构造函数）
    if (typeof target === "function") {
      const constructor: new () => BasicOmiController = target;
      const impl = new constructor();
      const lambdas = getLambdas(impl);
      lambdas.forEach((lambda, key, map) => {
        middlewareStack.forEach((middleware) => {
          const middlewaredLambda = packMiddleware(lambda, middleware);
          map.set(key, middlewaredLambda);
        });
      });
      return class extends constructor {
        constructor() {
          super();
          // 在构造方法里直接修改类的原型链，以实现中间件的洋葱式调用
          const self: any = Object.getPrototypeOf(this);
          lambdas.forEach((lambda, key) => {
            self[key] = lambda;
          });
        }
        namespace: string = impl.namespace;
      };
    }

    throw new Error("构建中间件的过程中出现了未知错误");
  }

  return useMiddleware;
}
