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

const registController = <T extends BasicOmiController>(
  serviceImpl: T,
  method: Method,
  functionName: keyof T,
  router: Router
) => {
  if (typeof functionName !== "string") {
    return;
  }
  const path = `/${serviceImpl.constructor.name.replace(
    "Controller",
    ""
  )}.${functionName.replace(method, "")}`;
  console.log(`[注册路由] Method: ${method} Path: ${path}`);

  const func: IMiddleware = async (ctx, next) => {
    const value = await serviceImpl[functionName](ctx);
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

class HelloController extends BasicOmiController {
  GetHello: OmiLambda<null, string> = async ({ props }) => {
    return "hello";
  };
  GetError: OmiLambda<void, void> = async ({ props }) => {
    throw new Error("Error message");
  };
}

const app = new Koa();

const router = new Router();

const serviceImpl = new HelloController();

const keys = Object.keys(serviceImpl);

console.log(keys);
for (const key of keys) {
  const method = patchMethod(key);
  if (method) {
    registController(serviceImpl, method, key, router);
  }
}

app.use(bodyParser());

app.use(async (ctx, next) => {
  ctx.props = { ...ctx.request.body };
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

app.listen(3000, () => {
  console.log("服务已启动，端口号：3000");
});
