package codegen_common

type CodegenContext struct {
	// 文件摘要值，用来为import功能提供索引
	FileHash string
	// 文件包名，同样提供给import功能
	PackageName string
	// 项目根目录的位置，提供给import功能寻址
	PackageRoot string

	RowContent []string
}
