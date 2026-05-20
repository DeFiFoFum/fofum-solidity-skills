import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { DiffDirectoriesOptions, DiffGitOptions } from "./types.js";

const execFileAsync = promisify(execFile);

/**
 * Generate a unified diff between two directories using `diff -ru`.
 * Returns the raw unified diff string (empty string if directories are identical).
 */
export async function diffDirectories(
  oldDir: string,
  newDir: string,
  options: DiffDirectoriesOptions = {},
): Promise<string> {
  const { exclude = [] } = options;

  const args = ["-ru"];
  for (const pattern of exclude) {
    args.push("--exclude", pattern);
  }
  args.push(oldDir, newDir);

  try {
    const { stdout } = await execFileAsync("diff", args, {
      maxBuffer: 50 * 1024 * 1024,
    });
    return stdout;
  } catch (err: unknown) {
    // diff exits with code 1 when files differ: that's normal
    if (isExecError(err) && err.code === 1 && err.stdout) {
      return err.stdout;
    }
    // exit code 2 means trouble (e.g., missing file)
    throw err;
  }
}

/**
 * Generate a unified diff for a git range (e.g., "main..feat/branch", "HEAD~3..HEAD").
 * Returns the raw unified diff string.
 */
export async function diffGitRange(
  range: string,
  options: DiffGitOptions = {},
): Promise<string> {
  const { cwd, paths = [] } = options;

  const args = ["diff", "--no-color", range];
  if (paths.length > 0) {
    args.push("--");
    args.push(...paths);
  }

  const { stdout } = await execFileAsync("git", args, {
    cwd,
    maxBuffer: 50 * 1024 * 1024,
  });

  return stdout;
}

interface ExecError {
  code: number | null;
  stdout: string;
  stderr: string;
}

function isExecError(err: unknown): err is ExecError {
  return (
    typeof err === "object" &&
    err !== null &&
    "stdout" in err &&
    typeof (err as ExecError).stdout === "string"
  );
}
