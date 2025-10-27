package main

import (
	"embed"
	"errors"
	"fmt"
	"html/template"
	"io"
	"net/http"
	"os"
	"strings"

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
	templates["cv"] = template.Must(
		template.New("html/layout.html").ParseFS(files, "html/layout.html", "html/cv.html"),
	)
	templates["blog"] = template.Must(template.ParseFiles("html/blog.html", "html/layout.html"))

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
	e.GET("/cv/:year", CV)
	e.GET("/blog/:blog_slug", Blog)

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

func Blog(c echo.Context) error {
	type blogData struct {
		Title   string
		Content template.HTML
	}

	blogSlug := c.Param("blog_slug")

	blogTitle := blogSlugToTitle(blogSlug)
	blogContent, err := os.ReadFile(fmt.Sprintf("./html/articles/%s.html", blogSlug))
	if err != nil {
		blogTitle = "Not Found"
		notFoundContent, err := os.ReadFile("./html/not-found.html")
		if err != nil {
			// TODO: Redirect to the home page maybe
		}
		blogContent = notFoundContent
	}

	return c.Render(http.StatusOK, "blog", blogData{
		Title:   blogTitle,
		Content: template.HTML(blogContent),
	})
}

func blogSlugToTitle(s string) string {
	ss := strings.Split(s, "-")
	for i, v := range ss {
		ss[i] = strings.ToUpper(v[0:1]) + v[1:]
	}
	return strings.Join(ss, " ")
}

func CV(c echo.Context) error {
	data := make(map[string]interface{})

	return c.Render(http.StatusOK, "cv", data)
}
