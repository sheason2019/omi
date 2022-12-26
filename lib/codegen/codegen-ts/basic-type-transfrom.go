package codegen_ts

// 基本类型转换Map
func getBasicTypeTransformMap() map[string]string {
	basicTypeTransformMap := make(map[string]string)
	basicTypeTransformMap["int"] = "number"
	basicTypeTransformMap["uint"] = "number"
	basicTypeTransformMap["float"] = "number"
	basicTypeTransformMap["double"] = "number"

	return basicTypeTransformMap
}

var typeMap map[string]string

func typeTrans(origin string) string {
	if typeMap == nil {
		typeMap = getBasicTypeTransformMap()
	}

	if v, exist := typeMap[origin]; exist {
		return v
	}
	return origin
}
