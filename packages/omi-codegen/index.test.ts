import { OmiCodegen } from "./index";

const codegen = new OmiCodegen();

codegen.parse("./test-idl/");

codegen.toCSharp("server", "test-dist");
