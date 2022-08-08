import { BasicOmiController, OmiLambda } from "../dist";
import { OmiMiddleware, Use } from "../src/decorator";

const middlewareA: OmiMiddleware<any, any> = async (
  ctx,
  next,
  returnInterceptor
) => {
  console.log("use middlewareA");
};

const middlewareB: OmiMiddleware<any, any> = async (
  ctx,
  next,
  returnInterceptor
) => {
  console.log("use middlewareB");
};

class TodoController {
  namespace: string = "Test";

  @Use([middlewareA, middlewareB])
  async Hello() {
    return "Hello";
  }
}

const controller = new TodoController();
controller.Hello().then(console.log);
console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(controller)));
