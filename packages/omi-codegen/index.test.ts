import { OmiCodegen } from "./index";

const codegen = new OmiCodegen();

codegen.parse("./test-idl/");

codegen.toTypescript("both", "test-dist");
codegen.toCSharp("server", "test-dist");
