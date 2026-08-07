// Package cryptoutil holds the canonicalization, hashing, address-derivation and
// ECDSA P-256 signature verification logic shared by the identity (signing-key
// registration) and ledger (hash-chain record signing) domains. Keeping it
// standalone avoids a dependency cycle between those two packages.
package cryptoutil

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/sha256"
	"encoding/base32"
	"encoding/base64"
	"encoding/json"
	"errors"
	"math/big"
	"strings"
)

// CanonicalJSON re-marshals arbitrary JSON so object keys are sorted and there is
// no insignificant whitespace, giving a deterministic byte representation to hash.
// encoding/json already sorts map[string]interface{} keys on Marshal, and applies
// that rule recursively to nested objects, so a decode-then-encode round trip is
// sufficient canonicalization for our purposes.
func CanonicalJSON(raw []byte) ([]byte, error) {
	var v interface{}
	if err := json.Unmarshal(raw, &v); err != nil {
		return nil, err
	}
	return json.Marshal(v)
}

func SHA256(data []byte) [32]byte {
	return sha256.Sum256(data)
}

// jwkP256 is the subset of RFC 7518 JWK fields needed to reconstruct a P-256 public key.
type jwkP256 struct {
	Kty string `json:"kty"`
	Crv string `json:"crv"`
	X   string `json:"x"`
	Y   string `json:"y"`
}

// PublicKeyFromJWK parses a WebCrypto-exported ECDSA P-256 public key JWK.
func PublicKeyFromJWK(jwkJSON []byte) (*ecdsa.PublicKey, error) {
	var jwk jwkP256
	if err := json.Unmarshal(jwkJSON, &jwk); err != nil {
		return nil, err
	}
	if jwk.Kty != "EC" || jwk.Crv != "P-256" {
		return nil, errors.New("unsupported jwk: expected EC P-256")
	}
	xBytes, err := base64.RawURLEncoding.DecodeString(jwk.X)
	if err != nil {
		return nil, errors.New("invalid jwk.x")
	}
	yBytes, err := base64.RawURLEncoding.DecodeString(jwk.Y)
	if err != nil {
		return nil, errors.New("invalid jwk.y")
	}
	pub := &ecdsa.PublicKey{
		Curve: elliptic.P256(),
		X:     new(big.Int).SetBytes(xBytes),
		Y:     new(big.Int).SetBytes(yBytes),
	}
	if !pub.Curve.IsOnCurve(pub.X, pub.Y) {
		return nil, errors.New("jwk point is not on P-256 curve")
	}
	return pub, nil
}

// VerifyRawRS verifies an ECDSA signature over hash, where sig is WebCrypto's raw
// r||s encoding (64 bytes for P-256) rather than ASN.1 DER.
func VerifyRawRS(pub *ecdsa.PublicKey, hash []byte, sig []byte) bool {
	if len(sig) != 64 {
		return false
	}
	r := new(big.Int).SetBytes(sig[:32])
	s := new(big.Int).SetBytes(sig[32:])
	return ecdsa.Verify(pub, hash, r, s)
}

// VerifyWebCryptoECDSA verifies a signature produced by the browser's
// crypto.subtle.sign({name:"ECDSA", hash:"SHA-256"}, ...). WebCrypto's ECDSA
// sign always hashes its `data` argument internally before signing — callers
// cannot sign a pre-computed digest directly — so what's actually signed is
// SHA-256(message), not message itself. This wraps VerifyRawRS with that
// extra hash step so callers can pass the original message.
func VerifyWebCryptoECDSA(pub *ecdsa.PublicKey, message []byte, sig []byte) bool {
	digest := sha256.Sum256(message)
	return VerifyRawRS(pub, digest[:], sig)
}

// DeriveAddress produces a stable, human-scannable identity address from a
// canonicalized public-key JWK: "dpp1" + lowercase base32 (no padding) of the
// first 20 bytes of SHA-256(jwk).
func DeriveAddress(canonicalJWK []byte) string {
	sum := sha256.Sum256(canonicalJWK)
	enc := base32.StdEncoding.WithPadding(base32.NoPadding).EncodeToString(sum[:20])
	return "dpp1" + strings.ToLower(enc)
}
