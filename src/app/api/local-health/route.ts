import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const REQUIRED_COMMANDS: Record<string, string[]> = {
  gcc: ["gcc", "--version"],
  gpp: ["g++", "--version"],
  python3: ["python3", "--version"],
  java: ["java", "-version"],
};

const normalizeErrorOutput = (value: unknown) => {
  if (typeof value === "string") return value;
  if (value instanceof Buffer) return value.toString("utf8");
  return "";
};

export async function GET() {
  const missing: string[] = [];
  const checks = Object.entries(REQUIRED_COMMANDS).map(async ([_, [command, arg]]) => {
    try {
      await execAsync(`${command} ${arg}`, { timeout: 2000, encoding: "utf8" });
    } catch (error: any) {
      const stderr = normalizeErrorOutput(error?.stderr);
      if (error?.code === "ENOENT" || error?.code === 127 || stderr.includes("not found")) {
        missing.push(command);
      } else if (error?.killed) {
        missing.push(command);
      }
    }
  });

  await Promise.all(checks);

  const isCloud = Boolean(process.env.VERCEL);

  if (missing.length === 0 && !isCloud) {
    return NextResponse.json({ available: true });
  }

  return NextResponse.json({
    available: false,
    missing,
    cloudEnvironment: isCloud,
  });
}
