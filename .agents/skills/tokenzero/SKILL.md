---
name: tokenzero
description: Use TokenZero to compress local context before referencing it in this conversation.
---

# TokenZero

TokenZero is a local context optimizer. It compresses files, JSON, and markdown so that you spend fewer tokens when sharing project context.

## Pack the project

```bash
npx tokenzero pack . --out .tokenzero/context.md
```

Then reference the packed file in this conversation:

```txt
Use @.tokenzero/context.md and help me with this project.
```

## Compress a single file

```bash
npx tokenzero compress prompt.md --out prompt.min.md
```

## Tabularize a JSON dataset

```bash
npx tokenzero json data.json
```

## Analyze before packing

```bash
npx tokenzero analyze .
```

TokenZero never calls external LLM APIs. All transformations are local.
