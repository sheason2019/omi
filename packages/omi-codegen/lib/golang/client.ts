import { ProgramNode } from "@omi-stack/omi-ast-parser";
import { staticComment } from "../typescript/common";

const STATIC_IMPORT_SLOT = "[%STATIC_IMPORT SLOT%]";

const GolangClientGenerator = (program: ProgramNode) => {
  let content = staticComment + "\n";

  let shouldAddImport = false;

  content += STATIC_IMPORT_SLOT + '\n';

  for (const item of program.body) {
    if (item.type === "ServiceDeclaration") {
      shouldAddImport = true;
    }
    if (item.type === "Comments") {
      content += item.content + "\n";
    }
  }

};