# CISSP Static Website

This is a static HTML/CSS site. You can run it locally with Python's built-in HTTP server.

## Run Locally

From the project root:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

If port `8000` is already in use, choose another port:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080/`.

## Stop the Server

Press `Ctrl+C` in the terminal where the server is running.
