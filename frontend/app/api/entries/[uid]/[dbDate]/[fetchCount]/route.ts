import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

interface RouteParameters {
    params: Promise<{ uid: string, dbDate: string, fetchCount: Number }>;
}

export async function GET(req: NextRequest, { params }: RouteParameters) {
    const { uid, dbDate, fetchCount } = await params;
    const token = await getToken({ req });

    if (!token) {
        return Response.json({"detail": "Could not find session"}, {"status": 500})
    }

    const response = await fetch(`http://localhost:8000/api/entries/${uid}/${dbDate}/${fetchCount}/`, {
        headers: {"Authorization": `Bearer ${token.accessToken}`, "accept": "application/json"}
    });
    if (response.ok) {
        const data = await response.json();
        data.entries[0]._id = data.entries[0].created;

        return Response.json(data, {"status": 200});
    }

    return new Response("Could not get entries", {status: 500});
}