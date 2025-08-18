import { NextRequest } from "next/server";

interface RouteParameters {
    params: Promise<{ uid: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParameters) {
    const { uid, } = await params;
    const body = await req.formData();
    console.log("RECEIVED");
    console.log(body.get("file"));

    const response = await fetch("http://localhost:8000/api/entries/")

    // insert into 

    return new Response("Done");
}