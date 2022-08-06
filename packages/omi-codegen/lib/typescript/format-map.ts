const formatMap = new Map<string, string>();
formatMap.set("int32", "number");
formatMap.set("int64", "string");
formatMap.set("double", "number");
formatMap.set("string", "string");
formatMap.set("boolean", "boolean");

export default formatMap;
