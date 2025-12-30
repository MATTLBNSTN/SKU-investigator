'use client';

import { Copy, Check, Terminal } from 'lucide-react';
import { useState } from 'react';

interface IntegrationGuideProps {
    apiSlug: string;
    apiKey: string;
    fields: Record<string, any>;
    inputParams?: string[];
}

export default function IntegrationGuide({ apiSlug, apiKey, fields, inputParams = ['sku'] }: IntegrationGuideProps) {
    const [copied, setCopied] = useState(false);

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';
    const endpoint = `${baseUrl}/api/gravity/run`;

    // Build dynamic payload based on input requirements
    const dynamicPayload: Record<string, string> = {};
    inputParams.forEach(param => {
        dynamicPayload[param] = `EXAMPLE-${param.toUpperCase()}-123`;
    });

    const samplePayload = {
        apiSlug: apiSlug,
        payload: dynamicPayload
    };

    const curlCommand = `curl -X POST ${endpoint} \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${apiKey}" \\
  -d '${JSON.stringify(samplePayload, null, 2)}'`;

    const handleCopy = () => {
        navigator.clipboard.writeText(curlCommand);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-800 text-slate-300">
            <div className="bg-slate-950/50 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                        <Terminal className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-white">Integration Guide</h3>
                        <p className="text-xs text-slate-500">Connect via Postman or your Backend</p>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Credentials */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Endpoint URL</label>
                        <div className="font-mono text-sm bg-slate-950 px-4 py-3 rounded-lg border border-slate-800 text-blue-400 select-all">
                            {endpoint}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">x-api-key</label>
                        <div className="font-mono text-sm bg-slate-950 px-4 py-3 rounded-lg border border-slate-800 text-green-400 select-all">
                            {apiKey || "Key not found - Check Organization Settings"}
                        </div>
                    </div>
                </div>

                {/* cURL Snippet */}
                <div className="space-y-2 relative group">
                    <div className="flex justify-between items-end">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Example Request (cURL)</label>
                        <button
                            onClick={handleCopy}
                            className="text-xs flex items-center gap-1.5 hover:text-white transition-colors text-slate-400"
                        >
                            {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                            {copied ? 'Copied!' : 'Copy Command'}
                        </button>
                    </div>

                    <div className="relative font-mono text-xs bg-slate-950 p-4 rounded-lg border border-slate-800 overflow-x-auto text-slate-300">
                        <pre>{curlCommand}</pre>
                    </div>
                </div>
            </div>
        </div>
    );
}
