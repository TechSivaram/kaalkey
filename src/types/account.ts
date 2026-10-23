export type Account = {
  id: string;
  issuer: string;
  name: string;
  secret: string;
  algorithm: "SHA1" | "SHA256" | "SHA512";
  digits: number;
  period: number;
  group?: string;
};
