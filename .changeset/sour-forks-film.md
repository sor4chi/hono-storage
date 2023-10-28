---
"@hono-storage/core": patch
---

Breaking change: The argument of `storage.field` function is changed.

## Before

```ts
storage.field([
    { name: "files", maxCount: 3 },
    { name: "image" }
])
```

## After

```ts
storage.field({
    files: { type: "multiple", maxCount: 3 },
    image: { type: "single" }
})
```
