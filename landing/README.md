# Kleeto, the site

The Kleeto page is the root route. `/solari`, `/runloop`, `/browsers`, `/desktops` and
`/sandboxes` are the reference clones its structure was built from and are kept for
comparison.

```sh
npm install
npm run dev      # :3000
npm run check    # lint, typecheck, build
```

Everything specific to Kleeto lives in `src/components/kleeto` and `src/shaders`. The
imagery under `public/images/kleeto` and `public/video` is captured from real leases; see
the repository root for the scripts that produced it.
