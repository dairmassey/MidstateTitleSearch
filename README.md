# Midstate Title Search

A client-side React search for `examinees_all.csv`, built with the real [Astryx](https://astryx.atmeta.com/) component library and its neutral theme. Search data never leaves the browser.

## Run locally

Install dependencies and start Vite:

```sh
npm install
npm run dev
```

For a production check:

```sh
npm run build
npm run preview
```

## Publish with GitHub Pages

1. Push the repository to GitHub with `main` as the default branch.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Push to `main`. The included workflow builds and deploys the `dist` directory automatically.

The app searches names, addresses, counties, invoice numbers, and dates. An exact normalized match on the `name` field is treated as an existing title record; partial matches are shown as supporting results.
