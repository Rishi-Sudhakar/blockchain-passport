package auth

import (
	"context"
	"net/http"
	"strings"

	"blockchain-passport/api/internal/identity"
	"blockchain-passport/api/internal/platform"
)

// ContextUser re-exports identity.ContextUser so callers that already import
// auth for other reasons don't also need to import identity directly.
func ContextUser(ctx context.Context) (*identity.User, bool) {
	return identity.ContextUser(ctx)
}

// sessionToken reads the session token from either the httpOnly cookie (web)
// or an Authorization: Bearer header (native clients — React Native's cookie
// handling is unreliable across iOS/Android, so the mobile app stores the
// token itself and sends it explicitly instead).
func sessionToken(r *http.Request) (string, bool) {
	if cookie, err := r.Cookie(SessionCookieName); err == nil && cookie.Value != "" {
		return cookie.Value, true
	}
	if h := r.Header.Get("Authorization"); strings.HasPrefix(h, "Bearer ") {
		if token := strings.TrimSpace(strings.TrimPrefix(h, "Bearer ")); token != "" {
			return token, true
		}
	}
	return "", false
}

// RequireAuth resolves the session token into a user and attaches it to the
// request context, or responds 401 if there is no valid session.
func (s *Service) RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token, ok := sessionToken(r)
		if !ok {
			platform.WriteError(w, http.StatusUnauthorized, "unauthenticated", "no session")
			return
		}
		user, err := s.UserFromSessionToken(r.Context(), token)
		if err != nil {
			platform.WriteError(w, http.StatusUnauthorized, "unauthenticated", "invalid or expired session")
			return
		}
		ctx := identity.WithContextUser(r.Context(), user)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// RequireRole further restricts access to the given roles; use after RequireAuth.
func RequireRole(roles ...identity.Role) func(http.Handler) http.Handler {
	allowed := make(map[identity.Role]bool, len(roles))
	for _, r := range roles {
		allowed[r] = true
	}
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			user, ok := identity.ContextUser(r.Context())
			if !ok {
				platform.WriteError(w, http.StatusUnauthorized, "unauthenticated", "no session")
				return
			}
			if !allowed[user.Role] {
				platform.WriteError(w, http.StatusForbidden, "forbidden", "role not permitted")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
