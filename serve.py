#!/usr/bin/python3
port = 8080
from http.server import HTTPServer, SimpleHTTPRequestHandler
print('Launching an http server on port {}'.format(port))
HTTPServer(('', port), SimpleHTTPRequestHandler).serve_forever()
