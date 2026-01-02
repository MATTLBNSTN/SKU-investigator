'use client';

import { useState } from 'react';
import { Play, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface ApiTesterProps {
    apiSlug: string;
    fieldDefinitions: Record<string, any>;
}

export default function ApiTester({ apiSlug, fieldDefinitions }: ApiTesterProps) {
    const [sku, setSku] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleTest = async () => {
        if (!sku) return;

        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const params = new URLSearchParams();
            params.append('apiSlug', apiSlug);
            params.append('sku', sku); // Assuming single input for now based on UI state

            const response = await fetch(`/api/gravity/run?${params.toString()}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to execute API');
            }

            setResult(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="border rounded-2xl border-slate-200 bg-slate-50 overflow-hidden mt-8">
            <div className="px-8 py-6 border-b border-slate-200 flex justify-between items-center bg-white">
                <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Play className="w-4 h-4 text-blue-600" />
                        Test Your API
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Simulate a request to verifying your schema matches real data.</p>
                </div>
            </div>

            <div className="p-8 space-y-6">
                {/* Input Section */}
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Input SKU</label>
                        <input
                            value={sku}
                            onChange={(e) => setSku(e.target.value)}
                            placeholder="e.g. CW2288-111 (Nike Air Force 1)"
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={handleTest}
                            disabled={isLoading || !sku}
                            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Running Gemini...
                                </>
                            ) : (
                                'Run Test'
                            )}
                        </button>
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-lg flex items-start text-red-700 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                            <h4 className="font-semibold text-sm">Execution Failed</h4>
                            <p className="text-sm mt-1 opacity-90">{error}</p>
                        </div>
                    </div>
                )}

                {/* Success Result State */}
                {result && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex items-center gap-2 text-green-700 bg-green-50 px-3 py-2 rounded-lg w-fit text-sm font-medium border border-green-100">
                            <CheckCircle className="w-4 h-4" />
                            Success: Data Extracted
                        </div>

                        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-3 font-semibold">Field Name</th>
                                        <th className="px-6 py-3 font-semibold">Type</th>
                                        <th className="px-6 py-3 font-semibold">Extracted Value</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {Object.entries(result).map(([key, value]) => {
                                        const def = fieldDefinitions[key];
                                        return (
                                            <tr key={key} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-slate-900">{key}</td>
                                                <td className="px-6 py-4 text-slate-500 font-mono text-xs">{def?.type || 'unknown'}</td>
                                                <td className="px-6 py-4 text-slate-600 break-words max-w-sm">
                                                    {Array.isArray(value) ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {value.map((v: any, i: number) => (
                                                                <span key={i} className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 text-xs border border-slate-200">
                                                                    {String(v)}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        String(value)
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Raw JSON Toggle could go here */}
                    </div>
                )}
            </div>
        </div>
    );
}
