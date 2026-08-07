package cryptoutil

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"testing"
)

func generateTestJWK(t *testing.T) (*ecdsa.PrivateKey, []byte) {
	t.Helper()
	priv, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Fatalf("generate key: %v", err)
	}
	x := priv.X.FillBytes(make([]byte, 32))
	y := priv.Y.FillBytes(make([]byte, 32))
	jwk := map[string]string{
		"kty": "EC",
		"crv": "P-256",
		"x":   base64.RawURLEncoding.EncodeToString(x),
		"y":   base64.RawURLEncoding.EncodeToString(y),
	}
	raw, err := json.Marshal(jwk)
	if err != nil {
		t.Fatalf("marshal jwk: %v", err)
	}
	return priv, raw
}

// signRawRS mimics WebCrypto's ECDSA sign output: raw r||s, 32 bytes each,
// rather than the ASN.1 DER encoding Go's ecdsa.SignASN1 produces.
func signRawRS(t *testing.T, priv *ecdsa.PrivateKey, hash []byte) []byte {
	t.Helper()
	r, s, err := ecdsa.Sign(rand.Reader, priv, hash)
	if err != nil {
		t.Fatalf("sign: %v", err)
	}
	out := make([]byte, 64)
	r.FillBytes(out[:32])
	s.FillBytes(out[32:])
	return out
}

func TestPublicKeyFromJWKAndVerifyRawRS(t *testing.T) {
	priv, jwk := generateTestJWK(t)
	pub, err := PublicKeyFromJWK(jwk)
	if err != nil {
		t.Fatalf("PublicKeyFromJWK: %v", err)
	}

	hash := SHA256([]byte("hello ledger"))
	sig := signRawRS(t, priv, hash[:])

	if !VerifyRawRS(pub, hash[:], sig) {
		t.Fatal("expected signature to verify")
	}

	tamperedHash := SHA256([]byte("hello ledger!"))
	if VerifyRawRS(pub, tamperedHash[:], sig) {
		t.Fatal("expected signature over a different hash to fail verification")
	}
}

func TestVerifyWebCryptoECDSAMatchesDoubleHashSemantics(t *testing.T) {
	priv, jwk := generateTestJWK(t)
	pub, err := PublicKeyFromJWK(jwk)
	if err != nil {
		t.Fatalf("PublicKeyFromJWK: %v", err)
	}

	message := []byte("record-hash-to-sign")
	digest := SHA256(message)
	sig := signRawRS(t, priv, digest[:])

	if !VerifyWebCryptoECDSA(pub, message, sig) {
		t.Fatal("expected VerifyWebCryptoECDSA to verify a signature over SHA-256(message)")
	}
	if VerifyRawRS(pub, message, sig) {
		t.Fatal("expected VerifyRawRS against the un-hashed message to fail (sanity check for the double-hash distinction)")
	}
}

func TestCanonicalJSONIsOrderIndependent(t *testing.T) {
	a := []byte(`{"b": 2, "a": 1, "nested": {"z": true, "y": false}}`)
	b := []byte(`{"a": 1, "nested": {"y": false, "z": true}, "b": 2}`)

	canonA, err := CanonicalJSON(a)
	if err != nil {
		t.Fatalf("canonical a: %v", err)
	}
	canonB, err := CanonicalJSON(b)
	if err != nil {
		t.Fatalf("canonical b: %v", err)
	}
	if string(canonA) != string(canonB) {
		t.Fatalf("expected equal canonical forms, got %s vs %s", canonA, canonB)
	}
}

func TestDeriveAddressIsDeterministicAndSensitiveToKey(t *testing.T) {
	_, jwk1 := generateTestJWK(t)
	_, jwk2 := generateTestJWK(t)

	c1, _ := CanonicalJSON(jwk1)
	c1Again, _ := CanonicalJSON(jwk1)
	c2, _ := CanonicalJSON(jwk2)

	addr1 := DeriveAddress(c1)
	addr1Again := DeriveAddress(c1Again)
	addr2 := DeriveAddress(c2)

	if addr1 != addr1Again {
		t.Fatalf("expected deterministic address, got %s vs %s", addr1, addr1Again)
	}
	if addr1 == addr2 {
		t.Fatal("expected different keys to derive different addresses")
	}
}
