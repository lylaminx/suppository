"docs/development.md": "# Development
",

"docs/deployment.md": "# Deployment
",

"docs/api.md": "# API
",
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
