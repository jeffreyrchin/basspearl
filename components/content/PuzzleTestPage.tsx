import React, { useMemo } from 'react';
import { runAllTests, TestResult } from '../../services/puzzleService.test';

const Badge: React.FC<{ pass: boolean }> = ({ pass }) => (
    <span className={`inline-block text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
        pass ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-400'
    }`}>
        {pass ? 'PASS' : 'FAIL'}
    </span>
);

const TestRow: React.FC<{ test: TestResult; index: number }> = ({ test, index }) => (
    <div className={`border-b border-white/5 px-6 py-4 ${!test.passed ? 'bg-red-950/20' : ''}`}>
        <div className="flex items-center gap-3 mb-1">
            <Badge pass={test.passed} />
            <span className="text-[12px] font-bold text-white">
                {index + 1}. {test.name}
            </span>
            <span className="ml-auto font-mono text-[11px] text-indigo-300">
                Score: {test.result.score}%
            </span>
        </div>

        <p className="text-[11px] text-white/50 mb-2 ml-[52px]">{test.description}</p>

        <div className="ml-[52px] text-[10px] space-y-0.5 font-mono">
            <div className="text-white/40">
                Expected: match={String(test.expected.isMatch)}
                {test.expected.scoreAbove !== undefined && `, score ≥ ${test.expected.scoreAbove}`}
                {test.expected.scoreBelow !== undefined && `, score < ${test.expected.scoreBelow}`}
            </div>
            <div className={test.passed ? 'text-emerald-400/60' : 'text-red-400'}>
                Got: match={String(test.result.isMatch)}, score={test.result.score}% — {test.reason}
            </div>
        </div>
    </div>
);

const PuzzleTestPage: React.FC = () => {
    const results = useMemo(() => runAllTests(), []);
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    const allPass = passed === total;

    return (
        <div className="min-h-screen bg-slate-950 text-white font-mono scroll-container">
            {/* Header */}
            <div className="border-b border-white/10 px-6 py-4 flex items-center gap-4">
                <div>
                    <h1 className="text-[11px] font-bold uppercase tracking-[0.3em] text-indigo-400 mb-1">
                        PuzzleService
                    </h1>
                    <h2 className="text-[16px] font-bold text-white">
                        Test Suite
                    </h2>
                </div>
                <div className="ml-auto flex flex-col items-end gap-1">
                    <span className={`text-[24px] font-bold ${allPass ? 'text-emerald-400' : 'text-red-400'}`}>
                        {passed}/{total}
                    </span>
                    <span className="text-[9px] uppercase tracking-widest text-white/40">
                        {allPass ? 'All Passing' : `${total - passed} Failing`}
                    </span>
                </div>
            </div>

            {/* Summary bar */}
            <div className="h-1 w-full bg-white/5">
                <div
                    className={`h-full transition-all ${allPass ? 'bg-emerald-500' : 'bg-red-500'}`}
                    style={{ width: `${(passed / total) * 100}%` }}
                />
            </div>

            {/* Test Results */}
            <div className="divide-y divide-white/5">
                {results.map((r, i) => (
                    <TestRow key={r.name} test={r} index={i} />
                ))}
            </div>
        </div>
    );
};

export default PuzzleTestPage;
