package codegen_ts

import (
	"strings"

	tree_builder "github.com/sheason2019/omi/tree-builder"
)

// 生成客户端类
func genClient(tree *tree_builder.TreeContext) string {
	// 遍历ServiceMap，获取其中定义的Serivce，并根据定义的类型生成带有类型提示的请求方法
	row := []string{}
	importCtx := ImportContext{}
	importCtx.UseAxios = true
	importCtx.UsedStruct = make(map[string]bool)

	for _, service := range tree.ServiceMap {
		if len(row) == 0 {
			row = append(row, genConstructorInterface())
		}

		str := "export class " + service.Identify.Content + "Client {\n"
		str = str + genConstructor()
		for _, lambda := range service.Lambdas {
			str = str + genLambda(lambda, service, &importCtx)
		}

		str = str + `}`
		row = append(row, str)
	}

	row = append([]string{genImport(tree.StructMap, &importCtx)}, row...)

	return strings.Join(row, "\n")
}

// 生成请求类的构造函数接口类型
func genConstructorInterface() string {
	return `interface ClientConfig {
		host?: string;
		ins?: AxiosInstance;
	}`
}

// 生成请求类的构造函数
func genConstructor() string {
	return `host: string;
  ins: AxiosInstance;

  constructor(config?: ClientConfig) {
    this.host = config?.host ?? "";
    this.ins = config?.ins ?? axios.create();
  }` + "\n"
}
