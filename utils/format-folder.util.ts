export function formatFolder(folder: string) {
  const command = new Deno.Command("deno", { args: ["fmt"], cwd: folder });
  command.spawn();
}
