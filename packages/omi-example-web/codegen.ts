import * as fs from "fs";
import { OmiCodegen } from "omi-codegen";

const content = fs.readFileSync("../omi-example-idl/todo.omi").toString();

const codegen = new OmiCodegen();

codegen.setContent(content);
codegen.toTypescript("client", "todo", "src/api-lib");
