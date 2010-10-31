#!/usr/bin/python3
from http.server import HTTPServer, SimpleHTTPRequestHandler
HTTPServer(('', 8080)HERE, SimpleHTTPRequestHandler).serve_forever()
