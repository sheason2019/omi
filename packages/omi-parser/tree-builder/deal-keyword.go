package tree_builder

import (
	"github.com/sheason2019/omi/omi-parser/common"
)

// 根据不同的Keyword分发不同的处理，fetchKeyword方法已经确认了keyword必为有效值
// 因此这里不做额外的兜底错误处理
func dealKeyword(ctx *TreeContext, keyword string, tokenStream *TokenStream) *common.ErrorBlock {
	if keyword == "import" {
		errBlock := dealImport(ctx, tokenStream)
		if errBlock != nil {
			return errBlock
		}
		return nil
	}

	if keyword == "service" {
		errBlock := dealService(ctx, tokenStream)
		if errBlock != nil {
			return errBlock
		}
		return nil
	}

	if keyword == "struct" {
		errBlock := dealStruct(ctx, tokenStream)
		if errBlock != nil {
			return errBlock
		}
		return nil
	}

	return nil
}
