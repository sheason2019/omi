package config_dispatcher

type ConfigContext struct {
	Entry       []string `json:"entry"`
	Lang        string   `json:"lang"`
	TargetDir   string   `json:"targetDir"`
	Method      string   `json:"method"`
	PackageRoot string   `json:"packageRoot"`
}
