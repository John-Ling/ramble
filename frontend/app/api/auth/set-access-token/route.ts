import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {

}

export async function POST(req: NextRequest) {
    const body = await req.json();
    if (!process.env.ADMIN_SECRET) {
        return new Response("Auth secret can't be found", {status: 500});

    }

    const response = await fetch("http://localhost:8000/api/auth/set-access-token/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.ADMIN_SECRET}`
        },
        body: JSON.stringify(body)
    });

    
    return Response.json({"message": "Created :)"});
}