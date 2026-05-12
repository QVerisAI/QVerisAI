import assert from "node:assert/strict";
import { chmodSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { platform, tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  mcpSpawnOptions,
  shellQuoteForPlatform,
  writeTargetConfig,
} from "../src/commands/mcp.mjs";

test("mcp configure enforces owner-only permissions on existing config files", () => {
  const dir = mkdtempSync(join(tmpdir(), "qveris-cli-mcp-"));
  try {
    const path = join(dir, "mcp.json");
    const fragment = {
      command: "npx",
      args: ["-y", "@qverisai/mcp"],
      env: { QVERIS_API_KEY: "sk-test" },
    };

    writeFileSync(path, "{}\n", { mode: 0o644 });
    if (platform() !== "win32") chmodSync(path, 0o644);

    const written = writeTargetConfig("generic", path, fragment);

    assert.equal(written.path, path);
    assert.deepEqual(JSON.parse(readFileSync(path, "utf8")), fragment);
    if (platform() !== "win32") {
      assert.equal(statSync(path).mode & 0o777, 0o600);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("mcp live probe enables shell execution on Windows only", () => {
  const windowsOptions = mcpSpawnOptions({ QVERIS_API_KEY: "sk-test" }, "win32");
  assert.equal(windowsOptions.shell, true);
  assert.equal(windowsOptions.env.QVERIS_API_KEY, "sk-test");
  assert.deepEqual(windowsOptions.stdio, ["pipe", "pipe", "pipe"]);

  const posixOptions = mcpSpawnOptions({}, "darwin");
  assert.equal(posixOptions.shell, false);
});

test("mcp command quoting follows the target shell platform", () => {
  assert.equal(shellQuoteForPlatform("L'Ondon", "darwin"), `'L'\\''Ondon'`);
  assert.equal(shellQuoteForPlatform('say "hi"', "win32"), `"say ""hi"""`);
});
