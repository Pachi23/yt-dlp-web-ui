package server

import (
	"context"
	"fmt"
	"io"
	"io/fs"
	"log"
	"net/http"
	"net/rpc"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/filesystem"
	"github.com/gofiber/websocket/v2"
	"github.com/marcopeocchi/yt-dlp-web-ui/server/rest"
)

var db MemoryDB

func RunBlocking(port int, frontend fs.FS) {
	db.Restore()

	service := new(Service)
	rpc.Register(service)

	app := fiber.New()

	app.Use(cors.New())
	app.Use("/", filesystem.New(filesystem.Config{
		Root: http.FS(frontend),
	}))

	app.Get("/settings", func(c *fiber.Ctx) error {
		return c.Redirect("/")
	})
	app.Get("/archive", func(c *fiber.Ctx) error {
		return c.Redirect("/")
	})

	app.Post("/downloaded", rest.ListDownloaded)

	app.Post("/delete", rest.DeleteFile)
	app.Get("/d/:id", rest.SendFile)

	// RPC handlers
	// websocket
	app.Get("/ws-rpc", websocket.New(func(c *websocket.Conn) {
		c.WriteMessage(websocket.TextMessage, []byte(`{
			"status": "connected"
		}`))

		for {
			mtype, reader, err := c.NextReader()
			if err != nil {
				break
			}
			res := NewRPCRequest(reader).Call()

			writer, err := c.NextWriter(mtype)
			if err != nil {
				break
			}
			io.Copy(writer, res)
		}
	}))
	// http-post
	app.Post("/http-rpc", func(c *fiber.Ctx) error {
		reader := c.Context().RequestBodyStream()
		writer := c.Response().BodyWriter()

		res := NewRPCRequest(reader).Call()
		io.Copy(writer, res)

		return nil
	})

	app.Server().StreamRequestBody = true

	go gracefulShutdown(app)
	go autoPersist(time.Minute * 5)

	log.Fatal(app.Listen(fmt.Sprintf(":%d", port)))
}

func gracefulShutdown(app *fiber.App) {
	ctx, stop := signal.NotifyContext(context.Background(),
		os.Interrupt,
		syscall.SIGTERM,
		syscall.SIGQUIT,
	)

	go func() {
		<-ctx.Done()
		log.Println("shutdown signal received")

		defer func() {
			db.Persist()
			stop()
			app.ShutdownWithTimeout(time.Second * 5)
		}()
	}()
}

func autoPersist(d time.Duration) {
	for {
		db.Persist()
		time.Sleep(d)
	}
}
