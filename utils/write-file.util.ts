export function writeFile(
  path: string,
  content: string,
  replaces: Record<string, string> = {},
) {
  const realContent = Object.entries(replaces).reduce((acc, [key, value]) => {
    return acc.replaceAll(key, value);
  }, content);
  try {
    Deno.writeTextFileSync(path, realContent, {
      append: false,
      create: true,
      createNew: true,
    });
  } catch (error) {
    console.warn(
      `Error writting file "${path}", content length: ${content.length}`,
    );
    throw error;
  }
}
