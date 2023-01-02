package executable_test

import (
	"testing"

	"github.com/sheason2019/omi/executable"
)

func TestCodegen(t *testing.T) {
	err := executable.GenCode("", true)
	if err != nil {
		t.Error(err)
	}
}
