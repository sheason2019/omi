package utils

import (
	"bytes"
	"encoding/json"
	"fmt"
)

func JsonLog(val any) error {
	data, err := json.Marshal(val)
	if err != nil {
		return err
	}

	var str bytes.Buffer
	_ = json.Indent(&str, data, "", "    ")
	fmt.Println(str.String())

	return nil
}
