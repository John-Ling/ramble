import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {

}

export async function POST(req: NextRequest) {
    const body = await req.json();
    const sub = body["sub"]
    const accessToken = body["token"]

    console.log(body);

    console.log("Sending request");


    // secure this route to prevent malicious users from setting their own access tokens
    // thereby giving themselves authorisation
    const response = await fetch("http://localhost:8000/api/auth/set-access-token/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body)
    });

    
    return Response.json({"message": "Created :)"});
}