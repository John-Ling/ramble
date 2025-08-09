import type {
    GetServerSidePropsContext,
    NextApiRequest,
    NextApiResponse,
} from "next";
import type { AuthOptions, NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import { JWT } from "next-auth/jwt";
import Google from "next-auth/providers/google";


const GOOGLE_AUTHORIZATION_URL =
    "https://accounts.google.com/o/oauth2/v2/auth?" +
    new URLSearchParams({
        prompt: "consent",
        access_type: "offline",
        response_type: "code",
    })

async function refresh_access_token(token: JWT) {
    if (process.env.GOOGLE_CLIENT_ID === undefined || process.env.GOOGLE_CLIENT_SECRET === undefined)  return;
    if (token.refreshToken === undefined || !token)  return;

    try {
        const url = "https://oauth2.googleapis.com/token?" +
            new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                grant_type: "refresh_token",
                refresh_token: token.refreshToken,
            });

        let response = await fetch(url, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            method: "POST",
        });

        const refreshedTokens = await response.json();

        console.log("REFRESH TOKEN");
        console.log(refreshedTokens);

        if (!response.ok) {
            throw refreshedTokens;
        }

        token.id = refreshedTokens.id;
        token.accessToken = refreshedTokens.access_token;
        token.accessTokenExpires = Date.now() + refreshedTokens.expires_in * 1000;
        token.refreshToken = refreshedTokens.refresh_token ?? token.refreshToken;

        if (token.id === undefined || token.accessToken === undefined) {
            throw refreshedTokens;
        }

        // reset access token on backend
        response = await fetch("http://localhost:3000/api/auth/set-access-token/", {
            method: "POST",
            body: JSON.stringify({
                "sub": token.id,
                "token": token.accessToken
            })
        });


        return token;
    } catch (error) {
        console.log(error)
        // return token;
        return {
            ...token,
            error: "RefreshAccessTokenError",
        }
    }
}

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
            token.idToken = account?.id_token;

            if (account && user) {
                console.log("INITIAL SIGN IN");
                token.id = user.id;
                if (account.access_token === undefined) {
                    return token;
                }

                token.accessToken = account.access_token;
                token.refreshToken = account.refresh_token;
                if (account.expires_at) {
                    console.log("Setting expiry")
                    token.accessTokenExpires = Date.now() + 24 * 60 * 1000;
                }
        
                // this endpoint is unprotected meaning anyone can set their own access tokens
                // secure this using a secret only I know and sending it with an auth header
                const response = await fetch("http://localhost:3000/api/auth/set-access-token/", {
                    method: "POST",
                    body: JSON.stringify({
                        "sub": user.id,
                        "token": account.access_token
                    })
                });

                return token;
            }

            if (token.accessTokenExpires) {
                if (Date.now() < token.accessTokenExpires) {
                    console.log("Token has not expired");
                    return token;
                }
            }


            console.log("Refreshing token");
            let ret =  await refresh_access_token(token);
            if (ret !== undefined) {
                return ret;
            } else {
                return token;
            }
        },

        async session({ session, token }) {

            if (token.idToken) {
                session.user.idToken = token.idToken;    
            }
            
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