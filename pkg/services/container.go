package services

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"html/template"
	"log/slog"
	"math/rand"
	"os"
	"path/filepath"
	"strings"

	_ "github.com/mattn/go-sqlite3"
	"github.com/labstack/echo/v4"
	"github.com/felipekafuri/bandeira/config"
	"github.com/felipekafuri/bandeira/ent"
	"github.com/felipekafuri/bandeira/ent/user"
	inertia "github.com/romsar/gonertia/v2"
	"golang.org/x/crypto/bcrypt"

	entsql "entgo.io/ent/dialect/sql"
)

// Container contains all services used by the application and provides an easy way to handle dependency
// injection including within tests.
type Container struct {
	// Validator stores a validator
	Validator *Validator

	// Web stores the web framework.
	Web *echo.Echo

	// Config stores the application configuration.
	Config *config.Config

	// Cache contains the cache client.
	Cache *CacheClient

	// Database stores the connection to the database.
	Database *sql.DB

	// ORM stores the Ent ORM client.
	ORM *ent.Client

	// Inertia for React
	Inertia *inertia.Inertia
}

// NewContainer creates and initializes a new Container.
func NewContainer() *Container {
	c := new(Container)
	c.initConfig()
	c.initValidator()
	c.initWeb()
	c.initCache()
	c.initDatabase()
	c.initORM()
	c.seedAdminUser()
	c.initInertia()
	return c
}

// Shutdown gracefully shuts the Container down and disconnects all connections.
func (c *Container) Shutdown() error {
	// Shutdown the web server.
	webCtx, webCancel := context.WithTimeout(context.Background(), c.Config.HTTP.ShutdownTimeout)
	defer webCancel()
	if err := c.Web.Shutdown(webCtx); err != nil {
		return err
	}

	// Shutdown the ORM (also closes the underlying database connection).
	if err := c.ORM.Close(); err != nil {
		return err
	}

	// Shutdown the cache.
	c.Cache.Close()

	return nil
}

// initConfig initializes configuration.
func (c *Container) initConfig() {
	cfg, err := config.GetConfig()
	if err != nil {
		panic(fmt.Sprintf("failed to load config: %v", err))
	}
	c.Config = &cfg

	// Configure logging.
	switch cfg.App.Environment {
	case config.EnvProduction:
		slog.SetLogLoggerLevel(slog.LevelInfo)
	default:
		slog.SetLogLoggerLevel(slog.LevelDebug)
	}
}

// initValidator initializes the validator.
func (c *Container) initValidator() {
	c.Validator = NewValidator()
}

// initWeb initializes the web framework.
func (c *Container) initWeb() {
	c.Web = echo.New()
	c.Web.HideBanner = true
	c.Web.Validator = c.Validator
}

// initCache initializes the cache.
func (c *Container) initCache() {
	store, err := newInMemoryCache(c.Config.Cache.Capacity)
	if err != nil {
		panic(err)
	}

	c.Cache = NewCacheClient(store)
}

// initDatabase initializes the database.
func (c *Container) initDatabase() {
	var err error
	var connection string

	switch c.Config.App.Environment {
	case config.EnvTest:
		connection = c.Config.Database.TestConnection
	default:
		connection = c.Config.Database.Connection
	}

	c.Database, err = openDB(c.Config.Database.Driver, connection)
	if err != nil {
		panic(err)
	}
}

// initORM initializes the Ent ORM client and runs auto-migration.
func (c *Container) initORM() {
	drv := entsql.OpenDB(c.Config.Database.Driver, c.Database)
	c.ORM = ent.NewClient(ent.Driver(drv))

	if err := c.ORM.Schema.Create(context.Background()); err != nil {
		panic(fmt.Sprintf("failed to create schema resources: %v", err))
	}
}

// seedAdminUser creates the initial admin user if no users exist and
// the admin email and password are configured.
func (c *Container) seedAdminUser() {
	count, err := c.ORM.User.Query().Count(context.Background())
	if err != nil {
		slog.Error("failed to count users", "error", err)
		return
	}
	if count > 0 {
		return
	}

	email := c.Config.Auth.AdminEmail
	password := c.Config.Auth.AdminPassword
	if password == "" {
		slog.Warn("no users exist and BANDEIRA_AUTH_ADMINPASSWORD not set — skipping admin seed")
		return
	}
	// Backward compat: existing deployments may only have the password set.
	// Fall back to a default email so they aren't locked out on upgrade.
	if email == "" {
		email = "admin@bandeira.local"
		slog.Info("BANDEIRA_AUTH_ADMINEMAIL not set, using default", "email", email)
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		slog.Error("failed to hash admin password", "error", err)
		return
	}

	_, err = c.ORM.User.Create().
		SetEmail(email).
		SetPassword(string(hash)).
		SetName("Admin").
		SetRole(user.RoleAdmin).
		Save(context.Background())
	if err != nil {
		slog.Error("failed to seed admin user", "error", err)
		return
	}
	slog.Info("seeded admin user", "email", email)
}

