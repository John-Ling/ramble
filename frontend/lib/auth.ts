import type {
    GetServerSidePropsContext,
    NextApiRequest,
    NextApiResponse,
} from "next";
import type { AuthOptions, NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import { JWT } from "next-auth/jwt";
import Google from "next-auth/providers/google";

async function refresh_access_token(token: JWT) {
    if (process.env.GOOGLE_CLIENT_ID === undefined || process.env.GOOGLE_CLIENT_SECRET === undefined
        || process.env.NEXTAUTH_SECRET === undefined
    ){
        console.error("Env file missing");
        return token;
    }  

    if (!token || token.refreshToken === undefined)  return token;

    try {
        const url = "https://oauth2.googleapis.com/token?" +
            new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                grant_type: "refresh_token",
                refresh_token: token.refreshToken,
            });

        let response = null;
        try {
            response = await fetch(url, {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                method: "POST",
            });
        } catch (error) {
            // catch timeout errors
            throw error
        }
        
        if (!response) {
            throw response;
        }

        const refreshedTokens = await response.json();

        if (!response.ok) {
            console.error("Could not get refresh tokens");
            throw refreshedTokens;
        }

        if (token.sub === undefined || refreshedTokens.access_token === undefined) {
            console.debug("Token sub or access token undefined");
            throw refreshedTokens;
        }

        // reset access token on backend
        response = await fetch("http://localhost:3000/api/auth/set-access-token/", {
            method: "POST",
            body: JSON.stringify({
                "sub": token.sub,
                "token": refreshedTokens.access_token
            })
        });

        if (response.ok)
        {
            console.log("Refreshed access token");
        }

        // const newToken = token;
        return {
            ...token,
            refreshed: true,
            accessToken: refreshedTokens.access_token,
            accessTokenExpires: Date.now() + 3600 * 1000,
            refreshToken: refreshedTokens.refresh_token ?? token.refreshToken
        } as JWT;

    } catch (error) {
        console.error(error)
        // return token;
        return {
            ...token,
            error: "Refresh error"
        }
    }
}

export const config: AuthOptions = {
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID !== undefined ? process.env.GOOGLE_CLIENT_ID : "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET !== undefined ? process.env.GOOGLE_CLIENT_SECRET : "",
            authorization: "https://accounts.google.com/oauth/v2/auth?response_type=code&access_type=offline&prompt=consent"
        })
    ],
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: "jwt",
        maxAge: 24 * 60 * 60, // 24 hours
    },
    callbacks: {
        async jwt({ token, user, account, trigger }) {
            console.log("JWT CALLBACK CALLED");

            // if (trigger == "update") {
            //     return token;
            // }
            if (trigger == "signIn" && account) {
                console.log("INITIAL SIGN IN");
                token.idToken = account.id_token;
                
                if (account.access_token === undefined) {
                    console.debug("ACCOUNT ACCESS TOKEN UNDEFINED");
                    return token;
                }

                token.accessToken = account.access_token;
                token.refreshToken = account.refresh_token;    
                token.accessTokenExpires = Date.now() + 3600 * 1000;
      
                await fetch("http://localhost:3000/api/auth/set-access-token/", {
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

                    if (token.tokenRefreshed) {
                        delete token.tokenRefreshed;
                    }
                    return token;
                }
            }

            const refreshed = await refresh_access_token(token);
            return refreshed;
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