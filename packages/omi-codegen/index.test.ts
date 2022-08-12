import * as fs from "fs";
import { OmiCodegen } from ".";

const codegen = new OmiCodegen();

const content = fs.readFileSync("../omi-example-idl/import.omi").toString();

codegen.setContent(content);
codegen.toTypescript("both", "import", "test-dist");
