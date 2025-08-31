import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

interface RouteParameters {
    params: Promise<{ uid: string, entryName: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParameters) {
    if (!process.env.NEXTAUTH_SECRET) {
        return Response.json({"detail": "Auth secret is not set"}, {status: 500});
    }
    const { uid, entryName } = await params;
    const token = await getToken({ req });

    try {
        const response = await fetch(`http://backend:8000/api/entries/${uid}/${encodeURIComponent(entryName)}/`, {
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
    const { uid, entryName } = await params;
    const token = await getToken({ req });

    if (!token) {
        return Response.json({"detail": "Could not find session"}, {"status": 500})
    }

    const entry: JournalEntryReqBody = await req.json() as JournalEntryReqBody;
    const updateEndpoint = `http://backend:8000/api/entries/${uid}/${encodeURIComponent(entryName)}/`
    // Try updating entry if it exists
    let response = await fetch(updateEndpoint, {
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
    response = await fetch(`http://backend:8000/api/entries/${uid}/create/`, {
        method: "POST",
        headers: {"Authorization": `Bearer ${token.accessToken}`, "accept": "application/json", "Content-Type": "application/json"},
        body: JSON.stringify({
            // id is set on on FastAPI's side
            name: decodeURIComponent(entryName),
            authorID: uid,
            createdOn: entry.createdOn,
            content: entry.content
        })
    })

    if (response.ok) {
        console.log("WROTE DOCUMENT");
        return new Response("Wrote document", {status: 201});
    }
    return new Response("Could not write document", {status: 500});
}