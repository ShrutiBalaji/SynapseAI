"use client";
import { useApp } from "../context/AppContext";

export default function ProfilePage() {
	const { problems, conversations, conjectures, criticisms, artifacts } = useApp();

	// Calculate stats
	const totalProblems = problems.length;
	const totalConversations = conversations.length;
	const totalConjectures = conjectures.length;
	const totalCriticisms = criticisms.length;
	const totalArtifacts = artifacts.length;

	// Problems by status
	const problemsByStatus = {
		open: problems.filter(p => p.status === 'open').length,
		in_progress: problems.filter(p => p.status === 'in_progress').length,
		resolved: problems.filter(p => p.status === 'resolved').length
	};

	// Problems by priority
	const problemsByPriority = {
		low: problems.filter(p => p.priority === 'low').length,
		medium: problems.filter(p => p.priority === 'medium').length,
		high: problems.filter(p => p.priority === 'high').length
	};

	// Recent activity (last 7 days)
	const sevenDaysAgo = new Date();
	sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
	
	const recentProblems = problems.filter(p => new Date(p.created_at) > sevenDaysAgo).length;
	const recentConversations = conversations.filter(c => new Date(c.created_at) > sevenDaysAgo).length;

	return (
		<div className="h-full flex flex-col p-6">
			<div className="flex items-center justify-between mb-6">
				<div>
					<h1 className="text-2xl font-semibold text-[#e2e8f0] mb-2">Profile</h1>
					<div className="text-[#94a3b8]">
						User
					</div>
				</div>
			</div>

			{/* Stats Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
				{/* Total Problems */}
				<div className="rounded-lg border border-white/10 bg-white/5 p-6">
					<div className="flex items-center justify-between">
						<div>
							<div className="text-2xl font-bold text-[#9ecbff]">{totalProblems}</div>
							<div className="text-sm text-[#94a3b8]">Total Problems</div>
						</div>
						<div className="text-3xl">📋</div>
					</div>
				</div>

				{/* Total Chats */}
				<div className="rounded-lg border border-white/10 bg-white/5 p-6">
					<div className="flex items-center justify-between">
						<div>
							<div className="text-2xl font-bold text-[#22d3ee]">{totalConversations}</div>
							<div className="text-sm text-[#94a3b8]">Chat Messages</div>
						</div>
						<div className="text-3xl">💬</div>
					</div>
				</div>

				{/* Total Conjectures */}
				<div className="rounded-lg border border-white/10 bg-white/5 p-6">
					<div className="flex items-center justify-between">
						<div>
							<div className="text-2xl font-bold text-[#10b981]">{totalConjectures}</div>
							<div className="text-sm text-[#94a3b8]">Conjectures</div>
						</div>
						<div className="text-3xl">💡</div>
					</div>
				</div>

				{/* Total Criticisms */}
				<div className="rounded-lg border border-white/10 bg-white/5 p-6">
					<div className="flex items-center justify-between">
						<div>
							<div className="text-2xl font-bold text-[#f59e0b]">{totalCriticisms}</div>
							<div className="text-sm text-[#94a3b8]">Criticisms</div>
						</div>
						<div className="text-3xl">⚠️</div>
					</div>
				</div>

				{/* Total Artifacts */}
				<div className="rounded-lg border border-white/10 bg-white/5 p-6">
					<div className="flex items-center justify-between">
						<div>
							<div className="text-2xl font-bold text-[#8b5cf6]">{totalArtifacts}</div>
							<div className="text-sm text-[#94a3b8]">Artifacts</div>
						</div>
						<div className="text-3xl">📎</div>
					</div>
				</div>

				{/* Recent Activity */}
				<div className="rounded-lg border border-white/10 bg-white/5 p-6">
					<div className="flex items-center justify-between">
						<div>
							<div className="text-2xl font-bold text-[#ec4899]">{recentProblems + recentConversations}</div>
							<div className="text-sm text-[#94a3b8]">Recent Activity</div>
							<div className="text-xs text-[#64748b] mt-1">Last 7 days</div>
						</div>
						<div className="text-3xl">⚡</div>
					</div>
				</div>
			</div>

			{/* Detailed Breakdown */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Problems by Status */}
				<div className="rounded-lg border border-white/10 bg-white/5 p-6">
					<h3 className="font-medium text-[#e2e8f0] mb-4">Problems by Status</h3>
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<div className="w-3 h-3 rounded-full bg-red-500"></div>
								<span className="text-sm text-[#e2e8f0]">Open</span>
							</div>
							<span className="text-sm font-medium text-[#e2e8f0]">{problemsByStatus.open}</span>
						</div>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<div className="w-3 h-3 rounded-full bg-yellow-500"></div>
								<span className="text-sm text-[#e2e8f0]">In Progress</span>
							</div>
							<span className="text-sm font-medium text-[#e2e8f0]">{problemsByStatus.in_progress}</span>
						</div>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<div className="w-3 h-3 rounded-full bg-green-500"></div>
								<span className="text-sm text-[#e2e8f0]">Resolved</span>
							</div>
							<span className="text-sm font-medium text-[#e2e8f0]">{problemsByStatus.resolved}</span>
						</div>
					</div>
				</div>

				{/* Problems by Priority */}
				<div className="rounded-lg border border-white/10 bg-white/5 p-6">
					<h3 className="font-medium text-[#e2e8f0] mb-4">Problems by Priority</h3>
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<div className="w-3 h-3 rounded-full bg-green-500/60"></div>
								<span className="text-sm text-[#e2e8f0]">Low</span>
							</div>
							<span className="text-sm font-medium text-[#e2e8f0]">{problemsByPriority.low}</span>
						</div>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<div className="w-3 h-3 rounded-full bg-yellow-500/60"></div>
								<span className="text-sm text-[#e2e8f0]">Medium</span>
							</div>
							<span className="text-sm font-medium text-[#e2e8f0]">{problemsByPriority.medium}</span>
						</div>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<div className="w-3 h-3 rounded-full bg-red-500/60"></div>
								<span className="text-sm text-[#e2e8f0]">High</span>
							</div>
							<span className="text-sm font-medium text-[#e2e8f0]">{problemsByPriority.high}</span>
						</div>
					</div>
				</div>
			</div>

			{/* Recent Problems */}
			{problems.length > 0 && (
				<div className="mt-6">
					<div className="rounded-lg border border-white/10 bg-white/5 p-6">
						<h3 className="font-medium text-[#e2e8f0] mb-4">Recent Problems</h3>
						<div className="space-y-3">
							{problems
								.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
								.slice(0, 5)
								.map((problem) => (
									<div key={problem.id} className="flex items-center justify-between p-3 rounded border border-white/5">
										<div>
											<div className="font-medium text-[#e2e8f0]">{problem.title}</div>
											<div className="text-xs text-[#94a3b8]">
												{problem.status} • {problem.priority} • {new Date(problem.updated_at).toLocaleDateString()}
											</div>
										</div>
										<a
											href={`/problems/${problem.id}`}
											className="text-[#9ecbff] hover:text-white text-sm"
										>
											View →
										</a>
									</div>
								))}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}