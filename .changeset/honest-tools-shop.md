---
"@hono-storage/node-disk": patch
---

Support more dynamic dest path.
You can decide the dest path by the context and file.

## Before

```ts
const storage = new NodeDiskStorage({
    dest: "/path/to/dest"
})
```

## After

Also support function.

```ts
const storage = new NodeDiskStorage({
    dest: (c, file) => {
        return "/path/to/dest"
    }
})
```
