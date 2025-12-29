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
                properties: outputProperties
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
        <div className="max-w-4xl mx-auto p-8">
            <Link href="/dashboard" className="flex items-center text-gray-500 hover:text-black mb-6">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
            </Link>

            <div className="bg-white border rounded-xl shadow-sm p-8">
                <h1 className="text-2xl font-bold mb-6">Create New Gravity API</h1>

                <form action={handleSubmit} className="space-y-8">

                    {/* Basic Info */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">API Name</label>
                            <input
                                name="name"
                                required
                                placeholder="e.g. Sneaker Scraper"
                                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-black outline-none transition"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">URL Slug</label>
                            <div className="flex">
                                <span className="inline-flex items-center px-3 border border-r-0 rounded-l-md bg-gray-50 text-gray-500 text-sm">
                                    /
                                </span>
                                <input
                                    name="slug"
                                    required
                                    placeholder="get-sneaker-info"
                                    className="w-full px-3 py-2 border rounded-r-md focus:ring-2 focus:ring-black outline-none transition"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Description</label>
                        <textarea
                            name="description"
                            placeholder="What does this API do?"
                            className="w-full px-3 py-2 border rounded-md h-20 outline-none focus:border-black transition"
                        />
                    </div>

                    <hr />

                    {/* Schema Builder */}
                    <div>
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <h3 className="text-lg font-semibold">Output Parameters</h3>
                                <p className="text-sm text-gray-500">Define what data points Gemini should extract.</p>
                            </div>
                            <button
                                type="button"
                                onClick={addField}
                                className="text-sm flex items-center bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md transition"
                            >
                                <Plus className="w-4 h-4 mr-1" /> Add Field
                            </button>
                        </div>

                        <div className="space-y-3">
                            {fields.map((field) => (
                                <div key={field.id} className="flex gap-3 items-start p-3 bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition">
                                    <div className="flex-1">
                                        <input
                                            value={field.name}
                                            onChange={(e) => updateField(field.id, 'name', e.target.value)}
                                            placeholder="Field Name"
                                            className="w-full bg-white px-2 py-1 border rounded text-sm mb-1"
                                        />
                                        <input
                                            value={field.description}
                                            onChange={(e) => updateField(field.id, 'description', e.target.value)}
                                            placeholder="Description (Context for AI)"
                                            className="w-full bg-transparent text-xs text-gray-600 focus:text-black outline-none"
                                        />
                                    </div>
                                    <div className="w-32">
                                        <select
                                            value={field.type}
                                            onChange={(e) => updateField(field.id, 'type', e.target.value as any)}
                                            className="w-full bg-white px-2 py-1 border rounded text-sm"
                                        >
                                            <option value="string">Text</option>
                                            <option value="number">Number</option>
                                            <option value="boolean">Boolean</option>
                                            <option value="array">List (Array)</option>
                                        </select>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeField(field.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-500 transition"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-100">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition flex items-center disabled:opacity-50"
                        >
                            {isSubmitting ? 'Saving...' : (
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
