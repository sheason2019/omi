import { useEffect, useState } from "react";
import { Todo, TodoClient } from "./api-lib/todo-client";
import "./App.css";

const client = new TodoClient("/api");

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);

  const [content, setContent] = useState("");
  const fetchData = async () => {
    const [err, res] = await client.GetTodoList({});
    if (err) {
      console.error(err);
      return;
    }
    setTodos(res);
  };
  useEffect(() => {
    fetchData();
  }, []);

  const handlePostTodo = async () => {
    const postConotent = content.trim();
    // 空内容不上传
    if (!postConotent) {
      return;
    }
    await client.PostTodo({
      todo: {
        content,
        finish: false,
        createTime: new Date().getTime(),
      },
    });
    await fetchData();
    setContent("");
  };

  const handleChangeTodoFinish = async (todo: Todo) => {
    await client.PutTodo({ todo: { ...todo, finish: !todo.finish } });
    await fetchData();
  };

  const handleDeleteTodo = async (todo: Todo) => {
    await client.DeleteTodo({ todo });
    await fetchData();
  };

  return (
    <div className="App">
      <div className="row">
        <div>添加TODO：</div>
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="input"
        />
        <button onClick={handlePostTodo}>确认</button>
      </div>
      <div
        className="todo-container column"
        style={{
          justifyContent: todos.length ? "flex-start" : "center",
          alignItems: todos.length ? "stretch" : "center",
        }}
      >
        {!todos.length && "暂无TODO项"}
        {todos.map((todo) => (
          <div key={todo.createTime}>
            <div className="row item-container">
              <input
                type="checkbox"
                onChange={() => handleChangeTodoFinish(todo)}
                checked={todo.finish}
                className="mr-1"
              />
              <div>{todo.content}</div>
              <div style={{ flex: 1 }} />
              <div className="mr-1">
                {new Date(todo.createTime).toLocaleString()}
              </div>
              <button className="mr-1" onClick={() => handleDeleteTodo(todo)}>
                删除
              </button>
            </div>
            <div className="divider" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
