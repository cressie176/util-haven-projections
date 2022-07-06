import Debug from "debug";
import { execSync } from "node:child_process";
import Package from "./Package";

const debug = Debug("haven:projections:npm");

type publishOptionsType = {
  dryRun?: boolean;
};

export function isPublished(pkg: Package): boolean {
  try {
    execute(`npm view ${pkg.fqn}`);
  } catch (error) {
    return false;
  }
  return true;
}

export function publish(pkg: Package, { dryRun }: publishOptionsType) {
  execute(`npm publish ${dryRun ? "--dry-run" : ""}`, { cwd: pkg.baseDir });
}

export function link(pkg: Package) {
  execute(`npm link`, { cwd: pkg.baseDir });
}

function execute(command: string, options: any = {}) {
  debug(`executing ${command} with options %o`, options);
  execSync(command, { encoding: "utf-8", stdio: "pipe", ...options });
}
