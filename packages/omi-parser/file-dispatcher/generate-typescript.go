package file_dispatcher

import (
	"fmt"
	"os"
	"strings"
)

func (dispatcher *FileDispatcher) GenerateTypescript(outDir string) error {
	for _, fileCtx := range dispatcher.FileStore {
		err := createDirIfNotExist(outDir + "/" + fileCtx.FileName)
		if err != nil {
			return err
		}
		err = generateIfContentExist(generatePath(outDir, fileCtx.FileName, "common"), fileCtx.ProductCommon)
		if err != nil {
			return err
		}
		err = generateIfContentExist(generatePath(outDir, fileCtx.FileName, "server"), fileCtx.ProductServer)
		if err != nil {
			return err
		}
		err = generateIfContentExist(generatePath(outDir, fileCtx.FileName, "client"), fileCtx.ProductClient)
		if err != nil {
			return err
		}
		err = generateIfContentExist(generateIndexPath(outDir, fileCtx.FileName), generateIndexContent(fileCtx))
		if err != nil {
			return err
		}
	}
	return nil
}

func generatePath(outDir, filename, fileSuffix string) string {
	return outDir + "/" + filename + "/" + filename + "-" + fileSuffix + ".ts"
}
func generateIndexPath(outDir, filename string) string {
	return outDir + "/" + filename + "/" + "index.ts"
}

func generateIfContentExist(path, content string) error {
	if len(content) > 0 {
		err := os.WriteFile(path, []byte(content), os.ModePerm)
		if err != nil {
			return err
		}
	}
	return nil
}

func createDirIfNotExist(dirPath string) error {
	_, err := os.Stat(dirPath)
	if err == nil {
		return nil
	}
	if os.IsNotExist(err) {
		err = os.MkdirAll(dirPath, os.ModePerm)
		if err != nil {
			return err
		}
	}

	return err
}

func generateIndexContent(ctx *FileContext) string {
	rows := []string{}
	if len(ctx.ProductClient) > 0 {
		rows = append(rows, fmt.Sprintf("export * from \"./%s\";", ctx.FileName+"-client"))
	}
	if len(ctx.ProductCommon) > 0 {
		rows = append(rows, fmt.Sprintf("export * from \"./%s\";", ctx.FileName+"-common"))
	}
	if len(ctx.ProductServer) > 0 {
		rows = append(rows, fmt.Sprintf("export * from \"./%s\";", ctx.FileName+"-server"))
	}

	return strings.Join(rows, "\n")
}
