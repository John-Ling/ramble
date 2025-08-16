import { getToken, JWT } from "next-auth/jwt";
import { NextRequest } from "next/server";

interface RouteParameters {
    params: Promise<{ uid: string }>;
}


// Checks on Next's side if the client's access token is valid and updates it if not

export async function POST(req: NextRequest, { params }: RouteParameters) {
    const { uid } = await params;
    const body = await req.json();
    const clientToken: JWT = body["token"];

    // console.log("RECEIVED  TOKEN ", clientToken);

    if (!clientToken) {
        return Response.json({"token": null}, {status: 500});
    }


    if (clientToken.accessTokenExpires) {
        console.log(Date.now()  > clientToken.accessTokenExpires);
    }
    

    if (!clientToken.accessTokenExpires || Date.now() > clientToken.accessTokenExpires) {
        console.log("GETTING ACCESS TOKEN FROM REDIS");
        // get most up to date token from Redis
        const response = await fetch(`http://localhost:8000/api/auth/access-token/${uid}/`,
            { headers: { "Authorization": `Bearer ${process.env.ADMIN_SECRET}`, "accept": "application/json" } }
        )


        if (response.ok) {
            console.log("RETURNING ACCESS TOKEN");
            const accessToken = await response.json();
            return Response.json({"token": accessToken}, {status: 200})
        }

        console.log("RETURNING ORIGINAL TOKEN SINCE RESPONSE NOT OK")

        return new Response(null, {status: 204});    
    }

    console.log("RETURNING ORIGINAL TOKEN");
    return new Response(null, {status: 204});
}