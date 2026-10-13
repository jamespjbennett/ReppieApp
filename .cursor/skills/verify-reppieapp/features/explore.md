# Explore

Explore lists starter topics. Each topic is closed until the user presses its title, and only then does that topic's explanation show.

## Sub-features

- `explore-open` shows the Explore intro and the five closed section titles.
- `explore-file-routing` opens File-based routing and shows the two screen paths and the layout path.
- `explore-platforms` opens Android, iOS, and web support.
- `explore-images` opens Images and shows the density-suffix explanation.
- `explore-themes` opens Light and dark mode components.
- `explore-animations` opens Animations and names the collapsible component.

## How to get to it (user POV)

- Choose `Explore` in the web top bar.
- Open `/explore` directly.
- Choose the `Explore` tab in the iOS or Android bottom bar.

## Driving it with the Cursor browser

Preconditions:

- `control-reppie doctor` prints `ok` and a `url`.
- Load `/explore` fresh so every section starts closed.
- The browser is locked after navigation.

- **Open Explore.** Go to the doctor URL with path `/explore`. Run `browser_navigate` with that `url`. `document.body.innerText` contains `Explore` and `This starter app includes example code to help you get started.`
- **Closed titles.** Run `browser_snapshot`. The section controls are unnamed `generic` nodes. Run `Runtime.evaluate` on `[...document.querySelectorAll('[tabindex="0"]')].map((el) => el.innerText)`. In order the labels are `Expo documentation`, `File-based routing`, `Android, iOS, and web support`, `Images`, `Light and dark mode components`, `Animations`, `Home`, `Explore`, `Docs`. `document.body.innerText` does not contain `This app has two screens`.
- **Open file-based routing.** Press that title. Run `browser_click` on the `generic` ref whose `innerText` is `File-based routing` (the first `generic` when the list above is unchanged). `document.body.innerText` then contains `This app has two screens`, `src/app/index.tsx`, `src/app/explore.tsx`, and `src/app/_layout.tsx`, and does not contain `@2x`. The snapshot shows that same `generic` as focused. It still does not list the body sentences.
- **Open platforms.** Press the `generic` whose text is `Android, iOS, and web support`. The body mentions opening the web version with `w` in the terminal. File-based routing stays open.
- **Open images.** Press the `generic` whose text is `Images`. The body mentions `@2x` and `@3x`.
- **Open themes.** Press the `generic` whose text is `Light and dark mode components`. The body mentions `useColorScheme()`.
- **Open animations.** Press the `generic` whose text is `Animations`. The body mentions `src/components/ui/collapsible.tsx` and `react-native-reanimated`.
- **Proof.** After file-based routing is open, run `browser_snapshot` and `browser_take_screenshot` with `fullPage` true. Copy the tool's `Saved to` file to `artifacts/explore/file-based-routing.png`. Save the closed snapshot as `artifacts/explore/closed.aria.txt`, the open snapshot as `artifacts/explore/file-based-routing.aria.txt`, and the doctor URL plus entry point in `artifacts/explore/notes.txt`.

## Gotchas

- Section titles are focusable `div`s, not buttons, and the accessibility snapshot does not name them. Match `innerText`, then click that ref.
- A closed section's body is absent from `document.body.innerText`, not merely hidden. The snapshot omits that body even after it opens. Assert the text and the screenshot.
- Opening a section does not close the others.
- Open state is component memory. A new load of `/explore` closes every section. A reload after the file-based routing proof removed `This app has two screens`. Do not reload and then expect the body to remain.
- The native Explore tab is not this web link. This recipe does not press the bottom tab bar.
- `Expo documentation` on this screen is the Docs feature, not proof that a section opened.
