import { execSync, ExecSyncOptionsWithStringEncoding } from 'node:child_process';

type isPublishedOptionsType = {
  scope?: string,
  pkg: string,
  version?: string
}

type publishOptionsType = {
  cwd: string,
  dryRun?: boolean
}

type linkOptionsType = {
  cwd: string,
}

export function isPublished({ scope, pkg, version } : isPublishedOptionsType) : boolean {
  const artefact = [
    scope ? `@${scope}` : '', 
    pkg, 
    version ? `@${version}` : ''
  ].join('');
  try {
    execute(`npm view ${artefact}`);
  } catch (error) {
    return false;
  }
  return true;
}

export function publish({ cwd, dryRun } : publishOptionsType) {
  const args = [
    dryRun ? '--dry-run' : ''
  ].join(' ');
  execute(`npm publish ${args}`, { cwd });
}

export function link({ cwd } : linkOptionsType) {
    execute(`npm link`, { cwd });
  }

function execute(command: string, options?: any) {
  execSync(command, { encoding: 'utf-8', stdio: 'pipe', ...options });
}