---
"@hono-storage/core": patch
---

feat: preserve File type property in HonoStorageFile
When a File is processed by the storage middleware, the `type` property from the original File object is now correctly inherited by HonoStorageFile. This ensures the file's content-type is maintained during file uploads.
