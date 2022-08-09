import { BasicOmiController } from "../src";
import { OmiMiddleware, Use } from "../src/decorator";

const middlewareA: OmiMiddleware<any, any> = async (
  ctx,
  next,
  returnInterceptor
) => {
  console.log("use middlewareA start");
  await next();
  console.log("use MiddlewareA end");
};

const middlewareB: OmiMiddleware<any, any> = async (
  ctx,
  next,
  returnInterceptor
) => {
  console.log("use middlewareA start");
  await next();
  console.log("use MiddlewareA end");
};

@Use(middlewareA)
class TodoController extends BasicOmiController {
  namespace: string = "Test";

  @Use([middlewareB])
  async GetHello() {
    return "Hello";
  }
}

const controller = new TodoController();
console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(controller)));
controller.GetHello().then(console.log);
