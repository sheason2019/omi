package file_dispatcher

import (
	"fmt"
	"os"
	"path"
	"strings"

	config_dispatcher "github.com/sheason2019/omi/config-dispatcher"
	token_parser "github.com/sheason2019/omi/token-parser"
	tree_builder "github.com/sheason2019/omi/tree-builder"
	"github.com/sheason2019/omi/utils"
)

func (dispatcher *FileDispatcher) ParseConfig(configCtx config_dispatcher.ConfigContext) error {
	for _, filePath := range configCtx.Entry {
		var absPath string
		if path.IsAbs(filePath) {
			absPath = filePath
		} else {
			absPath = path.Clean(dispatcher.ProjectRoot + `/` + filePath)
		}

		// 判断路径是否存在
		isDir, exist := utils.PathType(absPath)
		if !exist {
			fmt.Printf("读取路径失败: %s", absPath)
			continue
		}

		filePathList := []string{}
		if isDir {
			fps, err := utils.GetOmiFilesPath(absPath)
			if err != nil {
				return err
			}
			filePathList = fps
		} else {
			filePathList = append(filePathList, absPath)
		}

		for _, fp := range filePathList {
			fileCtx, err := dispatcher.ParseFile(fp, "")
			if err != nil {
				return err
			}
			fileCtx.updateGenTargetByMethod(dispatcher.DefaultMethod)
		}
	}

	return nil
}

// FileDispatcher会解析指定的文件，将TokenList以及TreeContext写入到
func (dispatcher *FileDispatcher) ParseFile(filePath string, fileContent string) (*FileContext, error) {
	ctx := FileContext{}
	// 文件的基本信息以及去重
	ctx.FileName = path.Base(filePath)
	ctx.FileName = ctx.FileName[:strings.Index(ctx.FileName, ".")]
	ctx.FilePath = filePath

	existPath, exist := dispatcher.FileUniqueMap[ctx.FileName]
	if exist {
		ctx := dispatcher.FileStore[filePath]
		if existPath != filePath {
			return ctx, fmt.Errorf("IDL文件名称重复：%s", ctx.FileName)
		}
		return ctx, nil
	}
	dispatcher.FileUniqueMap[ctx.FileName] = ctx.FilePath
	dispatcher.FileStore[filePath] = &ctx

	// 文件内容写入
	if len(fileContent) == 0 {
		content, err := os.ReadFile(filePath)
		if err != nil {
			return &ctx, err
		}
		ctx.Content = string(content)
	} else {
		ctx.Content = fileContent
	}

	// 解析Token并生成词法树
	tokenList, err := token_parser.Parse(ctx.Content)
	if err != nil {
		return &ctx, err
	}
	ctx.TokenList = &tokenList

	treeCtx := tree_builder.Build(&tokenList)
	if len(treeCtx.ErrorBlocks) != 0 {
		errInfo := fmt.Sprintf("IDL文件语法有误：%s\n", filePath)
		for _, err := range treeCtx.ErrorBlocks {
			errInfo = errInfo + fmt.Sprintf("[%d, %d] %s\n", err.FromRow, err.FromCol, err.Message)
		}
		return &ctx, fmt.Errorf(errInfo)
	}
	ctx.TreeContext = treeCtx

	err = dispatcher.ParseTreeImport(treeCtx, filePath[:strings.Index(filePath, path.Base(filePath))])
	if err != nil {
		return &ctx, err
	}

	return &ctx, nil
}
