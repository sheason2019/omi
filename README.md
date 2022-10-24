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

### Typescript

在创建完`todo.omi`文件后，在目录下执行以下命令以生成服务端文件：

```
$ omi-codegen -o . -l ts -t server todo.omi
```

codegen 生成的内容应该如下所示：

```ts
/**
 * 本文件由Omi.js自动生成，谨慎改动！
 * 生成时间：2022年10月19日 15:46:25.
 */
export interface Todo {
  id: number;
  content: string;
  finish: boolean;
  createTime: number;
  todoType?: TodoType;
}
// block
export interface UnimpledITodoController {
  GetTodoList(): Promise<Todo[]> | Todo[];
  PostTodo(payload: PostTodoRequest): Promise<void> | void;
  PutTodo(payload: PutTodoRequest): Promise<void> | void;
  DeleteTodo(payload: DeleteTodoRequest): Promise<void> | void;
  Login(): Promise<void> | void;
}
export const ITodoControllerDefinition = {
  GET_TODO_LIST_PATH: "ITodo.TodoList",
  POST_TODO_PATH: "ITodo.Todo",
  PUT_TODO_PATH: "ITodo.Todo",
  DELETE_TODO_PATH: "ITodo.Todo",
  LOGIN_PATH: "ITodo.Login",
} as const;

export interface PostTodoRequest {
  content: string;
  id: number;
}
export interface PutTodoRequest {
  todo: Todo;
}
export interface DeleteTodoRequest {
  id: number;
}

export enum TodoType {
  Normal,
  Topping,
}
```

下面的数个`*Request`接口是为了适配 Nest.js 的`@Body()`方法注入参数而自动生成的请求体，在特定情况下它会跟用户手动指定的`*Request`结构体冲突，这可能是未来需要想办法解决的一个问题。

### Go

Go 语言的使用方法类似，需要注意的是，Go 需要额外指定一个参数`-packageRoot`：

```
omi-codegen -packageRoot github.com/sheason2019/linkme/rpc -o ./rpc -l go -t server todo.omi
```

这是因为 Golang 不支持相对路径导入 Package，只能使用 URL 来标识导入的包，这里就需要手动声明代码生成根目录的路径。

最终生成的代码内容如下所示：

```go
// .rpc/todo/todo-common.go
/**
* 本文件由Omi.js自动生成，谨慎改动！
* 生成时间：2022年10月19日 15:46:25.
 */
package todo

type Todo struct {
	id         *int
	content    *string
	finish     *bool
	createTime *int
	todoType   *int
}

// block

type PostTodoRequest struct {
	Content string `json:"content"`
	Id      int    `json:"id"`
}
type PutTodoRequest struct {
	Todo Todo `json:"todo"`
}
type DeleteTodoRequest struct {
	Id int `form:"id"`
}

type STodoType struct {
	Normal  int
	Topping int
}

var TodoType = &STodoType{
	Normal:  0,
	Topping: 1,
}
```

这一部分是服务端和客户端的共用代码，它将结构体和 Enum 类型的数据单独放置在一个文件里进行实现。

由于一开始 omi 的目标是 C#和 Typescrpit，因此就在 omi 的 AST Parser 中添加了对 Enum 的支持，但没想到 Go 不支持 Enum，就导致在 Go 的 Codegen 中只能曲线实现 Enum。

下面看看服务端生成的代码：

```go
// ./rpc/todo/todo-server.go
/**
* 本文件由Omi.js自动生成，谨慎改动！
* 生成时间：2022年10月19日 15:46:25.
 */
package todo

import (
	"github.com/gin-gonic/gin"
)

// block
type ITodo interface {
	GetTodoList(ctx *gin.Context) []Todo
	PostTodo(ctx *gin.Context, content string, id int)
	PutTodo(ctx *gin.Context, todo Todo)
	DeleteTodo(ctx *gin.Context, id int)
	Login(ctx *gin.Context)
}
type TypeITodoDefinition struct {
	GET_TODO_LIST_PATH string
	POST_TODO_PATH     string
	PUT_TODO_PATH      string
	DELETE_TODO_PATH   string
	LOGIN_PATH         string
}

var ITodoDefinition = &TypeITodoDefinition{
	GET_TODO_LIST_PATH: "/ITodo.TodoList",
	POST_TODO_PATH:     "/ITodo.Todo",
	PUT_TODO_PATH:      "/ITodo.Todo",
	DELETE_TODO_PATH:   "/ITodo.Todo",
	LOGIN_PATH:         "/ITodo.Login",
}
```

它提供了对应的接口、返回类型和接口 Url，可惜的是 Go 无法像 Java 和 C#那样通过框架和注解实现 Controller 层的路由声明，这就导致我们后续还需要手动去编写部分的模板代码去将 API 暴露出来。

