import Parser, { AST } from "omi-ast-parser";

const testContent = `struct Model {
  string test;
}

service Test {
  string Hello(Model m);
}
`;

const parseAST = (content: string) => {
  const parser = new Parser();

  parser.setContent(content);

  try {
    const ast = parser.build();
    return ast;
  } catch (e) {
    console.error(e);
    return null;
  }
};

const testAST = parseAST(testContent);

export default testAST;
