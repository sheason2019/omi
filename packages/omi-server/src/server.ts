import Koa from "koa";
import bodyParser from "koa-bodyparser";
import Router, { IMiddleware } from "koa-router";
import { BasicOmiController, OmiError, OmiLambda } from "./typings";

const methods = ["Get", "Post", "Put", "Delete", "Patch"] as const;
type Method = typeof methods[number];

// 检查函数名称的RESTFul Method类型
const patchMethod = (name: string): Method | null => {
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

// 注册Controller
const registController = <T extends BasicOmiController>(
  serviceImpl: T,
  method: Method,
  functionName: string,
  router: Router
) => {
  if (typeof functionName !== "string") {
    return;
  }
  const path = `/${serviceImpl.namespace}.${functionName.replace(method, "")}`;
  console.log(`[注册路由] Method: ${method} Path: ${path}`);

  const lambda = (serviceImpl as any)[functionName] as unknown as OmiLambda<
    any,
    any
  >;
  if (typeof lambda !== "function") {
    throw new Error(
      `在${serviceImpl.constructor.name}内声明的lambda不是有效的函数`
    );
  }
  const func: IMiddleware = async (ctx, next) => {
    const value = await lambda({ props: {}, ...ctx });
    ctx.body = value;
    await next();
  };

  if (method === "Get") {
    router.get(path, func);
    return;
  }
  if (method === "Delete") {
    router.delete(path, func);
    return;
  }
  if (method === "Patch") {
    router.patch(path, func);
    return;
  }
  if (method === "Post") {
    router.post(path, func);
    return;
  }
  if (method === "Put") {
    router.put(path, func);
    return;
  }
};

export class OmiServer {
  // 需要注册的控制器
  private controllers: (new () => BasicOmiController)[] = [];

  app?: Koa;

  // 暴露给用户的添加控制器的方法
  appendController(controller: new () => BasicOmiController) {
    this.controllers.push(controller);
  }

  build() {
    const app = new Koa();

    const router = new Router();

    for (const Controller of this.controllers) {
      const serviceImpl = new Controller();
      const keys = Object.getOwnPropertyNames(
        Object.getPrototypeOf(serviceImpl)
      );

      for (const key of keys) {
        const method = patchMethod(key);
        if (method) {
          registController(serviceImpl, method, key, router);
        }
      }
    }

    app.use(bodyParser());

    // 这个中间件将Get和Post请求的参数全部收拢到一个名为Props的对象中
    app.use(async (ctx, next) => {
      const query = ctx.query;
      const queryKeys = Object.keys(query);
      const objectifyQuery: any = {};
      for (const i of queryKeys) {
        const queryString = query[i];
        if (!queryString) {
          continue;
        }
        objectifyQuery[i] = JSON.parse(queryString.toString());
      }
      ctx.props = { ...objectifyQuery, ...ctx.request.body };
      await next();
    });

    // 实现错误处理的中间件
    app.use(async (ctx, next) => {
      try {
        await next();
      } catch (e: any) {
        const err = new OmiError({ message: e.message, code: e.code });
        const errInfo = {
          message: err.message,
          code: err.code,
        };
        ctx.body = errInfo;
        ctx.status = 500;
      }
    });

    app.use(router.routes());

    app.use(
      router.allowedMethods({
        throw: true,
        notImplemented: () => "接口功能尚未实现",
        methodNotAllowed: () => "不支持该请求方式",
      })
    );

    this.app = app;

    return app;
  }

  listen(port: number) {
    if (!this.app) {
      throw new Error("Koa实例尚未构建，请先执行Build方法");
    }
    this.app.listen(port, () => {
      console.log("服务已启动，端口号：" + port);
    });
  }
}

export default OmiServer;
