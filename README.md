reedthazen.me

Portfolio/sandbox for me to work with

[![Netlify Status](https://api.netlify.com/api/v1/badges/de38faac-ff43-4250-a70a-4cdd92db7340/deploy-status)](https://app.netlify.com/sites/reedthazen-test/deploys)

This is a starter template for [Learn Next.js](https://nextjs.org/learn).

Will need to build a new project: `yarn build`

then run `yarn dev` (`next dev`) to get a dev server with Fast Refresh enabled

`yarn start` will start a dev server as well, but it will be whatever is in the build in the .next folder after running `yarn build`

## ADU Client Selections checklist

A shared, auto-saving checklist lives at `/projects/adu-collaborator`. It persists to
[Netlify Blobs](https://docs.netlify.com/blobs/overview/) via the `/api/adu` route, so you and
your project manager edit the same document. Anyone with the link can view; saving requires a
shared password.

Set the password in two places:

- **Local dev:** add `ADU_EDIT_PASSWORD=...` to `.env.local` (see `.env.example`).
- **Production:** Netlify → Site settings → Environment variables → add `ADU_EDIT_PASSWORD`.

Without it set, viewing still works but saving returns "Editing is not configured."
