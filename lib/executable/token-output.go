package executable

import (
	"github.com/sheason2019/omi/common"
	token_parser "github.com/sheason2019/omi/token-parser"
)

type TokenOutput struct {
	TokenList   []token_parser.TokenStruct
	ErrorBlocks []common.ErrorBlock
}
