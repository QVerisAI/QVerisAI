# Ecosystem Contribution Guide

Use this guide for adding QVeris recipes, skills, plugins, or marketplace listing metadata.

## Add A Recipe

1. Create a directory under `recipes/<kebab-case-name>/`.
2. Add `README.md` with a copy-paste complete CLI path and a Python SDK path when relevant.
3. Add `qveris.manifest.json` using `ecosystem/manifest.schema.json`.
4. Declare every permission needed by the workflow:
   - `capability.discover` for finding capabilities.
   - `capability.inspect` for reading parameter, billing, and quality metadata.
   - `capability.call` only when the recipe executes a capability.
   - `capability.audit` when the recipe reads usage history or credits ledger data.
5. Add marketplace fields that can be consumed by a future listing service.
6. Run `node scripts/validate-ecosystem-manifests.mjs`.

## Metadata Rules

- Keep `id` stable once published.
- Use semver for `version`.
- Set `status` to `experimental`, `beta`, or `stable`.
- Keep `summary` under 160 characters.
- Prefer product-neutral use-case language in `marketplace.use_cases`.
- Do not declare a permission unless the workflow needs it.

## Compatibility

Update [`compatibility.md`](compatibility.md) when a recipe requires a newer CLI, MCP, Python SDK, skill, or plugin surface.

## Review Checklist

- Manifest validates locally.
- README commands are copy-paste complete.
- Example paths in the manifest exist.
- Permission reasons explain the user-facing need.
- Marketplace fields are suitable for website ingestion without rewriting.
