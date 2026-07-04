# Broken Pines Website

Sleek deployable band website for Broken Pines with:

- custom HTML/CSS/JS front end
- built-in music player with the two released singles
- supplied album cover art
- Spotify call-to-action links
- dependency-free Node static server
- Dockerfile and Railway configuration

## Run Locally

```bash
npm start
```

The site runs on `http://localhost:3000` by default. Railway injects `PORT`, and the server uses it automatically.

## Spotify Link

The Spotify artist URL is centralized in `public/app.js`:

```js
const spotifyUrl = "https://open.spotify.com/artist/0Vp2dk8oPfGzwQmfJeEPKl";
```

## Deploy On Railway

1. Create a new Railway project from this repo.
2. Railway will detect `railway.json` and build with the `Dockerfile`.
3. Deploy.

No build step or package install is required beyond the Node base image.
