# 📲 PhoneDrop

Drop documents from your phone straight onto your computer. Files land in
`C:\Users\William\PhoneDrops`.

This replaces the old `127.0.0.1:8780` version, which only worked on the exact
computer running it. This one prints your **real network address** so your
phone can actually reach it.

---

## One-time setup (≈3 minutes)

1. **Install Python** (only if you don't have it):
   - Go to <https://www.python.org/downloads/> and click the big download button.
   - Run the installer and **tick "Add Python to PATH"** on the first screen,
     then click Install.

2. **Get these two files onto your PC** (`phonedrop.py` and
   `start-phonedrop.bat`) — put them in a folder you'll remember, e.g.
   `C:\Users\William\PhoneDrop`.

---

## Using it

1. **Double-click `start-phonedrop.bat`.** A black window opens and shows
   something like:

   ```
   On your PHONE (connected to the SAME WiFi), open:
       http://192.168.1.42:8780
   ```

2. **On your phone, open that link** (type it into your browser, or bookmark
   it / add it to your home screen so it's one tap).

3. **Drop your documents.** They save instantly into
   `C:\Users\William\PhoneDrops`.

Keep the black window open while you use it. Closing it stops PhoneDrop.

---

## Make it always-on (optional but recommended)

So you never have to start it manually:

1. Press `Windows + R`, type `shell:startup`, press Enter — a folder opens.
2. Right-click `start-phonedrop.bat` → **Show more options → Create shortcut**.
3. Move that shortcut into the `shell:startup` folder.

Now PhoneDrop starts every time you log in to Windows.

---

## Good to know

- **Phone and PC must be on the same WiFi.** This sends files directly between
  your two devices over your home/office network — nothing goes to the cloud.
- If your phone says it can't connect, your PC's address may have changed —
  just re-open `start-phonedrop.bat` and use the new link it prints. (To stop
  the address changing, you can reserve a fixed IP for your PC in your router,
  or ask and I'll walk you through it.)
- Want it to work **anywhere, not just on the same WiFi** (e.g. from mobile
  data, or with your PC asleep)? That needs the cloud-synced version instead —
  ask and I'll set it up.
- Files are never overwritten — a second `report.pdf` becomes `report_1.pdf`.

To change the destination folder, edit the `SAVE_DIR` line near the top of
`phonedrop.py`.
