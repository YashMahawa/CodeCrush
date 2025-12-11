export const LANGUAGE_LABELS: Record<string, string> = {
    c: "C",
    cpp: "C++",
    python: "Python",
    java: "Java",
};

export const DEFAULT_CODE_SNIPPETS: Record<string, string> = {
    c: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main(void) {
    // Read input from stdin (e.g., scanf, fgets)
    // Print output to stdout (e.g., printf)

    return 0;
}
`,
    cpp: `#include <bits/stdc++.h>
using namespace std;

// Common CP optimizations
#pragma GCC optimize("O3,unroll-loops")
#pragma GCC target("avx2,bmi,bmi2,lzcnt,popcnt")

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    // Write your solution here.
    // Read from cin, print to cout.
    // This code runs once per test case.

    return 0;
}
`,
    python: `import sys


def solve():
    """Write your Python solution here"""
    # TODO: implement
    pass


if __name__ == "__main__":
    solve()
`,
    java: `import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws Exception {
        FastScanner fs = new FastScanner(System.in);
        PrintWriter out = new PrintWriter(System.out);

        // Write your Java solution here

        out.flush();
    }

    private static class FastScanner {
        private final InputStream in;
        private final byte[] buffer = new byte[1 << 16];
        private int ptr = 0, len = 0;

        FastScanner(InputStream is) {
            in = is;
        }

        private int read() throws IOException {
            if (ptr >= len) {
                len = in.read(buffer);
                ptr = 0;
                if (len <= 0) return -1;
            }
            return buffer[ptr++];
        }

        int nextInt() throws IOException {
            int c;
            while ((c = read()) <= ' ') {
                if (c == -1) return -1;
            }
            int sign = 1;
            if (c == '-') {
                sign = -1;
                c = read();
            }
            int val = 0;
            while (c > ' ') {
                val = val * 10 + c - '0';
                c = read();
            }
            return val * sign;
        }

        String next() throws IOException {
            StringBuilder sb = new StringBuilder();
            int c;
            while ((c = read()) <= ' ') {
                if (c == -1) return null;
            }
            do {
                sb.append((char) c);
                c = read();
            } while (c > ' ');
            return sb.toString();
        }
    }
}
`,
};

export function cloneDefaultSnippets(): Record<string, string> {
    return { ...DEFAULT_CODE_SNIPPETS };
}

export function getDefaultSnippet(language: string): string {
    return DEFAULT_CODE_SNIPPETS[language] ?? "// Write your code here\n";
}

export function getLanguageLabel(language: string): string {
    return LANGUAGE_LABELS[language] ?? language.toUpperCase();
}
