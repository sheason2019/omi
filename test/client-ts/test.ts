import { TemplateClient } from "./template-client";

export interface GetTodoPayload {
  id?: number;
}

const fetchData = async () => {
  const client = new TemplateClient({ host: "http://localhost:3000" });
  const res = await client.GetTodo({ id: 1 });

  // const res = await axios.get<GetTodoPayload>(
  //   "http://localhost:3000/Import.GetTodo",
  //   {
  //     params: { id: 1, idList: [1, 2, 3, 4] },
  //   }
  // );

  console.log(res.data);
};

fetchData();
