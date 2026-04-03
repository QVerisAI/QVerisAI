import { readFileSync } from "node:fs";
import { CliError } from "../errors/handler.mjs";

export function resolveParams(value) {
  if (!value || value === "{}") return {};

  let raw = value;

  if (value === "-") {
    try {
      // Use fd 0 (stdin) which works cross-platform (Linux, macOS, Windows)
      raw = readFileSync(0, "utf-8");
    } catch {
      throw new CliError("PARAMS_INVALID_JSON", "Failed to read from stdin");
    }
  } else if (value.startsWith("@")) {
    const filePath = value.slice(1);
    try {
      raw = readFileSync(filePath, "utf-8");
    } catch (err) {
      throw new CliError("PARAMS_INVALID_JSON", `Cannot read params file: ${filePath}`);
    }
  }

  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new CliError("PARAMS_INVALID_JSON", `${err.message}`);
  }
}
