const formatMap = new Map<string, string>();
formatMap.set("int", "int");
formatMap.set("double", "float64");
formatMap.set("float", "float32");
formatMap.set("string", "string");
formatMap.set("boolean", "bool");
formatMap.set("void", "");

export default formatMap;
