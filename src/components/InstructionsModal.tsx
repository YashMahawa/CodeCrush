"use client";

import { motion } from "framer-motion";

interface InstructionsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function InstructionsModal({ isOpen, onClose }: InstructionsModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-[#0A0A0A] border border-white/10 w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <svg className="w-5 h-5 text-[#FF5500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        How to Use & I/O Guide
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-6 h-6 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

                    {/* Section 1: Workflow */}
                    <section>
                        <h3 className="text-[#FF5500] font-bold uppercase tracking-wider text-xs mb-3">Workflow</h3>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
                            <li><strong className="text-white">Paste Problem</strong>: Copy the full problem description into the left panel.</li>
                            <li><strong className="text-white">Generate Tests</strong>: Choose <strong>Normal</strong> (30 tests) or <strong>Comprehensive</strong> (100+ tests).</li>
                            <li><strong className="text-white">Write Code</strong>: Use the center editor. Your code is saved automatically per language.</li>
                            <li><strong className="text-white">Run/Evaluate</strong>: Click <span className="text-white bg-white/10 px-1 rounded">Run</span> to test locally, or <span className="text-[#FF5500] bg-[#FF5500]/10 px-1 rounded">Evaluate</span> to run against all generated test cases.</li>
                        </ol>
                    </section>

                    {/* Section 2: I/O Format */}
                    <section>
                        <h3 className="text-[#FF5500] font-bold uppercase tracking-wider text-xs mb-3">Critical: Input/Output Format</h3>
                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl mb-4">
                            <p className="text-red-200 text-sm font-bold flex items-center gap-2">
                                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                IMPORTANT: Write code for a SINGLE test case only!
                            </p>
                            <p className="text-red-200/60 text-xs mt-1 ml-6">
                                Do NOT write a loop to handle `t` test cases (like in Codeforces). The judge handles the looping for you.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                                <h4 className="text-green-400 text-xs font-bold mb-2 flex items-center gap-1">
                                    <span className="w-3 h-3 bg-green-500 rounded-full inline-block"></span>
                                    CORRECT (LeetCode Style)
                                </h4>
                                <code className="text-xs font-mono text-gray-400 whitespace-pre">
                                    {`// Reads ONE input set
int n;
cin >> n;
vector<int> arr(n);
for(int i=0; i<n; i++) cin >> arr[i];

cout << solve(arr) << endl;`}
                                </code>
                            </div>
                            <div className="bg-black/40 p-4 rounded-xl border border-white/5 opacity-50">
                                <h4 className="text-red-400 text-xs font-bold mb-2 flex items-center gap-1">
                                    <span className="w-3 h-3 bg-red-500 rounded-full inline-block"></span>
                                    INCORRECT (Multi-Test Loop)
                                </h4>
                                <code className="text-xs font-mono text-gray-400 whitespace-pre">
                                    {`int t;
cin >> t;
while(t--) {
  // Don't do this!
  // The judge runs your code
  // once per test case.
}`}
                                </code>
                            </div>
                        </div>
                    </section>

                    {/* Section 3: Data Types */}
                    <section>
                        <h3 className="text-[#FF5500] font-bold uppercase tracking-wider text-xs mb-3">Data Structure Formats</h3>
                        <p className="text-sm text-gray-400 mb-4">
                            Input is provided via Standard Input (stdin). Your code must read from stdin and print to stdout.
                        </p>

                        <div className="space-y-4">
                            {/* Arrays */}
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                <div className="flex justify-between mb-2">
                                    <span className="text-white font-bold text-sm">Arrays / Vectors</span>
                                    <span className="text-xs font-mono text-gray-500">Space-separated</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                                    <div>
                                        <div className="text-gray-500 mb-1">Input Stream:</div>
                                        <div className="bg-black p-2 rounded text-green-400">5<br />10 20 30 40 50</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-500 mb-1">C++ Reading:</div>
                                        <div className="text-blue-300">
                                            int n; cin &gt;&gt; n;<br />
                                            for(int i=0; i&lt;n; i++) cin &gt;&gt; arr[i];
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Matrices */}
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                <div className="flex justify-between mb-2">
                                    <span className="text-white font-bold text-sm">Matrices (2D Arrays)</span>
                                    <span className="text-xs font-mono text-gray-500">Newline-separated rows</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                                    <div>
                                        <div className="text-gray-500 mb-1">Input Stream (3x3):</div>
                                        <div className="bg-black p-2 rounded text-green-400">3 3<br />1 2 3<br />4 5 6<br />7 8 9</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-500 mb-1">C++ Reading:</div>
                                        <div className="text-blue-300">
                                            cin &gt;&gt; r &gt;&gt; c;<br />
                                            for(int i=0;i&lt;r;i++)<br />&nbsp;&nbsp;for(int j=0;j&lt;c;j++) cin &gt;&gt; m[i][j];
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 4: Tips */}
                    <section className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                        <h3 className="text-blue-400 font-bold uppercase tracking-wider text-xs mb-2">Pro Tips</h3>
                        <ul className="list-disc list-inside text-sm text-blue-200/80 space-y-1">
                            <li>Use fast I/O in C++ (`cin.tie(NULL);`) for large inputs.</li>
                            <li>Ensure your output format matches the problem exactly (e.g., "YES" vs "Yes").</li>
                            <li>You can use `freopen` locally, but the platform handles redirection automatically.</li>
                        </ul>
                    </section>

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/5 bg-[#050505] flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-white/90 transition-colors"
                    >
                        Got it
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