func ProjectRoot() string {
	currentDir, err := os.Getwd()
	if err != nil {
		return ""
	}

	for {
		_, err := os.ReadFile(filepath.Join(currentDir, "go.mod"))
		if os.IsNotExist(err) {
			if currentDir == filepath.Dir(currentDir) {
				return ""
			}
			currentDir = filepath.Dir(currentDir)
			continue
		} else if err != nil {
			return ""
		}
		break
	}
	return currentDir
}

func (c *Container) getInertia() *inertia.Inertia {
	rootDir := ProjectRoot()
	viteHotFile := filepath.Join(rootDir, "public", "hot")
	rootViewFile := filepath.Join(rootDir, "resources", "views", "root.html")
	manifestPath := filepath.Join(rootDir, "public", "build", "manifest.json")
	viteManifestPath := filepath.Join(rootDir, "public", "build", ".vite", "manifest.json")

	url, err := viteHotFileUrl(viteHotFile)
	if err != nil {
		panic(err)
	}
	if url != "" {
		i, err := inertia.NewFromFile(rootViewFile)
		if err != nil {
			panic(err)
		}

		i.ShareTemplateFunc("vite", func(entry string) (template.HTML, error) {
			if entry != "" && !strings.HasPrefix(entry, "/") {
				entry = "/" + entry
			}
			htmlTag := fmt.Sprintf(`<script type="module" src="%s%s"></script>`, url, entry)
			return template.HTML(htmlTag), nil
		})
		i.ShareTemplateFunc("viteReactRefresh", viteReactRefresh(url))

		return i
	}

	actualManifestPath := manifestPath
	if _, err := os.Stat(manifestPath); os.IsNotExist(err) {
		if _, err := os.Stat(viteManifestPath); err == nil {
			actualManifestPath = viteManifestPath
		} else {
			panic(fmt.Errorf("inertia build manifest file not found at %s or %s", manifestPath, viteManifestPath))
		}
	}

	i, err := inertia.NewFromFile(
		rootViewFile,
		inertia.WithVersionFromFile(actualManifestPath),
	)
	if err != nil {
		panic(err)
	}

	i.ShareTemplateFunc("vite", vite(actualManifestPath, "/build/"))
	i.ShareTemplateFunc("viteReactRefresh", viteReactRefresh(url))

	return i
}

func (c *Container) initInertia() {
	c.Inertia = c.getInertia()
}

func vite(manifestPath, buildDir string) func(path string) (template.HTML, error) {
	f, err := os.Open(manifestPath)
	if err != nil {
		panic(err)
	}
	defer f.Close()

	viteAssets := make(map[string]*struct {
		File   string   `json:"file"`
		Source string   `json:"src"`
		CSS    []string `json:"css"`
	})
	err = json.NewDecoder(f).Decode(&viteAssets)
	if err != nil {
		panic(err)
	}

	return func(p string) (template.HTML, error) {
		if val, ok := viteAssets[p]; ok {
			cssLinks := ""
			for _, css := range val.CSS {
				cssLinks += fmt.Sprintf(`<link rel="stylesheet" href="%s%s">`, buildDir, css)
			}
			htmlTag := fmt.Sprintf(
				`%s<script type="module" src="%s%s"></script>`,
				cssLinks,
				buildDir,
				val.File,
			)
			return template.HTML(htmlTag), nil
		}
		return "", fmt.Errorf("asset %q not found", p)
	}
}

// openDB opens a database connection.
func openDB(driver, connection string) (*sql.DB, error) {
	if driver == "sqlite3" {
		d := strings.Split(connection, "/")
		if len(d) > 1 {
			dirpath := strings.Join(d[:len(d)-1], "/")
			if err := os.MkdirAll(dirpath, 0755); err != nil {
				return nil, err
			}
		}

		if strings.Contains(connection, "$RAND") {
			connection = strings.Replace(connection, "$RAND", fmt.Sprint(rand.Int()), 1)
		}
	}

	return sql.Open(driver, connection)
}

func viteHotFileUrl(viteHotFile string) (string, error) {
	_, err := os.Stat(viteHotFile)
	if err != nil {
		return "", nil
	}
	content, err := os.ReadFile(viteHotFile)
	if err != nil {
		return "", err
	}
	url := strings.TrimSpace(string(content))
	if strings.HasPrefix(url, "http://") || strings.HasPrefix(url, "https://") {
		url = url[strings.Index(url, ":")+1:]
	} else {
		url = "//localhost:1323"
	}
	return url, nil
}

func viteReactRefresh(url string) func() (template.HTML, error) {
	return func() (template.HTML, error) {
		if url == "" {
			return "", nil
		}
		script := fmt.Sprintf(`
<script type="module">
    import RefreshRuntime from '%s/@react-refresh'
    RefreshRuntime.injectIntoGlobalHook(window)
    window.$RefreshReg$ = () => {}
    window.$RefreshSig$ = () => (type) => type
    window.__vite_plugin_react_preamble_installed__ = true
</script>`, url)

		return template.HTML(script), nil
	}
}
