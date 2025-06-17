---
"@hono-storage/node-disk": patch
---

Add fileNames field to access generated filenames if filename option is set

This adds a `fileNames` field for `nodejs-disk` package to return the generated file names if filename option was used when initializing.
The approach is highly similar to `signedURLs` field in `s3` package.
