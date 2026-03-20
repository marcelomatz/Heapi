package database

import (
	"heapi/internal/models"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB() error {
	var err error
	DB, err = gorm.Open(sqlite.Open("heapi.db"), &gorm.Config{})
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
