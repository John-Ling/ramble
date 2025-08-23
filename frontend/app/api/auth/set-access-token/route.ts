import { NextRequest } from "next/server";
import { JWT } from "next-auth/jwt";

// export async function GET(request: NextRequest) {

// }

export async function POST(req: NextRequest) {
    const body = await req.json();
    const token: JWT = body["token"];
    const sub = body["sub"];

    
    // const accessToken = token.accessToken;

    // if (accessToken === undefined) {
    //     return new Response("Could not set access token access token is null", {status: 500});
    // }

    if (!process.env.ADMIN_SECRET) {
        return new Response("Admin secret can't be found", {status: 500});
    }

    if (!process.env.NEXTAUTH_SECRET) {
        return new Response("Next Auth secret can't be found", {status: 500});
    }

    const response = await fetch("http://backend:8000/api/auth/set-access-token/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.ADMIN_SECRET}`
        },
        body: JSON.stringify({ sub: sub, token: token })
    });    

    if (response.ok) {
        return Response.json({"message": "Created :)"});
    }

    return new Response("Could not set access token", {status: 500});
}