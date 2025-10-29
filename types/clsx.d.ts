declare module "clsx" {
  export type ClassValue =
    | string
    | number
    | null
    | boolean
    | undefined
    | ClassDictionary
    | ClassArray;

  export type ClassDictionary = Record<
    string,
    string | number | boolean | null | undefined
  >;

  export type ClassArray = Array<ClassValue>;

  export default function clsx(...inputs: ClassValue[]): string;
  export { clsx };
}
