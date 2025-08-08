import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      idToken?: string | undefined;
    }
  }

  interface User {
    id: string | undefined;
    idToken?: string | undefined;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string | undefined;
    idToken?: string | undefined;
  }
}