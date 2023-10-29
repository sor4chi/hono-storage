---
"@hono-storage/core": patch
---

`c.var.files` became type-safe

```ts
app.post("/single", storage.single("image"), (c) => {
  const image = c.var.files.image; // string | File | undefined
});

app.post("/multiple", storage.multiple("images"), (c) => {
  const images = c.var.files.images; // (string | File)[]
});
```
