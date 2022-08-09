import { OmiMiddleware } from "./decorator";
import { BasicOmiController, OmiLambda } from "./typings";

// 这个Error class就不导出了，这个几乎是returnInterceptor专用的，我想不到手动调它的场景
class MiddlewareReturnInterceptor extends Error {
  constructor() {
    super();
  }
}
// 为方法添加中间件
export const packMiddleware = <Props extends any, ResponseType extends any>(
  sourceFunc: OmiLambda<Props, ResponseType>,
  middleware: OmiMiddleware<Props, ResponseType>
) => {
  const lambdaFunc = sourceFunc;
  const newLambda: OmiLambda<Props, ResponseType> = async (ctx) => {
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
  return newLambda;
};

export const methods = ["Get", "Post", "Put", "Delete", "Patch"] as const;
export type Method = typeof methods[number];

// 检查函数名称的RESTFul Method类型
export const patchMethod = (name: string): Method | null => {
  // 方法名小于3自动剪枝
  if (name.length < 3) {
    return null;
  }
  for (const method of methods) {
    if (name.indexOf(method) === 0) {
      return method;
    }
  }
  return null;
};

export function getLambdas<T extends BasicOmiController>(serviceImpl: T) {
  const keys = Object.getOwnPropertyNames(Object.getPrototypeOf(serviceImpl));
  const lambdaMap: Map<string, OmiLambda<any, any>> = new Map();
  for (const i of keys) {
    const method = patchMethod(i);
    if (method) {
      lambdaMap.set(i, serviceImpl.getLambda(i));
    }
  }
  return lambdaMap;
}
