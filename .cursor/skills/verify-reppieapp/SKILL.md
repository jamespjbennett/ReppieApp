---
name: verify-reppieapp
description: Drive ReppieApp's Expo web UI in a browser to prove Home, Explore, and Docs the way a user would. Use when changing screens, tabs, collapsible sections, or links in ReppieApp and a user-level proof is required.
---

# Verify ReppieApp

ReppieApp is an Expo Router starter. People use it as an iOS and Android tab app (Home and Explore). The same project also serves a web UI. This skill drives that web UI. It does not launch the iOS simulator, Android emulator, or Expo Go.

Web and native do not present the same chrome:

- Web puts a top bar on the page: `Expo Starter`, `Home`, `Explore`, and `Docs`.
- iOS and Android put `Home` and `Explore` in a bottom tab bar and have no `Docs` tab.
- On web, `Docs` is a new browser tab to `https://docs.expo.dev`. On iOS and Android, the same control opens an in-app browser.
- Home is a workout log. The user types a sentence, presses Parse, edits the draft, and presses Save. Confirmed logs stay after a reload.

A passing web run does not prove those native paths.

## Launch

From the repo root, with permission to bind a local port:

```bash
.cursor/skills/verify-reppieapp/scripts/control-reppie launch
```

The script starts `npx expo start --localhost --port <port>` with `CI=1` and `EXPO_NO_TELEMETRY=1`. `CI=1` keeps Metro from prompting and also disables file reloads. After editing app code, run cleanup and launch again before driving.

Metro binds `::1` only. Use the printed `http://localhost:<port>`. `http://127.0.0.1:<port>` is connection refused.

The log line `Waiting on http://localhost:<port>` means the process is listening. The app is ready only when launch exits 0, which requires one `curl` of `/` to return HTML containing `Welcome to` and `Expo Starter`. That first server render compiles the web bundle and often takes about 90 seconds. Do not retry it with a short timeout; an aborted request starts another bundle.

Confirmed logs live in `reppie.db` in the browser. A fresh server still serves an empty list until the user saves one.

Only one verification server per checkout. A second `launch` exits without touching the one already recorded. Do not start another Metro in this repo while it is up; they share `.expo`. Never kill a process this script did not start. A developer server on port 8081 is left alone. The script picks the first free port from 8091 through 8110.

## Doctor

Run this before driving, and again whenever the page looks stale:

```bash
.cursor/skills/verify-reppieapp/scripts/control-reppie doctor
```

Exit 0 prints `ok`, `url`, `port`, `root_pid`, `listener_pid`, `expo_version`, and `bind=::1`. It checks that the recorded process is alive, that the listener is a descendant of that process, and that `/` contains `Welcome to`, `Expo Starter`, and the installed `expo` package version (`node_modules/expo/package.json`). Doctor does not start or stop anything.

`control-reppie url` prints the recorded URL.

## Drive

Drive the recorded URL with the Cursor browser. Leave `position` unset so the browser stays in the background.

1. `browser_navigate` with `url` set to the doctor URL plus the path in the feature file.
2. `browser_lock` with `action` `lock`.
3. `browser_snapshot`. Click with `browser_click` and the snapshot `ref`. Do not click by coordinates.
4. `browser_snapshot` again after the action. `browser_take_screenshot` with `fullPage` true. The tool writes the image outside the repo and returns a `Saved to` path. Copy that file into `artifacts/<feature-id>/`.
5. `browser_lock` with `action` `unlock` when the feature is done.

`browser_snapshot` on this app lists interactive nodes only. Static sentences are `div` text and do not show up there. Collapsible titles are unnamed `generic` nodes. Before clicking one, read the visible labels with `Runtime.evaluate` on `[tabindex="0"]` `innerText`, in the same order as the snapshot, and click the ref whose text is the title. After the click, prove body copy with `document.body.innerText` and the screenshot, not with the snapshot names.

Stable handles on web:

- `Home` is a link to `/`.
- `Explore` is a link to `/explore`.
- `Docs` is a link to `https://docs.expo.dev` with `role="link"` and `target="_blank"`.
- Collapsible titles are focusable controls (`tabindex="0"`) with no role and no accessible name. The snapshot calls them `generic`. Their visible labels are on `innerText`. Closed sections omit their body text from the document. The chevron is `rotate(90deg)` when closed and `rotate(-90deg)` when open.
- Link names can include a trailing icon, so `Docs` may appear as `Docs ` and `Expo documentation` the same way. Match the prefix.
- Home copy that must be visible: `Welcome to Reppie`, a field named `Workout sentence`, buttons `Parse` and `Save`, and `v` plus the installed expo version. After saving `bench 3x8 80kg`, the history shows that sentence and `Bench`.

Read `.cursor/skills/verify-reppieapp/features/README.md` and the feature file before driving. A proof of one entry point does not cover the others listed there.

## Evidence

Write proof under `.cursor/skills/verify-reppieapp/artifacts/<feature-id>/`. Cleanup never removes that directory.

For each driven feature, keep:

- The accessibility snapshot before the action and the snapshot after it.
- A full-page screenshot after the action, with ReppieApp's own chrome visible (`Expo Starter`, `Home`, or `Explore`). Copy it from the tool's `Saved to` path into this folder. Passing `filename` does not write the repo path.
- The doctor `url` and the feature id in a `notes.txt` beside those files.

Exercise the on-screen control. Do not prove a screen by curling HTML alone. Capture the action and the state it produced. Confirmed workout logs are stored in `reppie.db`. Reloading the page keeps them. Opening a collapsible shows its body text on that same page, and a reload closes the collapsible.

`Docs` leaves the origin. Proof of that feature is the new tab's URL, not a change to the ReppieApp page.

## Cleanup

```bash
.cursor/skills/verify-reppieapp/scripts/control-reppie cleanup
```

This kills the recorded process tree only, then deletes `.cursor/skills/verify-reppieapp/.run/`. It leaves `artifacts/` in place. If the port is held by a process that is not that tree, cleanup refuses and kills nothing.

Run cleanup after a failed launch too, so a half-started server is not left on the port.

## Helpers

`scripts/control-reppie` is the only helper. Invoke it as:

```bash
.cursor/skills/verify-reppieapp/scripts/control-reppie launch
.cursor/skills/verify-reppieapp/scripts/control-reppie doctor
.cursor/skills/verify-reppieapp/scripts/control-reppie url
.cursor/skills/verify-reppieapp/scripts/control-reppie cleanup
```
