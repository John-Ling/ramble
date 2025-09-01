import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    const socket = new WebSocket("wss://api.openai.com/v1/realtime?intent=transcription");
}