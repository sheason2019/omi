import * as fs from "fs";
import testAST from ".";
import ServerGenerator from "./server";
import ClientGenerator from "./client";

const serverContent = ServerGenerator(testAST!);
const clientContent = ClientGenerator(testAST!);

fs.writeFileSync("./test-dist/server.ts", serverContent);
fs.writeFileSync("./test-dist/client.ts", clientContent);
