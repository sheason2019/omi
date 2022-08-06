import Parser from ".";

const testContent = `struct Model {
  string test;
}

service Test {
  string Hello(Model m);
}
`;

const parser = new Parser();

parser.setContent(testContent);
try {
  parser.build();
} catch (e) {
  console.error(e);
}
