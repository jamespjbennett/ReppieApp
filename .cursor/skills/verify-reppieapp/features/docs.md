# Docs

Docs sends the user to Expo's documentation. On web that is a new browser tab. On iOS and Android the same control opens an in-app browser instead.

## Sub-features

- `docs-tab` follows the web top-bar `Docs` link to `https://docs.expo.dev`.
- `docs-explore` follows `Expo documentation` on the Explore screen to the same site.
- `docs-native` opens that site in an in-app browser. Web does not take this path.

## How to get to it (user POV)

- Choose `Docs` in the web top bar.
- On Explore, choose `Expo documentation`.
- On iOS or Android, choose the same documentation control, which opens inside the app.

## Driving it with the Cursor browser

Preconditions:

- `control-reppie doctor` prints `ok` and a `url`.
- The browser is locked after navigation.
- `docs-native` is out of scope for this harness. Report it as not driven, with the reason that no simulator or device was launched.

- **Tab-bar entry.** Open the doctor URL with path `/`. Run `browser_snapshot` and `browser_click` on the link named `Docs` whose target is `https://docs.expo.dev`. Run `browser_tabs` with `action` `list`. A tab URL is `https://docs.expo.dev` or a path under that host. The ReppieApp tab still shows `Welcome to Expo`.
- **Explore entry.** Return to the doctor URL with path `/explore`. Run `browser_click` on the link named `Expo documentation`. `browser_tabs` `list` again shows a docs.expo.dev tab. The Explore page remains on the ReppieApp origin.
- **Proof.** Save the tab list after the top-bar click as `artifacts/docs/tabs.txt`, a snapshot of the still-open ReppieApp page as `artifacts/docs/reppie.aria.txt`, and the doctor URL plus which entry point was used in `artifacts/docs/notes.txt`. Screenshot the ReppieApp page, not the docs site, so the proof shows this app's chrome.

## Gotchas

- On web the link uses `target="_blank"`. The ReppieApp page does not navigate away. A proof that only checks the original tab URL misses the destination.
- The accessible name may be `Docs ` or `Expo documentation ` because of the icon. Match the prefix.
- On iOS and Android, `ExternalLink` calls `preventDefault` and `openBrowserAsync`. There is no new browser tab. Do not mark `docs-native` passed from a web run.
- Several `Learn more` links on Explore go to other Expo and React Native URLs. They are not the `Docs` or `Expo documentation` entry points.
- Close extra docs tabs when finished so the next feature does not read the wrong tab. Do not close the ReppieApp tab.
