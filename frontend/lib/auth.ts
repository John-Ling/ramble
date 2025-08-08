import type {
  GetServerSidePropsContext,
  NextApiRequest,
  NextApiResponse,
} from "next";
import type { AuthOptions, NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import Google from "next-auth/providers/google";

export const config: AuthOptions = {
  providers: [
    Google({
        clientId: process.env.GOOGLE_CLIENT_ID !== undefined ? process.env.GOOGLE_CLIENT_ID : "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET !== undefined ? process.env.GOOGLE_CLIENT_SECRET : "",
    })
    ],
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: "jwt",
        maxAge: 24 * 60 * 60, // 24 hours
    },
    callbacks: {
        async jwt({ token, user, account }) {
            if (account && user) {
              token.id = user.id;
              if (account.access_token === undefined) {
                return token;
              }

              token.accessToken = account.access_token;
              // this may need to be reworked if access tokens are expired
              // perhaps keep in redis the users id and the expiration time
              // if the token is expired we can reset the value of the token
              // effectively disabling write protection
              // this is also another potential vulnerability to keep in mind
              const response = await fetch("http://localhost:3000/api/auth/set-access-token/", {
                method: "POST",
                body: JSON.stringify({
                  "sub": user.id,
                  "token": account.access_token
                }) 
              });
            }
            
            return token;
        },
        async session({ session, token }) {
            session.user.idToken = token.idToken;
            session.user.id = token.sub;
            return session;
        },
    }
} satisfies NextAuthOptions;

export function auth(
  ...args:
    | [GetServerSidePropsContext["req"], GetServerSidePropsContext["res"]]
    | [NextApiRequest, NextApiResponse]
    | []
) {
  return getServerSession(...args, config);
}