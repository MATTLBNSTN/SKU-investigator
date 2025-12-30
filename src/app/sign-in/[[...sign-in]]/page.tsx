import { SignIn } from "@clerk/nextjs";

export default function Page() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
                <h2 className="text-3xl font-extrabold text-slate-900">
                    Welcome to SKU Investigator
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                    Sign in to manage your data extraction APIs
                </p>
            </div>
            <SignIn
                appearance={{
                    elements: {
                        rootBox: "mx-auto",
                        card: "bg-white shadow-xl rounded-xl border border-slate-200",
                        headerTitle: "hidden", // Hide default "Sign In" title to use ours
                        headerSubtitle: "hidden",
                    }
                }}
            />
        </div>
    );
}
