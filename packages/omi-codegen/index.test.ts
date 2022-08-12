import { OmiCodegen } from "./index";

const codegen = new OmiCodegen();

codegen.parse("../omi-example-idl/");

codegen.toTypescript("both", "test-dist");
