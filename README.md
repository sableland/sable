# Sable

Sable is a web-standards focused Javascript runtime with as much tooling built-in as
possible. It is meant to be both a learning project and a sort of spiritual
sibling to Deno 1.x. Sable is very ambitious and has many goals, but one of the
non-goals is support for node modules in any way (outside of transpilation by
CDNs).

## Goals

- Support as many Web Standard API's as possible
- URL Imports
- Go fast

## Anti-Goals

- Native support of TypeScript/TSX/JSX (maybe will be possible in the future with service workers)
- Node/npm support IN ANY SHAPE OR FORM
- Support for `Deno.*` APIs outside of possible shims

## Why not Deno?

Sable's goal is to follow the spirit of what Deno was originally was meant to
be, a good JS runtime.

In many regards, this isn't true anymore. Deno supports many features that stray
away from it's web-focused nature which could be considered as turning it's back
away from it's original design goals. Some of the recent decisions have been
controversial in the community and are some things we'd like to avoid
implementing e.g.: `npm:`, `node:` specifiers and soon to be `deno:` specifier,
`package.json` support and more.

## Why not Node?

Node was a great first stab at running real JS applications on the server side
but it's age really starts to show. It does have the advantage of being focused
and universal, though both of those are becoming less relevant as time goes on.
CommonJS continues to drag down the ESM ecosystem in a way that is really
unfortunate. It's time to let go of Node.

## Why not Bun?

Please check out [this repo](https://github.com/Im-Beast/bun).
