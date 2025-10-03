"use client";
import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import NewProblemModal from "../components/NewProblemModal";

export default function ProblemsPage() {
	const { problems, updateProblem, getProblemCounts, fetchProblemCounts } = useApp();
	const [isFormOpen, setIsFormOpen] = useState(false);

	// Refresh problem counts when component mounts
	useEffect(() => {
		fetchProblemCounts();
	}, [fetchProblemCounts]);

	// Sort problems: resolved at bottom, others by updated_at (newest first)
	const sortedProblems = [...problems].sort((a, b) => {
		// If one is resolved and the other isn't, resolved goes to bottom
		if (a.status === 'resolved' && b.status !== 'resolved') return 1;
		if (a.status !== 'resolved' && b.status === 'resolved') return -1;
		
		// If both have same status, sort by updated_at (newest first)
		return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
	});

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case "high": return "#FF6B6B"; // Red color
			case "medium": return "#FFB6C1"; // Pink color
			case "low": return "#F5DEB3"; // Beige color
			default: return "transparent";
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "resolved": return "text-green-400";
			case "in_progress": return "text-yellow-400";
			case "open": return "text-beige-400";
			case "urgent": return "text-red-400";
			default: return "text-gray-400";
		}
	};

	return (
		<div className="h-full flex flex-col p-6 bg-[#0f1117] text-white">
			{/* Header */}
			<div className="flex items-center justify-between mb-6 flex-shrink-0">
				<h1 className="text-2xl font-bold text-white">Problems ({problems.length})</h1>
				<div className="flex items-center gap-3">
					<button 
						onClick={() => window.location.href = '/'}
						className="rounded-md bg-[#E0E0E0] text-black px-4 py-2 text-sm font-medium hover:bg-[#D0D0D0] transition-colors"
					>
						New Chat
					</button>
					<button 
						onClick={() => setIsFormOpen(true)}
						className="rounded-md bg-[#282A3A] border border-[#404040] text-white px-4 py-2 text-sm font-medium hover:bg-[#323244] transition-colors"
					>
						New Problem
					</button>
				</div>
			</div>

			{/* Problems List */}
			<div className="flex-1 overflow-y-auto space-y-4">
				{sortedProblems.length === 0 ? (
					<div className="text-center text-[#94a3b8] py-12">
						No problems yet. Start a chat to create your first problem!
					</div>
				) : (
					sortedProblems.map((problem) => {
						const counts = getProblemCounts(problem.id);
						return (
							<div 
								key={problem.id}
								className="bg-[#282A3A] rounded-lg p-4 border border-[#404040] shadow-lg hover:shadow-xl transition-all duration-200"
							>
								{/* Problem Title */}
								<div className="mb-3">
									<a 
										href={`/?problemId=${problem.id}`}
										className="text-lg font-semibold text-white hover:text-[#9ecbff] cursor-pointer transition-colors"
									>
										{problem.title}
									</a>
									{problem.description && (
										<div className="text-sm text-[#94a3b8] mt-1">
											{problem.description}
										</div>
									)}
								</div>

								{/* Metrics Row */}
								<div className="flex items-center gap-6 mb-4">
									{/* Conversations */}
									<div className="flex items-center gap-2">
										<div className="w-4 h-4 bg-[#22d3ee] rounded-full flex items-center justify-center">
											<span className="text-xs text-black">💬</span>
										</div>
										{counts.conversations > 0 ? (
											<button
												onClick={() => {
													window.location.href = `/?problemId=${problem.id}`;
												}}
												className="text-sm text-[#94a3b8] hover:text-[#9ecbff] underline cursor-pointer"
											>
												{counts.conversations} convos
											</button>
										) : (
											<span className="text-sm text-[#94a3b8]">{counts.conversations} convos</span>
										)}
									</div>

									{/* Conjectures */}
									<div className="flex items-center gap-2">
										<div className="w-4 h-4 bg-[#f59e0b] rounded-full flex items-center justify-center">
											<span className="text-xs text-black">💡</span>
										</div>
										{counts.conjectures > 0 ? (
											<button
												onClick={() => {
													window.location.href = `/problems/${problem.id}?tab=conjectures`;
												}}
												className="text-sm text-[#94a3b8] hover:text-[#9ecbff] underline cursor-pointer"
											>
												{counts.conjectures} conjectures
											</button>
										) : (
											<span className="text-sm text-[#94a3b8]">{counts.conjectures} conjectures</span>
										)}
									</div>

									{/* Criticisms */}
									<div className="flex items-center gap-2">
										<div className="w-4 h-4 bg-[#ef4444] rounded-full flex items-center justify-center">
											<span className="text-xs text-black">⚠️</span>
										</div>
										{counts.criticisms > 0 ? (
											<button
												onClick={() => {
													window.location.href = `/problems/${problem.id}?tab=criticisms`;
												}}
												className="text-sm text-[#94a3b8] hover:text-[#9ecbff] underline cursor-pointer"
											>
												{counts.criticisms} criticisms
											</button>
										) : (
											<span className="text-sm text-[#94a3b8]">{counts.criticisms} criticisms</span>
										)}
									</div>

									{/* Artifacts */}
									<div className="flex items-center gap-2">
										<div className="w-4 h-4 bg-[#10b981] rounded-full flex items-center justify-center">
											<span className="text-xs text-black">📎</span>
										</div>
										{counts.artifacts > 0 ? (
											<button
												onClick={() => {
													window.location.href = `/problems/${problem.id}?tab=artifacts`;
												}}
												className="text-sm text-[#94a3b8] hover:text-[#9ecbff] underline cursor-pointer"
											>
												{counts.artifacts} artifacts
											</button>
										) : (
											<span className="text-sm text-[#94a3b8]">{counts.artifacts} artifacts</span>
										)}
									</div>
								</div>

								{/* Status and Priority Section */}
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-4">
										{/* Status Dropdown */}
										<select 
											value={problem.status}
											onChange={(e) => {
												e.stopPropagation();
												updateProblem(problem.id, { status: e.target.value as any });
											}}
											onClick={(e) => e.stopPropagation()}
											className="bg-[#404040] border border-[#555555] rounded px-3 py-1 text-sm text-white cursor-pointer hover:bg-[#4a4a4a] transition-colors"
										>
											<option value="open">Open</option>
											<option value="in_progress">In Progress</option>
											<option value="resolved">Resolved</option>
											<option value="urgent">Urgent</option>
										</select>

										{/* Priority Dropdown */}
										<select 
											value={problem.priority}
											onChange={(e) => {
												e.stopPropagation();
												updateProblem(problem.id, { priority: e.target.value as any });
											}}
											onClick={(e) => e.stopPropagation()}
											className="bg-[#404040] border border-[#555555] rounded px-3 py-1 text-sm text-white cursor-pointer hover:bg-[#4a4a4a] transition-colors"
										>
											<option value="low">Low</option>
											<option value="medium">Medium</option>
											<option value="high">High</option>
										</select>
									</div>

									<div className="flex items-center gap-4 text-sm text-[#94a3b8]">
										{/* Assignment Status */}
										<div className="flex items-center gap-1">
											<span className="text-xs">👤</span>
											<span>Unassigned</span>
										</div>

										{/* Last Updated */}
										<div>
											Updated {new Date(problem.updated_at).toLocaleDateString()}
										</div>
									</div>
								</div>
							</div>
						);
					})
				)}
			</div>

			<NewProblemModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
		</div>
	);
}