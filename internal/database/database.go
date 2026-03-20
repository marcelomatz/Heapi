package database

import (
	"heapi/internal/models"
	"heapi/internal/storage"
	"path/filepath"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB() error {
	dbPath := filepath.Join(storage.AppDataDir, "heapi.db")
	var err error
	DB, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		return err
	}

	// Migrate the schema
	return DB.AutoMigrate(
		&models.Collection{},
		&models.Request{},
		&models.Environment{},
	)
}
