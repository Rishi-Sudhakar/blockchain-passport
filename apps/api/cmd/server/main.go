package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"

	"blockchain-passport/api/internal/auth"
	"blockchain-passport/api/internal/certification"
	"blockchain-passport/api/internal/identity"
	"blockchain-passport/api/internal/ledger"
	"blockchain-passport/api/internal/migrations"
	"blockchain-passport/api/internal/passport"
	"blockchain-passport/api/internal/platform"
	"blockchain-passport/api/internal/verification"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-webauthn/webauthn/webauthn"
)

func main() {
	cfg := platform.LoadConfig()
	ctx := context.Background()

	pool, err := platform.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		slog.Error("db connect failed", "err", err)
		os.Exit(1)
	}
	defer pool.Close()

	if err := migrations.Run(ctx, pool); err != nil {
		slog.Error("migration failed", "err", err)
		os.Exit(1)
	}

	// --- wire domain packages ---
	identityRepo := identity.NewRepo(pool)
	identityHandlers := identity.NewHandlers(identityRepo)

	waCfg := &webauthn.Config{
		RPID:          cfg.RPID,
		RPDisplayName: cfg.RPDisplayName,
		RPOrigins:     []string{cfg.RPOrigin},
	}
	authRepo := auth.NewRepo(pool)
	authSvc, err := auth.NewService(waCfg, authRepo, identityRepo)
	if err != nil {
		slog.Error("webauthn init failed", "err", err)
		os.Exit(1)
	}
	authHandlers := auth.NewHandlers(authSvc, cfg.CookieSecure)

	ledgerAdapter := ledger.NewPostgresAdapter(pool)

	passportRepo := passport.NewRepo(pool)
	passportSvc := passport.NewService(passportRepo, ledgerAdapter, identityRepo)
	passportHandlers := passport.NewHandlers(passportSvc)

	certRepo := certification.NewRepo(pool)
	certSvc := certification.NewService(certRepo, passportRepo, ledgerAdapter, identityRepo)
	certHandlers := certification.NewHandlers(certSvc)
	passportSvc.SetOnSubmitted(certSvc.OnPassportSubmitted)

	verificationHandlers := verification.NewHandlers(passportSvc)

	// --- router ---
	r := chi.NewRouter()
	r.Use(chimw.RequestID, chimw.RealIP, chimw.Recoverer, chimw.Logger)
	r.Use(platform.CORS(cfg.RPOrigin))

	r.Get("/healthz", func(w http.ResponseWriter, r *http.Request) {
		platform.WriteJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})

	r.Route("/auth", func(r chi.Router) {
		r.Post("/webauthn/register/begin", authHandlers.BeginRegistration)
		r.Post("/webauthn/register/finish", authHandlers.FinishRegistration)
		r.Post("/webauthn/login/begin", authHandlers.BeginLogin)
		r.Post("/webauthn/login/finish", authHandlers.FinishLogin)
		r.Post("/logout", authHandlers.Logout)
		r.With(authSvc.RequireAuth).Get("/session", authHandlers.Session)
		r.With(authSvc.RequireAuth).Post("/device/pair/begin", authHandlers.BeginDevicePairing)
		r.Post("/device/pair/redeem", authHandlers.RedeemDevicePairing)
	})

	r.Route("/public", func(r chi.Router) {
		r.Get("/passports/{code}", verificationHandlers.GetByCode)
		r.Get("/passports/{code}/ledger", verificationHandlers.GetLedger)
	})

	r.Group(func(r chi.Router) {
		r.Use(authSvc.RequireAuth)

		r.Route("/identity/signing-keys", func(r chi.Router) {
			r.Post("/", identityHandlers.CreateSigningKey)
			r.Get("/", identityHandlers.ListSigningKeys)
			r.Delete("/{id}", identityHandlers.RevokeSigningKey)
		})

		r.Route("/passports", func(r chi.Router) {
			r.Post("/", passportHandlers.Create)
			r.Get("/", passportHandlers.List)
			r.Post("/transitions/commit", passportHandlers.CommitTransition)
			r.Get("/{id}", passportHandlers.Get)
			r.Patch("/{id}", passportHandlers.UpdateDraft)
			r.Get("/{id}/ledger", passportHandlers.Ledger)
			r.Get("/{id}/ledger/verify", passportHandlers.VerifyLedger)
			r.Post("/{id}/transitions/prepare", passportHandlers.PrepareTransition)
			r.Get("/{id}/certifications", certHandlers.ListForPassport)
			r.Post("/{id}/certifications/prepare", certHandlers.PrepareDecision)
		})

		r.Route("/certifications", func(r chi.Router) {
			r.Get("/queue", certHandlers.Queue)
			r.Post("/commit", certHandlers.CommitDecision)
		})
	})

	slog.Info("listening", "addr", cfg.Addr, "env", cfg.Env)
	if err := http.ListenAndServe(cfg.Addr, r); err != nil {
		slog.Error("server exited", "err", err)
		os.Exit(1)
	}
}
