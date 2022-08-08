# Omi.js

Omijs 是一个极简风格的 RESTful 接口框架，目的是通过特定语法编写的 IDL 文件来平衡前后端开发之间的上下游关系，同时以接近 RPC 的方式来为前后端提供互相通信的接口，以简化开发体验。

Omijs 目前的功能要点主要分成下面几个模块：

- Omi IDL

- Omi Codegen

- Omi Client

- Omi Server

虽然功能看起来很多，但工作量其实不太大，至少我做到勉强能跑的 MVP 版本只花了大概三天左右的时间，这其中包括了设计和构思的时间，我甚至还在这期间抽出了将近一整天的时间来肝命运 2 的至日活动。

所以……这个项目本质上还是挺速成的，虽然架构摆的规规整整的，但内部的很多实现其实相当随意，如果有写的不好的地方也请大家多多包涵。

下面我就按模块顺序来笼统的讲解一下基于 Omijs 的开发流程到底是怎么样的吧。

# 定义 Omi IDL

就像是 Thrift 或是 Protobuf，Omi IDL 可以通过一种结构化的语言来描述前后端通信间所需要的数据结构以及接口名称。

一个具有增删改查的 TODO IDL 文件如下所示：

```
struct Todo {
  string content;
  boolean finish;
  int32 createTime;
}

service Todo {
  repeated Todo GetTodoList();
  void PostTodo(Todo todo);
  void PutTodo(Todo todo);
  void DeleteTodo(Todo todo);
}
```

这样就定义好了一个 Todo 结构体和 Todo API，之后就可以通过 Codegen 解析这个文件生成可以实现通信的代码了。

需要注意的是，service 内部必须以 RESTful Method + url 的格式来定义方法名，并且 Method 必须是首字母大写、其余字母小写，否则 Codegen 的时候会报错，这个大概算是命名规范之一吧。

# Omi Codegen

目前 Codegen 还没有 CLI 工具，只能通过 nodejs 的方式引用 Codegen 类来解析 IDL 文件并生成对应的代码。

一个简单的 Codegen 文件如下所示：

```ts
import * as fs from "fs";
import OmiCodegen from "omi-codegen";

const content = fs.readFileSync("../omi-example-idl/todo.omi").toString();

const codegen = new OmiCodegen();

codegen.setContent(content);
codegen.toTypescript("server", "todo", "api-lib");
```

从这个文件里应该能略微窥见 OmiCodegen 向外暴露的工作流程：

1. 拿到指定的 Omi IDL 的内容

2. 创建 OmiCodegen 实例

3. 将 Omi IDL 的内容放到 OmiCodegen 内部，让它内部的方法能获取到指定的 IDL 内容

4. 将 Omi IDL 转译成`server`端的内容，并创建一个`todo`文件，放置在`api-lib`目录下。

目前 Codegen 可以生成`typescript`语言下的`client`和`server`两种接口类型。

以上面的 todo IDL 为例，生成的产物如下所示。

```ts
// 客户端产物 todo-client.ts

/**
 * 本文件由Omi.js自动生成，请勿随意改动
 * 生成时间：2022年8月8日 11:47:44.
 */

import { OmiClientBase } from "omi-client";
import { AxiosRequestConfig } from "axios";

export interface Todo {
  content: string;
  finish: boolean;
  createTime: number;
}
export class TodoClient extends OmiClientBase {
  GetTodoList(props: {}, option?: Omit<AxiosRequestConfig, "params">) {
    const url = "Todo.TodoList";
    const method = "Get";
    return this.request<Todo[]>(url, method, props, option);
  }
  PostTodo(props: { todo: Todo }, option?: Omit<AxiosRequestConfig, "params">) {
    const url = "Todo.Todo";
    const method = "Post";
    return this.request<void>(url, method, props, option);
  }
  PutTodo(props: { todo: Todo }, option?: Omit<AxiosRequestConfig, "params">) {
    const url = "Todo.Todo";
    const method = "Put";
    return this.request<void>(url, method, props, option);
  }
  DeleteTodo(
    props: { todo: Todo },
    option?: Omit<AxiosRequestConfig, "params">
  ) {
    const url = "Todo.Todo";
    const method = "Delete";
    return this.request<void>(url, method, props, option);
  }
}
```

```ts
// 服务端产物todo-server.ts

/**
 * 本文件由Omi.js自动生成，请勿随意改动
 * 生成时间：2022年8月8日 11:37:40.
 */

import { OmiLambda } from "omi-server";

export interface Todo {
  content: string;
  finish: boolean;
  createTime: number;
}
export abstract class UnimpledTodoController {
  namespace: string = "Todo";
  abstract GetTodoList: OmiLambda<{}, Todo[]>;
  abstract PostTodo: OmiLambda<{ todo: Todo }, void>;
  abstract PutTodo: OmiLambda<{ todo: Todo }, void>;
  abstract DeleteTodo: OmiLambda<{ todo: Todo }, void>;
}
```

可以看到，虽然 Codegen 的产物很简单，但在文件内部，它们都引入了一些依赖包来保证自身的正常工作。

