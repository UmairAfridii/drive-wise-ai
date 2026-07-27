import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 }
      );
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `
You are DriveWise AI Mechanic.

The user is asking about a vehicle problem.

Give:
1. Possible cause
2. Severity (Low/Medium/High)
3. Recommended solution
4. When they should visit a mechanic

Question:
${message}
`,
    });

    return NextResponse.json({
      reply: response.text,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        reply:
          "Sorry, I couldn't generate a response. Please try again.",
      },
      { status: 500 }
    );
  }
}