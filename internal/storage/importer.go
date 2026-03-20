package storage

import (
	"heapi/internal/models"
	"encoding/json"
	"regexp"
	"strings"

	"github.com/google/uuid"
)

// ImportFromCurl parses a cURL command and returns a Request
func ImportFromCurl(curl string) (models.Request, error) {
	req := models.Request{
		ID:     uuid.New().String(),
		Method: "GET",
		Name:   "Imported Request",
	}

	// Basic regex parsing (can be improved with a library but for Phase 1 we keep it small)
	
	// Method: -X or --request
	methodRe := regexp.MustCompile(`-X\s+([A-Z]+)|--request\s+([A-Z]+)`)
	if matches := methodRe.FindStringSubmatch(curl); len(matches) > 0 {
		if matches[1] != "" {
			req.Method = matches[1]
		} else if matches[2] != "" {
			req.Method = matches[2]
		}
	}

	// URL: look for something starting with http
	urlRe := regexp.MustCompile(`'?(https?://[^'\s]+)'?`)
	if matches := urlRe.FindStringSubmatch(curl); len(matches) > 0 {
		req.URL = matches[1]
	}

	// Headers: -H or --header
	headerRe := regexp.MustCompile(`-H\s+'([^']+)'|--header\s+'([^']+)'`)
	headerMatches := headerRe.FindAllStringSubmatch(curl, -1)
	type headerItem struct {
		Key     string `json:"key"`
		Value   string `json:"value"`
		Enabled bool   `json:"enabled"`
	}
	var headers []headerItem
	for _, m := range headerMatches {
		hStr := m[1]
		if hStr == "" {
			hStr = m[2]
		}
		parts := strings.SplitN(hStr, ":", 2)
		if len(parts) == 2 {
			headers = append(headers, headerItem{
				Key:     strings.TrimSpace(parts[0]),
				Value:   strings.TrimSpace(parts[1]),
				Enabled: true,
			})
		}
	}
	hJson, _ := json.Marshal(headers)
	req.Headers = string(hJson)

	// Data: -d, --data, --data-raw
	dataRe := regexp.MustCompile(`-d\s+'([^']+)'|--data\s+'([^']+)'|--data-raw\s+'([^']+)'`)
	if matches := dataRe.FindStringSubmatch(curl); len(matches) > 0 {
		for i := 1; i <= 3; i++ {
			if matches[i] != "" {
				req.Body = matches[i]
				if req.Method == "GET" {
					req.Method = "POST" // Default to POST if data is provided
				}
				break
			}
		}
	}

	return req, nil
}

// ImportPostmanV2 parses a Postman Collection v2.1 JSON
func ImportPostmanV2(data []byte) (models.Collection, error) {
	var pm struct {
		Info struct {
			Name string `json:"name"`
		} `json:"info"`
		Item []struct {
			Name    string `json:"name"`
			Request struct {
				Method string `json:"method"`
				URL    interface{} `json:"url"` // Can be string or object
				Header []struct {
					Key   string `json:"key"`
					Value string `json:"value"`
				} `json:"header"`
				Body struct {
					Raw string `json:"raw"`
				} `json:"body"`
			} `json:"request"`
		} `json:"item"`
	}

	if err := json.Unmarshal(data, &pm); err != nil {
		return models.Collection{}, err
	}

	col := models.Collection{
		ID:   uuid.New().String(),
		Name: pm.Info.Name,
	}

	for _, pmi := range pm.Item {
		req := models.Request{
			ID:           uuid.New().String(),
			CollectionID: col.ID,
			Name:         pmi.Name,
			Method:       pmi.Request.Method,
		}

		// Parse URL
		switch v := pmi.Request.URL.(type) {
		case string:
			req.URL = v
		case map[string]interface{}:
			if raw, ok := v["raw"].(string); ok {
				req.URL = raw
			}
		}

		// Parse Headers
		type headerItem struct {
			Key     string `json:"key"`
			Value   string `json:"value"`
			Enabled bool   `json:"enabled"`
		}
		var headers []headerItem
		for _, h := range pmi.Request.Header {
			headers = append(headers, headerItem{
				Key:     h.Key,
				Value:   h.Value,
				Enabled: true,
			})
		}
		hJson, _ := json.Marshal(headers)
		req.Headers = string(hJson)
		req.Body = pmi.Request.Body.Raw
		req.AuthConfig = `{"type":"none"}`

		col.Requests = append(col.Requests, req)
	}

	return col, nil
}
