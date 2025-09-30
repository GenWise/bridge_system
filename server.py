#!/usr/bin/env python3
"""
Simple HTTP server for testing the Uma + PS Bridge System locally
"""

import http.server
import socketserver
import os
import sys
from pathlib import Path

# Get the directory where this script is located
BASE_DIR = Path(__file__).parent.absolute()

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def end_headers(self):
        # Add CORS headers for local development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

        # Set correct MIME types
        if self.path.endswith('.js'):
            self.send_header('Content-Type', 'application/javascript')
        elif self.path.endswith('.css'):
            self.send_header('Content-Type', 'text/css')
        elif self.path.endswith('.json'):
            self.send_header('Content-Type', 'application/json')

        super().end_headers()

def start_server(port=9999):
    """Start a local HTTP server"""

    # Change to the base directory
    os.chdir(BASE_DIR)

    with socketserver.TCPServer(("", port), CustomHTTPRequestHandler) as httpd:
        print(f"Starting Uma + PS Bridge System server...")
        print(f"Server running at: http://localhost:{port}")
        print(f"Serving from: {BASE_DIR}")
        print("\nOpen your browser and navigate to:")
        print(f"  http://localhost:{port}")
        print("\nPress Ctrl+C to stop the server")

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\nServer stopped.")
            sys.exit(0)

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Start Uma + PS Bridge System server')
    parser.add_argument('--port', '-p', type=int, default=9999,
                        help='Port to run the server on (default: 9999)')

    args = parser.parse_args()
    start_server(args.port)