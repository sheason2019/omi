package file_dispatcher

func (dispatcher *FileDispatcher) GenerateGo(outDir string) error {
	for _, fileCtx := range dispatcher.FileStore {
		err := createDirIfNotExist(outDir + "/" + fileCtx.FileName)
		if err != nil {
			return err
		}
		err = generateIfContentExist(generatePath(outDir, fileCtx.FileName, "common", "go"), fileCtx.ProductCommon)
		if err != nil {
			return err
		}
		err = generateIfContentExist(generatePath(outDir, fileCtx.FileName, "server", "go"), fileCtx.ProductServer)
		if err != nil {
			return err
		}
		err = generateIfContentExist(generatePath(outDir, fileCtx.FileName, "client", "go"), fileCtx.ProductClient)
		if err != nil {
			return err
		}
	}
	return nil
}
