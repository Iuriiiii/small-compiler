export function createPackageFolder(path: string) {
  try {
    Deno.removeSync(path, { recursive: true });
    // deno-lint-ignore no-empty
  } catch {}
  Deno.mkdirSync(path);
}
