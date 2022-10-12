import { OmiCodegen } from "./index";

const codegen = new OmiCodegen();

codegen.parse("./test-idl/");

codegen.toGo("both", "test-dist/rpc", "github.com/sheason2019/linkme/rpc");
