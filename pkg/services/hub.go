package services

import (
	"fmt"
	"sync"
)

// Hub manages SSE subscribers for real-time flag change notifications.
// Subscribers are keyed by "projectID:envName".
type Hub struct {
	mu          sync.RWMutex
	subscribers map[string]map[chan struct{}]struct{}
}

// NewHub creates a new Hub.
func NewHub() *Hub {
	return &Hub{
		subscribers: make(map[string]map[chan struct{}]struct{}),
	}
}

func hubKey(projectID int, envName string) string {
	return fmt.Sprintf("%d:%s", projectID, envName)
}

// Subscribe registers a listener for flag changes on the given project+environment.
// Returns a signal channel and an unsubscribe function.
func (h *Hub) Subscribe(projectID int, envName string) (chan struct{}, func()) {
	ch := make(chan struct{}, 1)
	key := hubKey(projectID, envName)

	h.mu.Lock()
	if h.subscribers[key] == nil {
		h.subscribers[key] = make(map[chan struct{}]struct{})
	}
	h.subscribers[key][ch] = struct{}{}
	h.mu.Unlock()

	unsub := func() {
		h.mu.Lock()
		delete(h.subscribers[key], ch)
		if len(h.subscribers[key]) == 0 {
			delete(h.subscribers, key)
		}
		h.mu.Unlock()
	}

	return ch, unsub
}

// Notify sends a non-blocking signal to all subscribers for the given project+environment.
func (h *Hub) Notify(projectID int, envName string) {
	key := hubKey(projectID, envName)

	h.mu.RLock()
	subs := h.subscribers[key]
	h.mu.RUnlock()

	for ch := range subs {
		select {
		case ch <- struct{}{}:
		default:
		}
	}
}

// NotifyProject sends a non-blocking signal to ALL environment subscribers for a project.
// Used when a flag is created or deleted (affects all environments).
func (h *Hub) NotifyProject(projectID int) {
	prefix := fmt.Sprintf("%d:", projectID)

	h.mu.RLock()
	var channels []chan struct{}
	for key, subs := range h.subscribers {
		if len(key) >= len(prefix) && key[:len(prefix)] == prefix {
			for ch := range subs {
				channels = append(channels, ch)
			}
		}
	}
	h.mu.RUnlock()

	for _, ch := range channels {
		select {
		case ch <- struct{}{}:
		default:
		}
	}
}

// Close closes all subscriber channels. Call during shutdown.
func (h *Hub) Close() {
	h.mu.Lock()
	defer h.mu.Unlock()

	for key, subs := range h.subscribers {
		for ch := range subs {
			close(ch)
		}
		delete(h.subscribers, key)
	}
}
