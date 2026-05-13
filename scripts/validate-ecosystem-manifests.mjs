#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const DEFAULT_MANIFESTS = ["recipes"];
const SUPPORTED_SCHEMA_VERSION = "2026-05-13";
const VALID_KINDS = new Set(["recipe", "skill", "plugin"]);
const VALID_STATUS = new Set(["experimental", "beta", "stable"]);
const VALID_CATEGORIES = new Set([
  "finance",
  "risk",
  "crypto",
  "analytics",
  "developer-tools",
  "automation",
  "compliance",
]);
const VALID_METHODS = new Set(["cli", "mcp", "python-sdk", "rest-api", "skill", "plugin"]);
const VALID_EXAMPLE_LANGUAGES = new Set(["shell", "python", "typescript", "json", "markdown"]);
const REQUIRED_RECIPE_SCOPES = ["capability.discover", "capability.inspect"];

const args = process.argv.slice(2);
const targets = args.length > 0 ? args : DEFAULT_MANIFESTS;
const manifestPaths = collectManifestPaths(targets);

if (manifestPaths.length === 0) {
  console.error("No qveris.manifest.json files found.");
  process.exit(1);
}

let failures = 0;
for (const manifestPath of manifestPaths) {
  const errors = validateManifest(manifestPath);
  if (errors.length > 0) {
    failures += 1;
    console.error(`\n${relative(manifestPath)}`);
    for (const error of errors) console.error(`  - ${error}`);
  } else {
    console.log(`ok ${relative(manifestPath)}`);
  }
}

if (failures > 0) {
  console.error(`\n${failures} manifest(s) failed validation.`);
  process.exit(1);
}

console.log(`\nValidated ${manifestPaths.length} ecosystem manifest(s).`);

function collectManifestPaths(inputPaths) {
  const paths = [];
  for (const input of inputPaths) {
    const resolved = path.resolve(REPO_ROOT, input);
    if (!fs.existsSync(resolved)) {
      paths.push(resolved);
      continue;
    }
    const stat = fs.statSync(resolved);
    if (stat.isFile()) {
      paths.push(resolved);
      continue;
    }
    walk(resolved, paths);
  }
  return paths.filter((item) => path.basename(item) === "qveris.manifest.json").sort();
}

function walk(dir, paths) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git" || entry.name === ".venv") continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, paths);
    } else if (entry.isFile() && entry.name === "qveris.manifest.json") {
      paths.push(fullPath);
    }
  }
}

function validateManifest(manifestPath) {
  const errors = [];
  if (!fs.existsSync(manifestPath)) return [`File does not exist: ${relative(manifestPath)}`];

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (error) {
    return [`Invalid JSON: ${error.message}`];
  }

  const baseDir = path.dirname(manifestPath);
  requiredString(errors, manifest, "schema_version");
  requiredString(errors, manifest, "id");
  requiredString(errors, manifest, "kind");
  requiredString(errors, manifest, "name", { minLength: 3 });
  requiredString(errors, manifest, "summary", { minLength: 20, maxLength: 160 });
  requiredString(errors, manifest, "description", { minLength: 40 });
  requiredString(errors, manifest, "version");
  requiredString(errors, manifest, "status");

  if (manifest.schema_version !== SUPPORTED_SCHEMA_VERSION) {
    errors.push(`schema_version must be ${SUPPORTED_SCHEMA_VERSION}`);
  }
  if (!/^qveris\.(recipe|skill|plugin)\.[a-z0-9][a-z0-9-]*(\.[a-z0-9][a-z0-9-]*)*$/.test(manifest.id || "")) {
    errors.push("id must match qveris.<kind>.<slug>");
  }
  if (!VALID_KINDS.has(manifest.kind)) errors.push("kind must be recipe, skill, or plugin");
  if (!manifest.id?.startsWith(`qveris.${manifest.kind}.`)) {
    errors.push("id kind prefix must match kind");
  }
  if (!/^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$/.test(manifest.version || "")) {
    errors.push("version must be semver");
  }
  if (!VALID_STATUS.has(manifest.status)) errors.push("status must be experimental, beta, or stable");
  validateOwner(errors, manifest.owner);
  validateStringArray(errors, manifest.tags, "tags", { min: 2, pattern: /^[a-z0-9][a-z0-9-]*$/ });
  validateStringArray(errors, manifest.categories, "categories", { min: 1, allowed: VALID_CATEGORIES });
  validatePermissions(errors, manifest.permissions, manifest.kind);
  validateCompatibility(errors, manifest.compatibility);
  validateMarketplace(errors, manifest.marketplace);
  validateDocs(errors, manifest.docs, baseDir);
  validateExamples(errors, manifest.examples, baseDir);

  return errors;
}

