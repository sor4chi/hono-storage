---
"@hono-storage/core": patch
---

fix: remove `File` (`@web-std/file`) polyfill from `@hono-storage/core` package

This changes means that **stop Node.js v18 support** for `@hono-storage/core` package.

`@web-std/file` is a polyfill for the `File` class, but for web compatibility, it's not necessary to adapt the `File` class to Node.js.
So if you want to Hono Storage to work on older Node.js versions, you can use the `@web-std/file` package manually.
