// import { v4 as uuidv4 } from 'uuid';
import { encode, getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

interface RouteParameters {
    params: Promise<{ uid: string, dbDate: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParameters) {
    if (!process.env.NEXTAUTH_SECRET) {
        return Response.json({"detail": "Auth secret is not set"}, {status: 500});
    }
    const { uid, dbDate } = await params;
    const token = await getToken({ req });

    try {
        const response = await fetch(`http://localhost:8000/api/entries/${uid}/${dbDate}/`, {
            headers: {"Authorization": `Bearer ${token?.accessToken}`, "accept": "application/json"}
        });
    
        if (response.status === 204) {
            return new Response(null, {
                status: 204
            });
        }

        const data = await response.json();
        return Response.json(data, {"status": response.status});
    } catch (err) {
        return Response.json({"Error": (err as Error).message}, {"status": 500});
    }
}

export async function PUT(req: NextRequest, { params }: RouteParameters) {
    const { uid, dbDate } = await params;
    const token = await getToken({ req });

    if (!token) {
        return Response.json({"detail": "Could not find session"}, {"status": 500})
    }

    const entry: JournalEntry = await req.json() as JournalEntry;

    // Try updating entry if it exists
    let response = await fetch(`http://localhost:8000/api/entries/${uid}/${dbDate}/`, {
        method: "PUT",
        headers: {"Authorization": `Bearer ${token.accessToken}`, "accept": "application/json", "Content-Type": "application/json"},
        body: JSON.stringify({"content": entry.content})
    })

    console.log(response.status)

    if (response.ok) {
        console.log("UPDATED DOCUMENT");
        return Response.json({"message": "Updated document"});
    }

    console.log("Sending request")
    // Entry does not exist so try create a new one 
    response = await fetch(`http://localhost:8000/api/entries/${uid}`, {
        method: "POST",
        headers: {"Authorization": `Bearer ${token.accessToken}`, "accept": "application/json", "Content-Type": "application/json"},
        body: JSON.stringify({
            _id: uid + dbDate,
            authorID: uid,
            created: dbDate,
            content: entry.content
        })
    })

    if (response.ok) {
        console.log("WROTE DOCUMENT");
        return new Response("Wrote document", {status: 201});
    }
    return new Response("Could not write document", {status: 500});

}