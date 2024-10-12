package main

import (
	"embed"
	"errors"
	"html/template"
	"io"
	"net/http"
	"os"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

//go:embed html/*.html
var files embed.FS

type TemplateRegistry struct {
	templates map[string]*template.Template
}

func (t *TemplateRegistry) Render(w io.Writer, name string, data interface{}, c echo.Context) error {
	tmpl, ok := t.templates[name]
	if !ok {
		err := errors.New("Template not found -> " + name)
		return err
	}
	return tmpl.ExecuteTemplate(w, "layout", data)
}

func main() {
	templates := make(map[string]*template.Template)
	templates["home"] = template.Must(
		template.New("html/layout.html").ParseFS(files, "html/layout.html", "html/home.html"),
	)

	e := echo.New()
	e.Renderer = &TemplateRegistry{
		templates: templates,
	}

	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CSRFWithConfig(middleware.CSRFConfig{
		TokenLookup: "form:CSRF",
	}))

	e.Static("/static", "public")

	e.GET("/", Home)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	e.Logger.Fatal(e.Start(":" + port))
}

func Home(c echo.Context) error {
	data := make(map[string]interface{})

	return c.Render(http.StatusOK, "home", data)
}
