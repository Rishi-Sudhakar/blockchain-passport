package main

import (
	"context"
	"log/slog"
	"os"

	"blockchain-passport/api/internal/migrations"
	"blockchain-passport/api/internal/platform"
)

func main() {
	cfg := platform.LoadConfig()
	ctx := context.Background()

	pool, err := platform.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		slog.Error("connect failed", "err", err)
		os.Exit(1)
	}
	defer pool.Close()

	if err := migrations.Run(ctx, pool); err != nil {
		slog.Error("migration failed", "err", err)
		os.Exit(1)
	}
	slog.Info("migrations up to date")
}
