import { auth } from "@/lib/auth";

import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

interface RouteParameters {
    params: Promise<{ uid: string, dbDate: string }>;
}

export async function GET(req: NextRequest, res: NextResponse, { params }: RouteParameters) {
    const { uid, dbDate } = await params;
    const token = await getToken({ req });

    if (!token) {
        return Response.json({"detail": "Could find session"})
    }
    
    console.log("TOKEN");
    console.log(token.accessToken);
    try {
        const response = await fetch(`http://localhost:8000/api/entries/${uid}/${dbDate}/`, {
            headers: {"Authorization": `Bearer ${token.accessToken}`, "accept": "application/json"}
        });
        const data = await response.json();
        return Response.json({"response": data});
    } catch (err) {
        return Response.json({"Error": (err as Error).message});
    }
}