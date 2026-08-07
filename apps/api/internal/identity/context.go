package identity

import "context"

type ctxKey int

const userKey ctxKey = iota

// WithContextUser attaches the authenticated user to a request context. Called
// by auth's session middleware once a session cookie resolves to a user.
func WithContextUser(ctx context.Context, user *User) context.Context {
	return context.WithValue(ctx, userKey, user)
}

// ContextUser reads the authenticated user attached by WithContextUser. Domain
// packages (identity, passport, certification, ...) call this directly instead
// of depending on the auth package, which itself depends on identity.
func ContextUser(ctx context.Context) (*User, bool) {
	u, ok := ctx.Value(userKey).(*User)
	return u, ok
}
