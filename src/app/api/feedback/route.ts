import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { type, message } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    const webhookUrl = process.env.DISCORD_FEEDBACK_WEBHOOK;
    if (!webhookUrl) {
      // Webhook not configured — log and acknowledge gracefully
      console.log(`[Feedback] [${type}] ${message}`);
      return NextResponse.json({ ok: true });
    }

    const label = ["Bug", "Idea", "Other"].includes(type) ? type : "Other";
    const content = `**[${label}]** from Joourney\n> ${message.replace(/\n/g, "\n> ")}`;

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    if (!res.ok) {
      console.error("[Feedback] Discord webhook failed:", res.status);
      return NextResponse.json({ error: "Webhook failed" }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Feedback] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