同时，在生成产物中可以注意到 interface 中的方法的第一个参数都是`*gin.Context`，这是因为在实践的过程中发现应用经常会需要去获取一些放置在请求头中的数据，如果不将 Context 传递到 Controller 中，就很难去实现这个功能，因此，这里就在所有的 interface 方法中默认添加了一个`*gin.Context`参数。

## 生成客户端文件

### Typescript

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

但 Typescript 的 Codegen 中很不好的一点是我把请求所有的参数都限制在了第一个参数`props`中，这是因为我最初编写代码的时候觉得用户在发起请求的时候可能会很细粒度的去调整每个请求中的 option 信息，但后来自己写了点应用发现好像不是这个样子，想修改请求头的时候重新 new 一个 TodoClient 对象并注入不一样的 AxiosInstance 就好了，所以将来这里的参数声明方式应该会修改一下，改的更像 IDL 中的风格一点。

### Go

跟服务端的 Go 类似，在使用 CLI 生成客户端代码的时候，Go 依然需要比 Typescript 多输入一个`-packageRoot`参数：

```
omi-codegen -packageRoot github.com/sheason2019/linkme/rpc -o ./rpc -l go -t client todo.omi
```

Go 的客户端生成产物跟 Typescript 的比较类似，但调用的方式稍微友善一点，未来有空的话也会把 Typescript 的请求调用方式改成 Go 这种的。

生成的产物大概长下面这样：

```go
/**
* 本文件由Omi.js自动生成，谨慎改动！
* 生成时间：2022年10月19日 15:46:25.
 */
package todo

import (
	"fmt"

	"github.com/imroc/req/v3"
)

// block
type ITodoClient struct {
	Request *req.Client
	HOST    string
}

func (ITodoClient) New(host string) (definition ITodoClient) {
	definition.HOST = host
	return
}
func (definition ITodoClient) GetRequestClient() *req.Client {
	if definition.Request != nil {
		return definition.Request
	}
	return req.C()
}
func (definition ITodoClient) GetTodoList() (result []Todo) {
	client := definition.GetRequestClient()
	resp, err := client.R().SetResult(&result).Get(definition.HOST + "/ITodo.TodoList")
	if err != nil {
		panic(err)
	}
	if resp.IsError() {
		panic("远程调用错误")
	}
	return
}

func (definition ITodoClient) PostTodo(content string, id int) {
	client := definition.GetRequestClient()
	resp, err := client.R().SetBody(&PostTodoRequest{Content: content, Id: id}).SetBody(&PostTodoRequest{Content: content, Id: id}).Post(definition.HOST + "/ITodo.Todo")
	if err != nil {
		panic(err)
	}
	if resp.IsError() {
		panic("远程调用错误")
	}
	return
}

func (definition ITodoClient) PutTodo(todo Todo) {
	client := definition.GetRequestClient()
	resp, err := client.R().SetBody(&PutTodoRequest{Todo: todo}).Put(definition.HOST + "/ITodo.Todo")
	if err != nil {
		panic(err)
	}
	if resp.IsError() {
		panic("远程调用错误")
	}
	return
}

func (definition ITodoClient) DeleteTodo(id int) {
	client := definition.GetRequestClient()
	resp, err := client.R().SetQueryParam("id", fmt.Sprint(id)).Delete(definition.HOST + "/ITodo.Todo")
	if err != nil {
		panic(err)
	}
	if resp.IsError() {
		panic("远程调用错误")
	}
	return
}

func (definition ITodoClient) Login() {
	client := definition.GetRequestClient()
	resp, err := client.R().Post(definition.HOST + "/ITodo.Login")
	if err != nil {
		panic(err)
	}
	if resp.IsError() {
		panic("远程调用错误")
	}
	return
}
```

可以看到 Go 客户端的产物就跟 IDL 中声明的接口很像，直接使用类似函数的方式输入参数就可以发起网络请求，这无疑比 Typescript 中只能在第一个参数`props`中输入参数的方式更符合直觉。

同样的，这里也引入了一个外部的请求库`"github.com/imroc/req/v3"`。对 Go 这种语言，我其实是想用原生写法直接上的，但研究了一下之后觉得原生方法好像对我的智力有一定的压力，所以最终还是采用了和 Typescript 一样的方法，使用外部库来实现了这个功能。

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

现在这个词法分析使用的还是 AST Parser 中顺便实现的一点功能，所以比较卡，而且基本只能提示你这个 IDL 文件能不能通过编译，将来时间充分的话我想用 Golang 重新写一版，但鉴于我现在还比较菜，所以这个事儿的优先级可能不会太高，说不定得明年才能弄了。

# 多语言支持

虽然 Omi IDL 在语法上被设计为语言无关，但受到工作量的制约，目前对多语言的支持还比较薄弱，支持的语言主要有以下几种：

- Typescript

- Go
