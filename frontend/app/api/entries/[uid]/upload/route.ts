import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import { v4 as uuidv4 } from 'uuid';

interface RouteParameters {
    params: Promise<{ uid: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParameters) {
    const { uid, } = await params;
    const body = await req.formData();
    const token = await getToken({ req });
    console.log("RECEIVED");

    // const file = Object.fromEntries(body.entries());
    // console.log(file["file"]);
    const file = body.get("file") as File;
    const content = await file.text();
    const response = await fetch(`http://localhost:8000/api/entries/${uid}/upload/`, {
        method: "POST",
        headers: {"Authorization": `Bearer ${token?.accessToken}`, "accept": "application/json", "Content-Type": "application/json"},
        body: JSON.stringify({
            _id: file.name, // this assumes the file name has been formatted correctly change this later
            authorID: uid,
            created: file.name,
            content: content
        })
    });

    if (response.ok) {
        return new Response("Done");
    }
    return new Response("Failed", {status: 500});
    
}