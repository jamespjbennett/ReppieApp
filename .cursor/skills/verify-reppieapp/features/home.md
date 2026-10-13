# Home

Home is the first screen. It welcomes the user, points at the file to edit, tells them how to open dev tools on the current platform, and, on web, shows the installed Expo version.

## Sub-features

- `home-welcome` shows `Welcome to Expo` and `get started`.
- `home-edit-hint` shows the row `Try editing` with `src/app/index.tsx`.
- `home-devtools` shows `Dev tools` and, on web, `use browser devtools`.
- `home-reset` shows `Fresh start` with `npm run reset-project`.
- `home-badge` shows `v` plus the installed `expo` package version.

## How to get to it (user POV)

- Open the site root.
- Choose `Home` in the web top bar.
- Choose the `Home` tab in the iOS or Android bottom bar.

## Driving it with the Cursor browser

Preconditions:

- `control-reppie doctor` prints `ok` and a `url`.
- The browser is locked after navigation.

- **Open root.** Go to the doctor URL with path `/`. Run `browser_navigate` with that `url`. `document.body.innerText` shows `Welcome to Expo`, `get started`, and `Expo Starter`.
- **Read the edit hint.** Run `browser_snapshot` and `Runtime.evaluate` on `document.body.innerText`. The text includes `Try editing` and `src/app/index.tsx`. The snapshot may omit those lines because they are not interactive.
- **Read the web dev-tools hint.** The same text has `Dev tools` followed by `use browser devtools`.
- **Read the reset hint.** The same text has `Fresh start` followed by `npm run reset-project`.
- **Read the version badge.** The badge text is `v` immediately followed by `expo_version` from doctor. The server HTML splits those characters with a comment; the rendered text does not.
- **Top-bar entry.** If you arrived another way, choose `Home`. Run `browser_snapshot`, then `browser_click` on the link named `Home` (`href` `/`). The same welcome text is showing.
- **Proof.** Run `browser_take_screenshot` with `fullPage` true. Copy the tool's `Saved to` file to `artifacts/home/home.png`. Save the snapshot as `artifacts/home/home.aria.txt` and write the doctor URL into `artifacts/home/notes.txt`. The screenshot shows `Expo Starter` and `Welcome to Expo`.

## Gotchas

- The native Home tab is a different control from the web `Home` link. This recipe does not press the bottom tab bar.
- On a device, `Dev tools` reads shake-or-`m`, not `use browser devtools`. On the iOS simulator it reads `cmd+d`. On the Android emulator it reads `cmd+m`. A web snapshot that shows `use browser devtools` fails the native strings, and the reverse is also true.
- The badge version is the `expo` package version, not the `version` in `app.json`.
- `Welcome to Expo` is not a heading role. Match the text.
