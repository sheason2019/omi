package config_dispatcher

type ConfigContext struct {
	Remote  Remote   `json:"remote"`
	Configs []Config `json:"configs"`
}

type Config struct {
	Entry       []string `json:"entry"`
	Lang        string   `json:"lang"`
	TargetDir   string   `json:"targetDir"`
	Method      string   `json:"method"`
	PackageRoot string   `json:"packageRoot"`
}

type Remote struct {
	Repository string `json:"repository"`
	Branch     string `json:"branch"`
	OutDir     string `json:"outDir"`
}
