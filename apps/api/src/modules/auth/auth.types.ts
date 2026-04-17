export type JwtPayload = {
  sub: string;
  username: string;
  accountType: "user" | "customer";
  roleCode?: string;
};
