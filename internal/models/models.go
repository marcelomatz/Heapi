package models

type Collection struct {
	ID          string    `json:"ID" gorm:"primaryKey" yaml:"id"`
	Name        string    `json:"name" yaml:"name"`
	Description string    `json:"description" yaml:"description"`
	Color       string    `json:"color" yaml:"color"`
	Order       int       `json:"order" yaml:"order"`
	IsCollapsed bool      `json:"is_collapsed" yaml:"is_collapsed"`
	Requests    []Request `json:"requests" gorm:"foreignKey:CollectionID" yaml:"requests"`
	CreatedAt   int64     `json:"created_at" gorm:"autoCreateTime" yaml:"-"`
	UpdatedAt   int64     `json:"updated_at" gorm:"autoUpdateTime" yaml:"-"`
}

type Request struct {
	ID             string `json:"ID" gorm:"primaryKey" yaml:"id"`
	CollectionID   string `json:"collection_id" yaml:"-"`
	Name           string `json:"name" yaml:"name"`
	Method         string `json:"method" yaml:"method"`
	URL            string `json:"url" yaml:"url"`
	Headers        string `json:"headers" yaml:"headers"`                  // JSON string
	Body           string `json:"body" yaml:"body"`                        // JSON string
	AuthConfig     string `json:"auth_config" yaml:"auth_config"`          // JSON string
	LastResponse   string `json:"last_response" gorm:"type:text" yaml:"-"` // Persisted in DB, excluded from YAML
	LastStatusCode int    `json:"last_status_code" yaml:"-"`               // Persisted in DB, excluded from YAML
	LastDuration   int64  `json:"last_duration" yaml:"-"`                  // ms
	LastHeaders    string `json:"last_headers" yaml:"-"`                   // JSON string
}

type Environment struct {
	ID        string `json:"ID" gorm:"primaryKey" yaml:"id"`
	Name      string `json:"name" yaml:"name"`
	Variables string `json:"variables" yaml:"variables"` // JSON string
}
