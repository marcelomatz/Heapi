package service

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"io"
	"net/http"
	"regexp"
	"strings"
	"time"
)

var (
	httpClient = &http.Client{
		Timeout: 30 * time.Second,
		Transport: &http.Transport{
			MaxIdleConns:        100,
			IdleConnTimeout:     90 * time.Second,
			TLSHandshakeTimeout: 10 * time.Second,
		},
	}
	varRegex = regexp.MustCompile(`(?:\{\{(.*?)\}\}|<<(.*?)>>|%7B%7B(.*?)\%7D\%7D|%3C%3C(.*?)\%3E%3E)`)
)

type RequestOptions struct {
	Method     string
	URL        string
	Headers    map[string]string
	Body       string
	AuthConfig string // JSON string
}

type ResponseResult struct {
	StatusCode int               `json:"status_code"`
	Body       string            `json:"body"`
	Headers    map[string]string `json:"headers"`
	Duration   int64             `json:"duration"` // ms
}

func ExecuteRequest(opts RequestOptions, envVars map[string]string) (*ResponseResult, error) {
	// 1. Substitute Environment Variables
	url := substituteVars(opts.URL, envVars)
	body := substituteVars(opts.Body, envVars)

	// 2. Build Request
	req, err := http.NewRequest(opts.Method, url, bytes.NewBufferString(body))
	if err != nil {
		return nil, err
	}

	// 3. Set Headers
	for k, v := range opts.Headers {
		req.Header.Set(substituteVars(k, envVars), substituteVars(v, envVars))
	}

	// 4. Handle Auth
	if opts.AuthConfig != "" {
		var authData struct {
			Type     string `json:"type"`
			Token    string `json:"token"`
			Username string `json:"username"`
			Password string `json:"password"`
		}
		if err := json.Unmarshal([]byte(opts.AuthConfig), &authData); err == nil {
			switch authData.Type {
			case "bearer":
				token := substituteVars(authData.Token, envVars)
				req.Header.Set("Authorization", "Bearer "+token)
			case "basic":
				user := substituteVars(authData.Username, envVars)
				pass := substituteVars(authData.Password, envVars)
				auth := base64.StdEncoding.EncodeToString([]byte(user + ":" + pass))
				req.Header.Set("Authorization", "Basic "+auth)
			}
		}
	}

	// 5. Execute
	start := time.Now()
	resp, err := httpClient.Do(req)
	duration := time.Since(start).Milliseconds()

	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	// 5. Read Response
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	respHeaders := make(map[string]string)
	for k, v := range resp.Header {
		respHeaders[k] = strings.Join(v, ", ")
	}

	return &ResponseResult{
		StatusCode: resp.StatusCode,
		Body:       string(respBody),
		Headers:    respHeaders,
		Duration:   duration,
	}, nil
}

func substituteVars(input string, vars map[string]string) string {
	if input == "" {
		return ""
	}

	// Max iterations to prevent infinite recursion
	maxDepth := 5
	result := input

	for i := 0; i < maxDepth; i++ {
		changed := false
		result = varRegex.ReplaceAllStringFunc(result, func(m string) string {
			key := m
			if strings.HasPrefix(m, "{{") && strings.HasSuffix(m, "}}") {
				key = strings.TrimPrefix(strings.TrimSuffix(m, "}}"), "{{")
			} else if strings.HasPrefix(m, "<<") && strings.HasSuffix(m, ">>") {
				key = strings.TrimPrefix(strings.TrimSuffix(m, ">>"), "<<")
			} else if strings.HasPrefix(m, "%7B%7B") && strings.HasSuffix(m, "%7D%7D") {
				key = strings.TrimPrefix(strings.TrimSuffix(m, "%7D%7D"), "%7B%7B")
			} else if strings.HasPrefix(m, "%3C%3C") && strings.HasSuffix(m, "%3E%3E") {
				key = strings.TrimPrefix(strings.TrimSuffix(m, "%3E%3E"), "%3C%3C")
			}

			key = strings.TrimSpace(key)
			if val, ok := vars[key]; ok {
				changed = true
				return val
			}
			return m
		})
		if !changed {
			break
		}
	}
	return result
}
