package utils_test

import (
	"testing"

	"github.com/sheason2019/omi/utils"
)

func TestIsOmiFile(t *testing.T) {
	path1 := "/is-not-omi"
	path2 := "/is-omi.omi"

	not := utils.IsOmiFile(path1)
	if not {
		t.Errorf("path1 is not omi file")
	}
	yes := utils.IsOmiFile(path2)
	if !yes {
		t.Errorf("path2 should be omi file")
	}
}
