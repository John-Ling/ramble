import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
    const body = await req.formData;
    console.log("RECEIVED");
    console.log(body);

    return new Response("Done");
}