import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";

interface RouteParameters {
    params: Promise<{ uid: string, dbDate: string, fetchCount: number }>;
}

export async function GET(req: NextRequest, { params }: RouteParameters) {
    const urlParams = Object.fromEntries(new URL(req.url).searchParams);
    const { uid, dbDate, fetchCount } = await params;
    const token = await getToken({ req });

    if (!token) {
        return Response.json({"detail": "Could not find session"}, {"status": 500})
    }

    const filterBy = urlParams["filterBy"];

    const response = await fetch(`http://backend:8000/api/dashboard/emotions/${uid}/${encodeURIComponent(dbDate)}/${fetchCount}?filterBy=${filterBy}`,
        { headers: {"Authorization": `Bearer ${token.accessToken}`, "accept": "application/json"} }
    )

    if (response.ok) {
        const data = await response.json();
        return Response.json(data, {"status": 200});
    }

}