除了 Axios 以外，剩下两个依赖都是在本地项目里构建的内部依赖。

它们的意义是将各自端内可复用的功能完全抽象出来，让用户能以尽可能简洁的方式去实现通信接口，也让 Codegen 能以最小化的程度维护自己生成的内容，避免出错（因为我总是出错:D）。

# Omi Client

Omi Client 包其实没什么好讲的，经典 Typescript 封装 Axios。

源码也就两个文件`index.ts`和`typings.ts`，这种东西我感觉直接看代码应该比文档效率高多了，直接略过吧。

# Omi Server

Omi Server 就不一样了，这个还是值得说道说道的。

Omi Server 实际上是基于 Koa 实现的一层浅封装，结合了 Nestjs 和 gRPC 的一些独特优点以期望实现最简化的开发体验。

下面是一个 Todo Server 的例子：

```ts
import OmiServer, { OmiLambda } from "omi-server";
// codegen 生成的内容
import { Todo, UnimpledTodoController } from "./api-lib/todo-server";

const todos: Todo[] = [];

// 用户实际编写的内容
class TodoController extends UnimpledTodoController {
  PutTodo: OmiLambda<{ todo: Todo }, void> = ({ props }) => {
    const { todo } = props;
    for (const i in todos) {
      if (todos[i].createTime === todo.createTime) {
        todos[i] = todo;
        break;
      }
    }
  };
  DeleteTodo: OmiLambda<{ todo: Todo }, void> = ({ props }) => {
    const { todo } = props;
    for (let i = 0; i < todos.length; i++) {
      if (todos[i].createTime === todo.createTime) {
        todos.splice(i, 1);
        break;
      }
    }
  };
  GetTodoList: OmiLambda<{}, Todo[]> = ({ props }) => {
    return todos;
  };

  PostTodo: OmiLambda<{ todo: Todo }, void> = ({ props }) => {
    const { todo } = props;
    todos.push(todo);
  };
}

// 将Controller Serve起来的声明
const server = new OmiServer();
server.appendController(TodoController);
server.build();
server.listen(8080);
```

这里的`UnimpledTodoController`就是之前 Codegen 生成的内容，有需要的话可以回去对照着看一下，或者是直接查看项目`packages/omi-example-server`的源码。

这个用户态的设计其实是完全模仿 NestJS 实现的，比如在 Controller 类内部定义的函数，通过 return 或是 throw 就可以直接给用户传递请求的响应，免去了使用 ctx.body 声明带来的初学者理解成本。

而在一些地方，OmiServer 做的又更加激进一点，比如 Controller 内部的方法名必须以`method`+路由的形式进行命名，同时 Controller 内部必须维护一个 namespace 字符串（这个通常由 Codegen 自动生成，只有在不使用 Codegen 的情况下才需要手动声明 namespace）。

做好了这些准备工作以后，OmiServer 会在执行 Build 方法的时候去逐个实例化已使用 append 向它声明的 Controller 类（其实就是做了个控制反转），然后从实例化的 Controller 类里面逐个去获取方法名，并将其解析为 gRPC 风格的 url，如：`http://localhost/Todo.TodoList`，这也就是为什么在 Controller 里必须以箭头函数的形式来声明函数，因为直接以 nestjs 风格声明的函数似乎不是直接挂载在类的实例上的，会导致 OmiServer 拿不到对应的方法名，最终导致无法声明路由。

而在上面这个 Controller 的实现中，可以注意到每个实现的参数都是`({ props })`，这是因为在 OmiServer 里定义了一个中间件，把 Get 和 Post 类型的请求参数统统合并到了`ctx.props`这个对象中，以简化获取参数的步骤，所以，在 Controller 内声明的方法的参数其实都是 ctx 本身，这是值得注意的一点。

同样的，受到工期制约，OmiServer 目前的实现也很不完全，它目前还没有中间件的能力，这算是很致命的一个缺陷了，我目前的想法是使用装饰器来实现（Nest.js？老东西等着爆金币吧。），期望的语法应该是像下面这样的：

```ts
// Controller级中间件
@Use(AuthorMiddleware)
class ExampleController extends UmimpledExampleController {
  // 方法级中间件
  @Use(AnotherMiddleware)
  GetTest() {}
}
```

接下来几天会重点搞一下这个。

# Example

这篇文档只是介绍了各个模块做了什么，以及未来会怎么做，总体来说其实更像是一篇笔记吧。

写成这样一方面是因为这个项目仍处在 Demo 阶段，都完全没有成型，我贸然去写一篇煞有其事的说明书感觉用途也不大；而另一方面，则是我自己也有点混乱，不知道该怎么把 Omi 的全貌给表达出来。

所以这里我就干脆写了个 Todo Example，直接用最淳朴的代码来展示一下怎么用这个框架吧。

查看`packages`目录下的`omi-example-*`项目，尝试修改`omi-example-idl`的内容，并在`omi-example-server`或`omi-example-web`中执行`yarn idl`命令，即可实现接口的迭代和同步。
