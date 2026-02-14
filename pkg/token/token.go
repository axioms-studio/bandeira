package token

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
)

// Generate creates a new random API token. It returns the raw token (to display
// once to the user) and the SHA-256 hash (to store in the database).
func Generate() (raw, hashed string, err error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", "", fmt.Errorf("token: failed to generate random bytes: %w", err)
	}
	raw = hex.EncodeToString(b)
	hashed = Hash(raw)
	return raw, hashed, nil
}

// Hash returns the SHA-256 hex digest of a raw token string.
func Hash(raw string) string {
	h := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(h[:])
}
