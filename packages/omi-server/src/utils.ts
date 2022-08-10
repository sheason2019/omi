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
    let returnValueSetted = false;
    // 这个是返回值拦截器，它可以在中间件中修改函数的返回值
    // 它的设计目的是为中间件提供修改控制器方法返回值的能力
    const setReturnValue = (returnVal: ResponseType) => {
      // 如果在中间件里手动设置了返回值，则不会默认在函数末尾调用next函数
      // 因为这个功能的预期场景就是 提前返回 和 对获取到的返回值进行处理
      // 所以，不管出于什么因素考虑，都不该在使用setReturnValue方法后
      // 继续默认调用next方法
      returnValueSetted = true;
      result = returnVal;
    };
    // 这是执行被中间件包裹的内容的函数，同时把返回值取出来保存
    const next = async () => {
      if (executed) {
        throw new Error(
          "在中间件中多次调用了next方法！每个中间件最多只能调用一次next方法！"
        );
      }
      if (returnValueSetted) {
        throw new Error("不能在调用setReturnValue方法后继续调用next方法！");
      }
      executed = true;
      result = await lambdaFunc(ctx);
      return result;
    };

    // 先执行中间件
    await middleware(ctx, next, setReturnValue);

    // 如果发现中间件包裹的内容没有被执行并且用户也没有调用提前返回的函数，则执行中间内容
    // 这是为了在处理一些简单中间件的时候不用每次都去显式的声明await next()
    if (!executed && !returnValueSetted) {
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
