# Home

Home is the workout log. The user types a sentence, parses it into an editable draft, saves it, and sees that log in a history list on the same screen. A reload keeps the list. The web version badge stays on this screen.

## Sub-features

- `home-welcome` shows the heading `Welcome to Reppie`.
- `home-parse` turns `bench 3x8 80kg` into an exercise named `Bench` with three sets of 8 reps and 80 kg.
- `home-save` appends that draft to the history list after Save.
- `home-badge` shows `v` plus the installed `expo` package version.

## How to get to it (user POV)

- Open the site root.
- Choose `Home` in the web top bar.
- Choose the `Home` tab in the iOS or Android bottom bar.

## Driving it with the Cursor browser

Preconditions:

- `control-reppie doctor` prints `ok` and a `url`.
- The browser is locked after navigation.

- **Open root.** Go to the doctor URL with path `/`. `document.body.innerText` shows `Welcome to Reppie` and `Expo Starter`. It does not show `Welcome to Expo`, `Try editing`, or `npm run reset-project`.
- **Parse a sentence.** The sentence field has the accessible name `Workout sentence`. Fill it with `bench 3x8 80kg`. Click the button named `Parse`. The page then shows an exercise name `Bench`, three `Reps` fields whose values are `8`, and three `Weight kg` fields whose values are `80`.
- **Save the draft.** Click the button named `Save`. `document.body.innerText` then contains the raw sentence `bench 3x8 80kg` and `Bench` in the history below the buttons. The draft fields are gone.
- **Read the version badge.** The badge text is `v` immediately followed by `expo_version` from doctor. The server HTML splits those characters with a comment. The rendered text does not.
- **Top-bar entry.** If you arrived another way, choose `Home`. The same heading is showing. A log saved in this page load is still in the list after a trip to `Explore` and back. A full reload still shows that log.
- **Proof.** Run `browser_take_screenshot` with `fullPage` true after Save. Copy the tool's `Saved to` file to `artifacts/home/saved.png`. Save the snapshot after Save as `artifacts/home/saved.aria.txt` and write the doctor URL into `artifacts/home/notes.txt`. The screenshot shows `Expo Starter`, `Welcome to Reppie`, and `bench 3x8 80kg`.

## Gotchas

- The native Home tab is a different control from the web `Home` link. This recipe does not press the bottom tab bar.
- Save stays disabled until Parse returns at least one exercise, and while a set field holds text that is not a number.
- The history list is in `reppie.db`. A reload of the same dev server keeps saved logs. A new database file starts empty.
- The badge version is the `expo` package version, not the `version` in `app.json`.
- `Welcome to Reppie` is the heading text. Match the text.
