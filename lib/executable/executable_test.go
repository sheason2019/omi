package executable_test

import (
	"testing"

	"github.com/sheason2019/omi/executable"
)

func BenchmarkCodegen(b *testing.B) {
	err := executable.GenCode("", true)
	if err != nil {
		b.Error(err)
	}
}
