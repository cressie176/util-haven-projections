import Debug from "debug";
import { exec } from "node:child_process";
import Package from "./Package";

const debug = Debug("haven:projections:npm");

type publishOptionsType = {
  dryRun?: boolean;
};

export async function isPublished(pkg: Package): Promise<boolean> {
  try {
    await execute(`npm view ${pkg.fqn}`);
  } catch (error) {
    return false;
  }
  return true;
}

export async function publish(pkg: Package, { dryRun }: publishOptionsType) {
  return execute(`npm publish ${dryRun ? "--dry-run" : ""}`, { cwd: pkg.baseDir });
}

export async function link(pkg: Package) {
  return execute(`npm link`, { cwd: pkg.baseDir });
}

async function execute(command: string, options: any = {}): Promise<void> {
  debug(`executing ${command} with options %o`, options);
  return new Promise((resolve, reject) => {
    exec(command, { encoding: "utf-8", stdio: "pipe", ...options }, (err) => {
      return err ? reject(err) : resolve();
    });
  });
}
