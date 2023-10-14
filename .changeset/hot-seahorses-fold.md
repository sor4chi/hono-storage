---
"@hono-storage/core": patch
---

file helper for HonoStorage

```ts
import { HonoStorageFile } from '@hono-storage/core'

const file = new File([blob], 'filename.ext.zip')
const HSfile = new HonoStorageFile(file)
HSfile.originalname // => name part of file (filename.ext)
HSfile.extensiton // => extension part of file (.zip)
```
