#!/usr/bin/env python3
"""
PhoneDrop — drop documents from your phone straight onto your computer.

Run this on your Windows PC. It starts a tiny local web server and prints a
link. Open that link on your phone (same WiFi), drop in any files, and they
land in C:\\Users\\William\\PhoneDrops on your computer.

No installs beyond Python. No cloud account. Binds to your real network
address (not 127.0.0.1) so the phone can actually reach it.
"""

import os
import re
import socket
import sys
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

# ── Settings ─────────────────────────────────────────────────────────────
# Where dropped files are saved. Change this one line to use a different
# folder. Falls back to a PhoneDrops folder in your user profile if the
# Windows-specific path doesn't exist (e.g. when testing on another machine).
SAVE_DIR = r"C:\Users\William\PhoneDrops"
PORT = 8780
# ─────────────────────────────────────────────────────────────────────────


def resolve_save_dir():
    """Use SAVE_DIR if its parent exists, else a PhoneDrops folder in HOME."""
    parent = os.path.dirname(SAVE_DIR.rstrip("\\/"))
    if os.path.isdir(parent):
        target = SAVE_DIR
    else:
        target = os.path.join(os.path.expanduser("~"), "PhoneDrops")
    os.makedirs(target, exist_ok=True)
    return target


def get_lan_ip():
    """Best-effort detection of this machine's address on the local network."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    except OSError:
        ip = "127.0.0.1"
    finally:
        s.close()
    return ip


def safe_filename(name):
    """Strip any path components and characters Windows won't allow."""
    name = name.replace("\\", "/").split("/")[-1]          # drop any path
    name = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "_", name).strip(" .")
    return name or "file"


def unique_path(folder, filename):
    """Never overwrite: add _1, _2, ... before the extension if needed."""
    base, ext = os.path.splitext(filename)
    candidate = os.path.join(folder, filename)
    i = 1
    while os.path.exists(candidate):
        candidate = os.path.join(folder, f"{base}_{i}{ext}")
        i += 1
    return candidate


def parse_multipart(body, boundary):
    """Split a multipart/form-data body into (filename, bytes) pairs.

    Works directly on bytes so binary files (PDFs, photos) are never altered.
    """
    delim = b"--" + boundary
    files = []
    for part in body.split(delim):
        if not part or part == b"\r\n" or part.startswith(b"--"):
            continue                      # preamble / closing delimiter
        if part.startswith(b"\r\n"):
            part = part[2:]
        if b"\r\n\r\n" not in part:
            continue
        head, data = part.split(b"\r\n\r\n", 1)
        if data.endswith(b"\r\n"):
            data = data[:-2]
        m = re.search(r'filename="([^"]*)"', head.decode("utf-8", "replace"))
        if not m or not m.group(1):
            continue                      # a non-file form field
        files.append((m.group(1), data))
    return files


