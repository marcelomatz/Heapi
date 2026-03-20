package storage

import (
	"heapi/internal/models"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
	"gopkg.in/yaml.v3"
)

const (
	CollectionsDir  = "collections"
	EnvironmentsDir = "environments"
)

func EnsureDirs() error {
	for _, dir := range []string{CollectionsDir, EnvironmentsDir} {
		if _, err := os.Stat(dir); os.IsNotExist(err) {
			if err := os.MkdirAll(dir, 0755); err != nil {
				return err
			}
		}
	}
	return nil
}

// Collections
func LoadCollections() ([]models.Collection, error) {
	var collections []models.Collection
	files, err := os.ReadDir(CollectionsDir)
	if err != nil {
		return nil, err
	}

	for _, file := range files {
		if file.IsDir() {
			continue
		}
		ext := strings.ToLower(filepath.Ext(file.Name()))
		if ext != ".yaml" && ext != ".yml" && ext != ".json" {
			continue
		}

		path := filepath.Join(CollectionsDir, file.Name())
		data, err := os.ReadFile(path)
		if err != nil {
			fmt.Printf("Error reading collection file %s: %v\n", path, err)
			continue
		}

		var col models.Collection
		if ext == ".json" {
			err = json.Unmarshal(data, &col)
		} else {
			err = yaml.Unmarshal(data, &col)
		}

		if err != nil {
			fmt.Printf("Error unmarshaling collection %s: %v\n", path, err)
			continue
		}

		// Ensure IDs
		if col.ID == "" {
			col.ID = uuid.New().String()
		}
		for i := range col.Requests {
			if col.Requests[i].ID == "" {
				col.Requests[i].ID = uuid.New().String()
			}
			col.Requests[i].CollectionID = col.ID
		}

		collections = append(collections, col)
	}

	return collections, nil
}

func SaveCollection(col models.Collection, format string) error {
	var data []byte
	var err error

	if strings.ToLower(format) == "json" {
		data, err = json.MarshalIndent(col, "", "  ")
	} else {
		data, err = yaml.Marshal(col)
	}

	if err != nil {
		return err
	}

	// Use ID as filename for stability and Git-friendliness
	filename := fmt.Sprintf("%s.%s", col.ID, strings.ToLower(format))
	path := filepath.Join(CollectionsDir, filename)

	// Clean up legacy name-based files if they exist (Migration support)
	legacyFilename := fmt.Sprintf("%s.%s", SanitizeFilename(col.Name), strings.ToLower(format))
	if legacyFilename != filename {
		legacyPath := filepath.Join(CollectionsDir, legacyFilename)
		if _, err := os.Stat(legacyPath); err == nil {
			_ = os.Remove(legacyPath)
		}
	}

	return os.WriteFile(path, data, 0644)
}

func DeleteCollection(id string) error {
	// Try ID-based deletion first (New strategy)
	for _, ext := range []string{".yaml", ".yml", ".json"} {
		path := filepath.Join(CollectionsDir, id+ext)
		if _, err := os.Stat(path); err == nil {
			_ = os.Remove(path)
		}
	}

	// Also try name-based deletion for legacy files
	cols, err := LoadCollections()
	if err == nil {
		for _, col := range cols {
			if col.ID == id {
				for _, ext := range []string{".yaml", ".yml", ".json"} {
					path := filepath.Join(CollectionsDir, SanitizeFilename(col.Name)+ext)
					if _, err := os.Stat(path); err == nil {
						_ = os.Remove(path)
					}
				}
			}
		}
	}
	return nil
}

// Environments
func LoadEnvironments() ([]models.Environment, error) {
	var environments []models.Environment
	files, err := os.ReadDir(EnvironmentsDir)
	if err != nil {
		return nil, err
	}

	for _, file := range files {
		if file.IsDir() {
			continue
		}
		ext := strings.ToLower(filepath.Ext(file.Name()))
		if ext != ".yaml" && ext != ".yml" && ext != ".json" {
			continue
		}

		path := filepath.Join(EnvironmentsDir, file.Name())
		data, err := os.ReadFile(path)
		if err != nil {
			continue
		}

		var env models.Environment
		if ext == ".json" {
			err = json.Unmarshal(data, &env)
		} else {
			err = yaml.Unmarshal(data, &env)
		}

		if err != nil {
			continue
		}

		if env.ID == "" {
			env.ID = uuid.New().String()
		}
		environments = append(environments, env)
	}

	return environments, nil
}

func SaveEnvironment(env models.Environment, format string) error {
	var data []byte
	var err error

	if strings.ToLower(format) == "json" {
		data, err = json.MarshalIndent(env, "", "  ")
	} else {
		data, err = yaml.Marshal(env)
	}

	if err != nil {
		return err
	}

	filename := fmt.Sprintf("%s.%s", SanitizeFilename(env.Name), strings.ToLower(format))
	path := filepath.Join(EnvironmentsDir, filename)
	return os.WriteFile(path, data, 0644)
}

func DeleteEnvironment(id string) error {
	envs, err := LoadEnvironments()
	if err != nil {
		return err
	}
	for _, env := range envs {
		if env.ID == id {
			for _, ext := range []string{".yaml", ".yml", ".json"} {
				path := filepath.Join(EnvironmentsDir, SanitizeFilename(env.Name)+ext)
				if _, err := os.Stat(path); err == nil {
					_ = os.Remove(path)
				}
			}
			return nil
		}
	}
	return nil
}

func YamlMarshal(v interface{}) ([]byte, error) {
	return yaml.Marshal(v)
}

func SanitizeFilename(name string) string {
	r := strings.NewReplacer("/", "-", "\\", "-", ":", "-", "*", "-", "?", "-", "\"", "-", "<", "-", ">", "-", "|", "-")
	return r.Replace(name)
}
