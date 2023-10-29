---
"@hono-storage/core": patch
---

Breaking Changes: change the way to define multiple middleware option for scalability

```ts
// Before
storage.multiple("field", 3); // max 3 files options

// After
storage.multiple("filed", { maxCount: 3 }); // max 3 files options
```
