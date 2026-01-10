import GlassBoxTerminal from "@/components/dashboard/GlassBoxTerminal";

export default function Home() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-emerald-950 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                        GreenGuard AI
                    </h1>
                    <p className="text-xl text-neutral-400">
                        Agentic Trust Layer for Scope 3 Carbon Auditing
                    </p>
                </div>

                {/* Glass Box Terminal */}
                <div className="mb-8">
                    <GlassBoxTerminal />
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                    <div className="p-6 rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-800 border border-neutral-700">
                        <h3 className="text-lg font-semibold text-white mb-2">Real-Time Monitoring</h3>
                        <p className="text-sm text-neutral-400">
                            Track agent activity and reasoning in real-time with complete transparency
                        </p>
                    </div>
                    <div className="p-6 rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-800 border border-neutral-700">
                        <h3 className="text-lg font-semibold text-white mb-2">Automated Auditing</h3>
                        <p className="text-sm text-neutral-400">
                            AI agents verify IoT sensor data and flag anomalies automatically
                        </p>
                    </div>
                    <div className="p-6 rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-800 border border-neutral-700">
                        <h3 className="text-lg font-semibold text-white mb-2">Human Oversight</h3>
                        <p className="text-sm text-neutral-400">
                            Glass box approach enables human review and decision-making
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}