function validateOwner(errors, owner) {
  if (!owner || typeof owner !== "object") {
    errors.push("owner is required");
    return;
  }
  requiredString(errors, owner, "owner.name", { minLength: 2 });
  requiredString(errors, owner, "owner.url");
  if (owner.url && !/^https?:\/\//.test(owner.url)) errors.push("owner.url must be an absolute HTTP URL");
}

function validatePermissions(errors, permissions, kind) {
  if (!permissions || typeof permissions !== "object") {
    errors.push("permissions is required");
    return;
  }
  if (!Array.isArray(permissions.qveris) || permissions.qveris.length === 0) {
    errors.push("permissions.qveris must declare at least one QVeris permission");
    return;
  }
  for (const [index, permission] of permissions.qveris.entries()) {
    validatePermission(errors, permission, `permissions.qveris[${index}]`);
  }
  for (const group of ["local_files", "secrets"]) {
    if (!permissions[group]) continue;
    if (!Array.isArray(permissions[group])) {
      errors.push(`permissions.${group} must be an array`);
      continue;
    }
    permissions[group].forEach((permission, index) => {
      validatePermission(errors, permission, `permissions.${group}[${index}]`);
    });
  }
  if (permissions.network) {
    if (!Array.isArray(permissions.network)) {
      errors.push("permissions.network must be an array");
    } else {
      permissions.network.forEach((permission, index) => {
        if (!permission?.host || typeof permission.host !== "string") {
          errors.push(`permissions.network[${index}].host is required`);
        } else {
          validateStringLength(errors, permission.host, `permissions.network[${index}].host`, { minLength: 3 });
        }
        if (!permission?.reason || typeof permission.reason !== "string") {
          errors.push(`permissions.network[${index}].reason is required`);
        } else {
          validateStringLength(errors, permission.reason, `permissions.network[${index}].reason`, {
            minLength: 12,
          });
        }
        if (typeof permission?.required !== "boolean") {
          errors.push(`permissions.network[${index}].required must be boolean`);
        }
      });
    }
  }
  if (kind === "recipe") {
    const scopes = new Set(permissions.qveris.map((permission) => permission.scope));
    for (const scope of REQUIRED_RECIPE_SCOPES) {
      if (!scopes.has(scope)) errors.push(`recipe manifests must declare ${scope}`);
    }
  }
}

function validatePermission(errors, permission, prefix) {
  if (!permission || typeof permission !== "object") {
    errors.push(`${prefix} must be an object`);
    return;
  }
  if (!permission.scope || typeof permission.scope !== "string") {
    errors.push(`${prefix}.scope is required`);
  } else {
    validateStringLength(errors, permission.scope, `${prefix}.scope`, { minLength: 3 });
  }
  if (!permission.reason || typeof permission.reason !== "string") {
    errors.push(`${prefix}.reason is required`);
  } else {
    validateStringLength(errors, permission.reason, `${prefix}.reason`, { minLength: 12 });
  }
  if (typeof permission.required !== "boolean") errors.push(`${prefix}.required must be boolean`);
}

function validateCompatibility(errors, compatibility) {
  if (!compatibility || typeof compatibility !== "object") {
    errors.push("compatibility is required");
    return;
  }
  if (Object.keys(compatibility).length === 0) errors.push("compatibility must declare at least one integration");
  for (const [key, value] of Object.entries(compatibility)) {
    if (!value || typeof value !== "string") errors.push(`compatibility.${key} must be a non-empty string`);
  }
}

function validateMarketplace(errors, marketplace) {
  if (!marketplace || typeof marketplace !== "object") {
    errors.push("marketplace is required");
    return;
  }
  requiredString(errors, marketplace, "marketplace.listing_slug");
  requiredString(errors, marketplace, "marketplace.headline", { minLength: 12, maxLength: 120 });
  requiredString(errors, marketplace, "marketplace.audience", { minLength: 10 });
  requiredString(errors, marketplace, "marketplace.primary_cta", { minLength: 3 });
  optionalString(errors, marketplace, "marketplace.docs_url");
  if (marketplace.listing_slug && !/^[a-z0-9][a-z0-9-]*$/.test(marketplace.listing_slug)) {
    errors.push("marketplace.listing_slug must be kebab-case");
  }
  validateStringArray(errors, marketplace.use_cases, "marketplace.use_cases", { min: 2, itemMinLength: 8 });
  validateStringArray(errors, marketplace.integration_methods, "marketplace.integration_methods", {
    min: 1,
    allowed: VALID_METHODS,
  });
}

function validateDocs(errors, docs, baseDir) {
  if (!docs || typeof docs !== "object") {
    errors.push("docs is required");
    return;
  }
  requiredString(errors, docs, "docs.readme");
  for (const [key, value] of Object.entries(docs)) {
    if (!value) continue;
    if (typeof value !== "string") {
      errors.push(`docs.${key} must be a string`);
      continue;
    }
    const localPath = stripAnchor(value);
    if (!fs.existsSync(path.resolve(baseDir, localPath))) {
      errors.push(`docs.${key} path does not exist: ${value}`);
    }
  }
}

function validateExamples(errors, examples, baseDir) {
  if (!Array.isArray(examples) || examples.length === 0) {
    errors.push("examples must include at least one runnable or copy-paste complete example");
    return;
  }
  for (const [index, example] of examples.entries()) {
    requiredString(errors, example, `examples[${index}].name`);
    requiredString(errors, example, `examples[${index}].path`);
    requiredString(errors, example, `examples[${index}].language`);
    requiredString(errors, example, `examples[${index}].command`, { minLength: 5 });
    if (example.name) validateStringLength(errors, example.name, `examples[${index}].name`, { minLength: 3 });
    if (example.language && !VALID_EXAMPLE_LANGUAGES.has(example.language)) {
      errors.push(`examples[${index}].language has unsupported value: ${example.language}`);
    }
    if (example.path && !fs.existsSync(path.resolve(baseDir, stripAnchor(example.path)))) {
      errors.push(`examples[${index}].path does not exist: ${example.path}`);
    }
  }
}

function validateStringArray(errors, value, label, options = {}) {
  if (!Array.isArray(value)) {
    errors.push(`${label} must be an array`);
    return;
  }
  if (value.length < (options.min ?? 0)) errors.push(`${label} must contain at least ${options.min} item(s)`);
  const seen = new Set();
  for (const item of value) {
    if (!item || typeof item !== "string") {
      errors.push(`${label} must contain only non-empty strings`);
      continue;
    }
    if (seen.has(item)) errors.push(`${label} contains duplicate value: ${item}`);
    seen.add(item);
    if (options.itemMinLength && item.length < options.itemMinLength) {
      errors.push(`${label} values must be at least ${options.itemMinLength} characters`);
    }
    if (options.pattern && !options.pattern.test(item)) errors.push(`${label} has invalid value: ${item}`);
    if (options.allowed && !options.allowed.has(item)) errors.push(`${label} has unsupported value: ${item}`);
  }
}

function requiredString(errors, object, key, options = {}) {
  const parts = key.split(".");
  const prop = parts.at(-1);
  const value = object?.[prop];
  if (!value || typeof value !== "string") {
    errors.push(`${key} is required`);
    return;
  }
  validateStringLength(errors, value, key, options);
}

function optionalString(errors, object, key, options = {}) {
  const parts = key.split(".");
  const prop = parts.at(-1);
  const value = object?.[prop];
  if (value === undefined) return;
  if (typeof value !== "string") {
    errors.push(`${key} must be a string`);
    return;
  }
  validateStringLength(errors, value, key, options);
}

function validateStringLength(errors, value, key, options = {}) {
  if (options.minLength !== undefined && value.length < options.minLength) {
    errors.push(`${key} must be at least ${options.minLength} characters`);
  }
  if (options.maxLength !== undefined && value.length > options.maxLength) {
    errors.push(`${key} must be ${options.maxLength} characters or less`);
  }
}

function stripAnchor(filePath) {
  return filePath.split("#")[0];
}

function relative(filePath) {
  return path.relative(REPO_ROOT, filePath);
}
