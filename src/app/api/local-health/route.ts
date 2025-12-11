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
  const installed: Record<string, boolean> = {};

  // Check GCC (C)
  try {
    await execAsync("gcc --version", { timeout: 2000 });
    installed.c = true;
  } catch {
    installed.c = false;
  }

  // Check G++ (C++)
  try {
    await execAsync("g++ --version", { timeout: 2000 });
    installed.cpp = true;
  } catch {
    installed.cpp = false;
  }

  // Check Java
  try {
    await execAsync("java -version", { timeout: 2000 });
    installed.java = true;
  } catch {
    installed.java = false;
  }

  // Check Python (Try python3 first, then py)
  try {
    await execAsync("python3 --version", { timeout: 2000 });
    installed.python = true;
  } catch {
    try {
      await execAsync("py --version", { timeout: 2000 });
      installed.python = true;
    } catch {
      installed.python = false;
    }
  }

  const isCloud = Boolean(process.env.VERCEL);
  const anyInstalled = Object.values(installed).some(Boolean);

  // If running locally, we are "available" if at least one language is installed
  // or if we just want to allow the user to try (permissive)
  const available = !isCloud && anyInstalled;

  return NextResponse.json({
    available,
    languages: installed,
    cloudEnvironment: isCloud,
  });
}
