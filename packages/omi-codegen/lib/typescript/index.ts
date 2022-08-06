import Parser from "omi-ast-parser";

const testContent = `struct Model {
  string test;
}

service Test {
  string Hello(Model m);
}
`;

const parser = new Parser();

parser.setContent(testContent);
