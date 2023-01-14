package codegen_go

import (
	"fmt"
	"strings"

	codegen_common "github.com/sheason2019/omi/codegen/codegen-common"
	file_dispatcher "github.com/sheason2019/omi/file-dispatcher"
	tree_builder "github.com/sheason2019/omi/tree-builder"
)

func genClient(ctx *file_dispatcher.FileContext, packageRoot string) string {
	row := []string{}

	tree := ctx.TreeContext
	importCtx := importContext{
		PackageRoot: packageRoot,
	}
	importCtx.UsedPackage = make(map[string]bool)
	importCtx.UsedDeps = map[string]bool{
		"\"github.com/imroc/req/v3\"": true,
	}

	for _, service := range tree.ServiceMap {
		row = append(row, genClientType(service))
		row = append(row, genClientInit(service))
		row = append(row, genGetClientFn(service))
		for _, lambda := range service.Lambdas {
			row = append(row, genLambda(service, lambda, &importCtx))
		}
	}

	if len(row) == 0 {
		return ""
	}

	row = append([]string{genImport(&importCtx)}, row...)
	row = append([]string{fmt.Sprintf("package %s\n", ctx.FileName)}, row...)

	return strings.Join(row, "\n")
}

// 请求类结构体
func genClientType(svr *tree_builder.ServiceDefine) string {
	str := fmt.Sprintf("type %s struct {\n", genClientName(svr))
	str = str + "Request *req.Client\n"
	str = str + "Host string\n"
	str = str + "}\n"

	return str
}

// 请求类初始化函数
func genClientInit(svr *tree_builder.ServiceDefine) string {
	return fmt.Sprintf("func (c *%s) Init(host string) {\n", genClientName(svr)) +
		"c.Request = req.C()\n" +
		"c.Host = host\n" +
		"}\n"
}

// 获取client
func genGetClientFn(svr *tree_builder.ServiceDefine) string {
	return fmt.Sprintf("func (c *%s) GetRequestClient() *req.Client {\n", genClientName(svr)) +
		"if c.Request == nil {\n" +
		"c.Request = req.C()\n" +
		"}\n" +
		"return c.Request\n" +
		"}\n"
}

// 根据定义的Lambda生成请求方法
func genLambda(svr *tree_builder.ServiceDefine, lambda *tree_builder.LambdaDefine, importCtx *importContext) string {
	method, _ := codegen_common.GetMehod(lambda.Identify.Content)
	pathName := codegen_common.GenPathName(lambda)

	str := fmt.Sprintf("func (c *%s) %s(%s) %s {\n",
		genClientName(svr),
		genLambdaName(lambda),
		genLambdaArg(lambda, importCtx),
		genLambdaRtn(lambda, importCtx),
	)
	str = str + "client := c.GetRequestClient()\n"
	if (method == "Get" || method == "Delete") && lambda.ArgName != nil {
		str = str + fmt.Sprintf(`m := make(map[string]any)
		j, e := json.Marshal(%s)
		if e != nil {
			err = e
			return	
		}
		e = json.Unmarshal(j, &m)
		if e != nil {
			err = e
			return	
		}
		`, lambda.ArgName.Content)
	}

	str = str + fmt.Sprintf("resp, err = client.R()%s", genLambdaSetData(lambda, importCtx))
	if lambda.RtnType != nil {
		str = str + ".SetResult(&data)"
	}
	str = str + fmt.Sprintf(".%s(c.Host + \"%s\")\n", method, pathName)
	str = str + "return\n"
	str = str + "}\n"
	return str
}

// 生成请求类名称
func genClientName(svr *tree_builder.ServiceDefine) string {
	return fmt.Sprintf("%sClient", svr.Identify.Content)
}

// 生成请求方法名称
func genLambdaName(lambda *tree_builder.LambdaDefine) string {
	return strings.ToUpper(lambda.Identify.Content[:1]) + lambda.Identify.Content[1:]
}

// 生成请求方法参数
func genLambdaArg(lambda *tree_builder.LambdaDefine, importCtx *importContext) string {
	// 没有参数时返回空字符串
	if lambda.ArgType == nil {
		return ""
	}
	return fmt.Sprintf("%s *%s", lambda.ArgName.Content, typeTrans(lambda.ArgType.Content, importCtx))
}

// 生成请求方法的返回值
func genLambdaRtn(lambda *tree_builder.LambdaDefine, importCtx *importContext) string {
	// 返回值为void时返回空字符串
	if lambda.RtnType.Content == "void" {
		return "(err error, resp *req.Response)"
	}
	return fmt.Sprintf("(data %s, err error, resp *req.Response)", typeTrans(lambda.RtnType.Content, importCtx))
}

func genLambdaSetData(lambda *tree_builder.LambdaDefine, importCtx *importContext) string {
	if lambda.ArgType == nil {
		return ""
	}

	method, _ := codegen_common.GetMehod(lambda.Identify.Content)
	if method == "Post" || method == "Put" || method == "Patch" {
		// 使用body传输数据
		return fmt.Sprintf(".SetBody(&%s)", typeTrans(lambda.ArgType.Content, importCtx))
	} else {
		// 使用Query参数传输数据
		return ".SetQueryParamsAnyType(m)"
	}
}
