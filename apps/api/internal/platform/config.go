package platform

import "os"

type Config struct {
	Addr          string
	DatabaseURL   string
	RPID          string
	RPOrigin      string
	RPDisplayName string
	CookieSecure  bool
	Env           string
}

func LoadConfig() Config {
	return Config{
		Addr:          getenv("API_ADDR", ":8080"),
		DatabaseURL:   getenv("DATABASE_URL", "postgres://passport:passport@localhost:5433/passport?sslmode=disable"),
		RPID:          getenv("WEBAUTHN_RPID", "localhost"),
		RPOrigin:      getenv("WEBAUTHN_ORIGIN", "http://localhost:3000"),
		RPDisplayName: getenv("WEBAUTHN_DISPLAY_NAME", "Blockchain Passport"),
		CookieSecure:  getenv("COOKIE_SECURE", "false") == "true",
		Env:           getenv("APP_ENV", "development"),
	}
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
