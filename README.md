# 简介

Omi 是一套基于 RESTful 风格的接口层框架，用户在用指定语法编写 IDL 文件后，Omi Codegen 可以对 IDL 文件进行解析，为服务端生成接口和路由定义，为客户端生成带有类型提示的 Api 调用接口。

# 如何使用

首先需要安装 Omi-codegen 依赖。

```
$ npm install @omi-stack/omi-codegen -g
```

创建一个`todo.omi`文件。

```
struct Todo {
  int id;
  string content;
  boolean finish;
  int createTime;
}

// block
service Todo {
  repeated Todo GetTodoList();
  void PostTodo(string content);
  void PutTodo(Todo todo);
  void DeleteTodo(int id);
}
```

## 生成服务端文件

在创建完`todo.omi`文件后，在目录下执行以下命令以生成服务端文件：

```
$ omi-codegen -o . -l ts -t server todo.omi
```

codegen 生成的内容应该如下所示：

```ts
/**
 * 本文件由Omi.js自动生成，谨慎改动！
 * 生成时间：2022年8月23日 17:43:36.
 */
export interface Todo {
  id: number;
  content: string;
  finish: boolean;
  createTime: number;
}
// block
export interface UnimpledTodoController {
  GetTodoList(): Promise<Todo[]> | Todo[];
  PostTodo(content: string): Promise<void> | void;
  PutTodo(todo: Todo): Promise<void> | void;
  DeleteTodo(id: number): Promise<void> | void;
}
export const TodoControllerDefinition = {
  GET_TODO_LIST_PATH: "Todo.TodoList",
  POST_TODO_PATH: "Todo.Todo",
  PUT_TODO_PATH: "Todo.Todo",
  DELETE_TODO_PATH: "Todo.Todo",
} as const;
```

该接口如何使用可以移步示例代码：[Omi-example-server-node](https://github.com/sheason2019/omi-example/tree/master/packages/omi-example-server-node)。

## 生成客户端文件

在创建完`todo.omi`文件后，在目录下执行以下命令以生成客户端文件：

```
$ omi-codegen -o . -l ts -t client todo.omi
```

codegen 生成的内容应该如下所示：

```ts
/**
 * 本文件由Omi.js自动生成，谨慎改动！
 * 生成时间：2022年8月23日 17:53:39.
 */

import { OmiClientBase } from "@omi-stack/omi-client";
import { AxiosRequestConfig } from "axios";

export interface Todo {
  id: number;
  content: string;
  finish: boolean;
  createTime: number;
}
// block
export class TodoClient extends OmiClientBase {
  GetTodoList(props: {}, option?: Omit<AxiosRequestConfig, "params">) {
    const url = "Todo.TodoList";
    const method = "Get";
    return this.request<Todo[]>(url, method, props, option);
  }
  PostTodo(
    props: { content: string },
    option?: Omit<AxiosRequestConfig, "params">
  ) {
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
    props: { id: number },
    option?: Omit<AxiosRequestConfig, "params">
  ) {
    const url = "Todo.Todo";
    const method = "Delete";
    return this.request<void>(url, method, props, option);
  }
}
```

客户端生成的文件是一套经过封装的请求接口，它有一个依赖`@omi-stack/omi-client`，这个包的源码在该项目下的`omi-client-js`文件夹中，主要功能就是把 Axios 封装了一下，让 Codegen 只需要生成一些基本的信息就可以实现对指定网络接口的调用，并对调用结果提供基本的类型提示。

具体的使用方法可以参考示例代码的源码：[Omi-example-web](https://github.com/sheason2019/omi-example/tree/master/packages/omi-example-web)

# 如何编写 Omi IDL 文件

Omi-IDL 的语法借鉴了 Protobuf，但在类型上比 Protobuf 弱很多，这一方面是因为在设计的时候有点前端优先的思维在作祟，另一方面是因为这个 IDL 工具没有序列化的需求，所以在类型支持这方面可以稍微宽松一点。

目前支持的基础数据类型有以下几种：

- int

- double

- string

- void

- boolean

- float

通过 Struct 关键字可以将它们组合成更复杂的类型：

```
struct Todo {
  int id;
  repeated string content;
  boolean finish;
  optional int createTime;
}
```

在结构体中，可以使用`optional`关键字和`repeated`关键字来表示一个字段是否是`可选`或`数组`。

而 Web 接口的声明则需要用到`service`关键字，一个示范用例如下所示：

```
service Todo {
  repeated Todo GetTodoList();
  void PostTodo(string content);
  void PutTodo(Todo todo);
  void DeleteTodo(int id);
}
```

这个语法跟 Java 或 C#里的`interface`比较像，但是有一点额外的命名规范，即接口名的声明必须以`(Method类型)+(函数名称)`的格式来实现，并且 Method 类型一定要以大驼峰风格来编写，不然的话就会报错。

这个差不多可以算是个提示性的强制要求，保证 API 遵循最基本的 RESTFul 规范，毕竟这个项目目前还是很不稳定的，如果未来某一天我需要把 Omi 从项目里抽离出去，有最基本的 RESTFul 规范在，整个项目也不至于一夜间乱成一团。

但很不好的一点是，这个设计可能会造成如`User.PostLogin()`、`User.DeleteLogout()`这样的奇怪操作，也许把这个命名规范作为一个软约束，不遵守规定的直接使用 POST 进行处理会更好一点？不管怎么说，目前就先这样摆着吧。

同时，`import`操作肯定是需要支持的，在比较复杂的服务里往往需要对定义的结构体进行复用，这时候通过以下语法即可拿到在别的文件里定义的结构体。

```
import { Todo } from "./todo.omi";

service Import {
  Todo GetTodo(int id);
}
```

# IDL 语法高亮支持

在 VS Code 扩展商店搜索 omi-idl-extension 即可找到语法支持扩展，虽然有基本的高亮和错误提示，但目前的实现还比较简陋。

# 多语言支持

虽然 Omi IDL 在语法上被设计为语言无关，但受到工作量的制约，目前对多语言的支持还比较薄弱：

- 服务端

  - Typescript

  - C#

- 客户端

  - Typescript
