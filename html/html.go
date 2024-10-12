package html

import (
	"embed"
	"io"
	"text/template"
)

//go:embed *
var files embed.FS

var (
	home = parse("home.html")
)

type HomeParams struct {
	Title   string
}

func Home(w io.Writer, p HomeParams, partial string) error {
	if partial == "" {
		partial = "layout.html"
	}
	return home.ExecuteTemplate(w, partial, p)
}

func parse(file string) *template.Template {
	return template.Must(
		template.New("layout.html").ParseFS(files, "layout.html", file))
}