PAGE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>PhoneDrop</title>
<style>
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  body { margin:0; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
         background:#0f172a; color:#e2e8f0; min-height:100vh;
         display:flex; flex-direction:column; align-items:center; padding:24px; }
  h1 { font-size:22px; margin:24px 0 4px; }
  p.sub { color:#94a3b8; margin:0 0 24px; font-size:14px; text-align:center; }
  label.drop { width:100%; max-width:480px; border:2px dashed #334155; border-radius:16px;
         background:#1e293b; padding:48px 24px; text-align:center; cursor:pointer;
         transition:border-color .15s, background .15s; display:block; }
  label.drop.hot { border-color:#38bdf8; background:#1e2c44; }
  .big { font-size:46px; }
  .pick { color:#38bdf8; font-weight:600; }
  input[type=file] { display:none; }
  ul { width:100%; max-width:480px; list-style:none; padding:0; margin:20px 0 0; }
  li { background:#1e293b; border-radius:10px; padding:12px 14px; margin-bottom:8px;
       display:flex; align-items:center; gap:10px; font-size:14px; }
  li.ok::before { content:"\\2705"; }
  li.err { color:#fca5a5; } li.err::before { content:"\\26a0\\fe0f"; }
  .bar { height:4px; background:#334155; border-radius:4px; overflow:hidden; margin-top:6px; }
  .bar > div { height:100%; width:0; background:#38bdf8; transition:width .2s; }
</style>
</head>
<body>
  <h1>📲 PhoneDrop</h1>
  <p class="sub">Drop documents here — they go straight to your computer.</p>
  <label class="drop" id="drop">
    <div class="big">📥</div>
    <div>Tap to choose files<br>or drag them here</div>
    <div class="pick" style="margin-top:8px;">Choose files</div>
    <input id="file" type="file" multiple />
  </label>
  <ul id="list"></ul>
<script>
  var drop = document.getElementById('drop');
  var file = document.getElementById('file');
  var list = document.getElementById('list');

  file.addEventListener('change', function(){ send(file.files); file.value=''; });
  ['dragenter','dragover'].forEach(function(e){
    drop.addEventListener(e, function(ev){ ev.preventDefault(); drop.classList.add('hot'); });
  });
  ['dragleave','drop'].forEach(function(e){
    drop.addEventListener(e, function(ev){ ev.preventDefault(); drop.classList.remove('hot'); });
  });
  drop.addEventListener('drop', function(ev){ if (ev.dataTransfer.files.length) send(ev.dataTransfer.files); });

  function send(files){
    if (!files || !files.length) return;
    var fd = new FormData();
    for (var i=0;i<files.length;i++) fd.append('files', files[i]);

    var li = document.createElement('li');
    li.textContent = 'Sending ' + files.length + ' file' + (files.length>1?'s':'') + '…';
    var bar = document.createElement('div'); bar.className='bar';
    var fill = document.createElement('div'); bar.appendChild(fill); li.appendChild(bar);
    list.prepend(li);

    var xhr = new XMLHttpRequest();
    xhr.open('POST','/upload');
    xhr.upload.onprogress = function(e){ if(e.lengthComputable) fill.style.width=(e.loaded/e.total*100)+'%'; };
    xhr.onload = function(){
      if (xhr.status===200){ li.className='ok'; li.textContent='Saved: '+xhr.responseText; }
      else { li.className='err'; li.textContent='Failed — try again'; }
    };
    xhr.onerror = function(){ li.className='err'; li.textContent='Connection lost — is the computer still running PhoneDrop?'; };
    xhr.send(fd);
  }
</script>
</body>
</html>"""


class Handler(BaseHTTPRequestHandler):
    server_version = "PhoneDrop/2.0"

    def _send(self, code, body, ctype="text/plain; charset=utf-8"):
        if isinstance(body, str):
            body = body.encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        self._send(200, PAGE, "text/html; charset=utf-8")

    def do_POST(self):
        if self.path != "/upload":
            self._send(404, "Not found")
            return
        ctype = self.headers.get("Content-Type", "")
        m = re.search(r"boundary=(.+)$", ctype)
        if not m:
            self._send(400, "Bad upload")
            return
        boundary = m.group(1).strip('"').encode("utf-8")
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)

        saved = []
        for raw_name, data in parse_multipart(body, boundary):
            name = safe_filename(raw_name)
            path = unique_path(SAVE_FOLDER, name)
            with open(path, "wb") as fh:
                fh.write(data)
            saved.append(os.path.basename(path))
            print(f"  [{datetime.now():%H:%M:%S}] saved {os.path.basename(path)} "
                  f"({len(data):,} bytes)")

        if saved:
            self._send(200, ", ".join(saved))
        else:
            self._send(400, "No files received")

    def log_message(self, *args):
        pass  # keep the console clean; we print our own lines


SAVE_FOLDER = resolve_save_dir()


def main():
    ip = get_lan_ip()
    print("=" * 58)
    print("  📲  PhoneDrop is running")
    print("=" * 58)
    print(f"  Files are saved to:  {SAVE_FOLDER}")
    print()
    print("  On your PHONE (connected to the SAME WiFi), open:")
    print(f"      http://{ip}:{PORT}")
    print()
    print("  Tip: bookmark that link on your phone's home screen.")
    print("  Keep this window open. Press Ctrl+C to stop.")
    print("=" * 58)
    try:
        ThreadingHTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
    except KeyboardInterrupt:
        print("\nPhoneDrop stopped.")
    except OSError as e:
        print(f"\nCould not start on port {PORT}: {e}")
        print("Another PhoneDrop may already be running, or the port is in use.")
        sys.exit(1)


if __name__ == "__main__":
    main()
