export const fsec: {
  getAccessToken: () => Promise<string>;
  getIdToken: () => Promise<string>;
} = {
  getAccessToken: () => Promise.resolve(''),
  getIdToken: () => Promise.resolve(''),
};

type Keys = keyof typeof fsec;
type Values = typeof fsec[Keys];
export function setSec(key: Keys, value: Values) {
  fsec[key] = value;
}
