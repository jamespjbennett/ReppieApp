# ReppieApp verification map

This directory is the maintained source for verifying ReppieApp's user-facing behavior. Read this index, then use the matching feature file.

## Baseline preconditions

- The primary product surface is the iOS and Android tab app. This map drives the web UI served by Metro.
- Launch with `.cursor/skills/verify-reppieapp/scripts/control-reppie launch`.
- Run `.cursor/skills/verify-reppieapp/scripts/control-reppie doctor` and require `ok`, a `http://localhost:<port>` URL, and `bind=::1`.
- There is no account, database, or seed data. A fresh server is the baseline.
- Never drive a Metro process this verification run did not start. Leave port 8081 alone when a developer server is using it.
- Open state inside collapsible sections resets on a full page load.

## Driving conventions

- Start every recipe from a fresh load of its path unless the recipe says otherwise.
- Prefer the accessible name of a link or the visible title of a collapsible over coordinates.
- Drive the UI with the Cursor browser against the doctor URL. `control-reppie` only launches, checks, and stops the server.
- Lock the browser before clicking and unlock it when the feature is done.
- Keep proof files in `.cursor/skills/verify-reppieapp/artifacts/<feature-id>/`. Cleanup must not delete them.

## Proof and skip reporting

- Capture the user action and the resulting state, not only the final screen.
- UI proof includes an accessibility snapshot before the action, a snapshot after it, and a full-page screenshot that still shows ReppieApp chrome.
- Record the feature id, the doctor URL, and the entry point used in `notes.txt`.
- Report an unreachable path with the attempted step and the unmet precondition.
- Do not report a skipped entry point as verified through a different path.
- Web proof does not cover the native bottom tab bar, the native dev-tools hint, or the native in-app browser.

## Feature entry contract

Each feature file starts with an H1 and one paragraph, then exactly four H2 sections: `Sub-features`, `How to get to it (user POV)`, `Driving it with the Cursor browser`, and `Gotchas`.

## Features

- [Home](./home.md) covers the workout sentence, Parse, Save, the in-memory history, and the web version badge.
- [Explore](./explore.md) covers the Explore tab and opening each starter section.
- [Docs](./docs.md) covers the web tab-bar Docs link and the Explore documentation button.
