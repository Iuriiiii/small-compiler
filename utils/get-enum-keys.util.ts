// https://www.crojach.com/blog/2019/2/6/getting-enum-keys-in-typescript
export function getEnumKeys(enumerator: object) {
  return Object.keys(enumerator).filter((x) => !(parseInt(x) >= 0));
}
