declare module "tailwind-merge" {
  import type { ClassValue } from "clsx";
  export function twMerge(...inputs: ClassValue[]): string;
  export type { ClassValue };
}

