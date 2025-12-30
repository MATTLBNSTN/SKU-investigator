'use client';

import { useState } from 'react';
import { createApi } from '../actions';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Helper type for our builder state
type Field = {
    id: string;
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array';
    description: string;
};

export default function NewApiPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fields, setFields] = useState<Field[]>([
        { id: '1', name: 'product_name', type: 'string', description: 'The full name of the product' },
        { id: '2', name: 'price', type: 'number', description: 'Current market price' }
    ]);
    const [error, setError] = useState<string | null>(null);

    const addField = () => {
        setFields([...fields, {
            id: crypto.randomUUID(),
            name: '',
            type: 'string',
            description: ''
        }]);
    };

    const removeField = (id: string) => {
        setFields(fields.filter(f => f.id !== id));
    };

    const updateField = (id: string, key: keyof Field, value: string) => {
        setFields(fields.map(f => f.id === id ? { ...f, [key]: value } : f));
    };

    const handleSubmit = async (formData: FormData) => {
        setIsSubmitting(true);
        setError(null);

        // Construct the Schema Config JSON
        const outputProperties: Record<string, any> = {};
        fields.forEach(f => {
            if (!f.name) return; // Skip empty names

            if (f.type === 'array') {
                outputProperties[f.name] = {
                    type: 'array',
                    items: { type: 'string' }, // Default to array of strings for PoC
                    description: f.description
                };
            } else {
                outputProperties[f.name] = {
                    type: f.type,
                    description: f.description
                };
            }
        });

        const schemaConfig = {
            input_inputs: ["sku"], // Hardcoded requirement
            output_schema: {
                type: "object",
                properties: outputProperties,
                required: Object.keys(outputProperties) // Enforce strict schema
            }
        };

        formData.set('schema_config', JSON.stringify(schemaConfig));

        try {
            await createApi(formData);
        } catch (err: any) {
            setError(err.message);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-8 font-sans">
            <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-8 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
            </Link>

            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                <div className="border-b border-slate-100 bg-slate-50/50 p-8">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Create New Gravity API</h1>
                    <p className="text-slate-500 mt-2">Configure how Gemini extracts data from the web for your organization.</p>
                </div>

                <form action={handleSubmit} className="p-8 space-y-10">

                    {/* Basic Info Section */}
                    <div className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-900 uppercase tracking-wider text-xs">API Name</label>
                                <input
                                    name="name"
                                    required
                                    placeholder="e.g. Sneaker Scraper"
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition shadow-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-900 uppercase tracking-wider text-xs">URL Slug</label>
                                <div className="flex shadow-sm rounded-lg overflow-hidden">
                                    <span className="inline-flex items-center px-4 bg-slate-50 border border-r-0 border-slate-200 text-slate-500 font-mono text-sm">
                                        /
                                    </span>
                                    <input
                                        name="slug"
                                        required
                                        placeholder="get-sneaker-info"
                                        className="w-full px-4 py-3 bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition font-mono text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-900 uppercase tracking-wider text-xs">Description</label>
                            <textarea
                                name="description"
                                placeholder="Describe specifically what this API matches (e.g. 'Matches Nike SKUs to finding colorways'). This helps the AI understand context."
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition h-24 shadow-sm resize-none"
                            />
                        </div>
                    </div>

                    <div className="h-px bg-slate-100" />

                    {/* Schema Builder Section */}
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Output Parameters</h3>
                                <p className="text-sm text-slate-500 mt-1">Define the exact data structure you want to receive.</p>
                            </div>
                            <button
                                type="button"
                                onClick={addField}
                                className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-100 transition-colors"
                            >
                                <Plus className="w-4 h-4 mr-2" /> Add Field
                            </button>
                        </div>

                        <div className="space-y-4">
                            {fields.map((field) => (
                                <div key={field.id} className="group relative grid grid-cols-12 gap-4 p-5 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all items-start">

                                    {/* Field Name */}
                                    <div className="col-span-12 md:col-span-4 space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 uppercase">Field Name</label>
                                        <input
                                            value={field.name}
                                            onChange={(e) => updateField(field.id, 'name', e.target.value)}
                                            placeholder="e.g. product_image"
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-900 font-mono text-sm focus:bg-white focus:outline-none focus:border-blue-500 transition"
                                        />
                                    </div>

                                    {/* Description */}
                                    <div className="col-span-12 md:col-span-5 space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 uppercase">Description (AI Context)</label>
                                        <input
                                            value={field.description}
                                            onChange={(e) => updateField(field.id, 'description', e.target.value)}
                                            placeholder="Explains what this field is..."
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-blue-500 transition"
                                        />
                                    </div>

                                    {/* Type Selector */}
                                    <div className="col-span-10 md:col-span-2 space-y-1">
                                        <label className="text-xs font-semibold text-slate-500 uppercase">Type</label>
                                        <select
                                            value={field.type}
                                            onChange={(e) => updateField(field.id, 'type', e.target.value as any)}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-900 text-sm focus:bg-white focus:outline-none focus:border-blue-500 transition cursor-pointer"
                                        >
                                            <option value="string">Text</option>
                                            <option value="number">Number</option>
                                            <option value="boolean">Boolean</option>
                                            <option value="array">List (Array)</option>
                                        </select>
                                    </div>

                                    {/* Delete Action */}
                                    <div className="col-span-2 md:col-span-1 flex justify-end pt-6">
                                        <button
                                            type="button"
                                            onClick={() => removeField(field.id)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Remove Field"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-lg flex items-start text-red-700">
                            <div className="mr-3 mt-0.5">⚠️</div>
                            <div className="text-sm font-medium">{error}</div>
                        </div>
                    )}

                    <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-4">
                        <Link
                            href="/dashboard"
                            className="px-6 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center px-6 py-2.5 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-slate-900/20"
                        >
                            {isSubmitting ? 'Saving Configuration...' : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Create API
                                </>
                            )}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
