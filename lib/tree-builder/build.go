package tree_builder

import (
	"github.com/sheason2019/omi/common"
	token_parser "github.com/sheason2019/omi/token-parser"
)

// 在通过Parser拿到可用Token以后，接下来就可以在TreeBuilder里根据Token构建出词法树
// 同时为Token添加语义化信息
func Build(tokens *[]token_parser.TokenStruct) *TreeContext {
	ctx := TreeContext{}
	ctx.ErrorBlocks = []common.ErrorBlock{}
	ctx.ServiceMap = make(map[string]*ServiceDefine)
	ctx.StructMap = make(map[string]*StructDefine)
	ctx.DeclareMap = make(map[string]bool)

	tokenStream := TokenStream{}
	tokenStream.Init(tokens)

	for tokenStream.Read() != nil {
		// 拿到Token的引用
		token := tokenStream.Read()
		// 现在不为产物生成注释信息
		if token.TokenType == "comment" {
			continue
		}
		keyword, err := fetchKeyword(token)
		if err != nil {
			ctx.ErrorBlocks = append(ctx.ErrorBlocks, *common.HandleErrorWithToken(err, token))
			nextSyntax(&tokenStream)
			tokenStream.NextUseful()
			continue
		}
		// dealKeyword是一个基于函数的状态机，它根据Keyword确定语句解析的逻辑链路
		// 然后从tokenStream中拿取Token并进行校验，并把得到的信息写入上下文中
		errBlock := dealKeyword(&ctx, keyword, &tokenStream)
		// 如果有错误信息，将错误信息写入上下文
		if errBlock != nil {
			ctx.ErrorBlocks = append(ctx.ErrorBlocks, *errBlock)
		}

		// 如果Token已经读完了就停止逻辑
		token = tokenStream.Read()
		if token == nil {
			break
		}
	}

	return &ctx
}
