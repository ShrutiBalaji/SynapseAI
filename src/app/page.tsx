"use client";
import { useState, useRef, useEffect, Suspense } from "react";
import { useApp } from "./context/AppContext";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

function HomeContent() {
	const [message, setMessage] = useState("");
	const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const searchParams = useSearchParams();
	const { 
		currentProblemId, 
		setCurrentProblemId, 
		currentConversationId,
		setCurrentConversationId,
		sendMessage, 
		getConversationsForProblem, 
		getUnlinkedConversations,

		getCurrentConversation,
		problems, 
		isLoading,
		deleteConversation,
		fetchConversationMessages
	} = useApp();

	// Handle problemId from URL parameter
	useEffect(() => {
		const problemIdParam = searchParams.get('problemId');
		if (problemIdParam) {
			const problemId = parseInt(problemIdParam);
			if (!isNaN(problemId)) {
				setCurrentProblemId(problemId);
			}
		}
	}, [searchParams, setCurrentProblemId]);

	// Handle conversationId from URL parameter
	useEffect(() => {
		const conversationIdParam = searchParams.get('conversationId');
		if (conversationIdParam) {
			const conversationId = parseInt(conversationIdParam);
			if (!isNaN(conversationId)) {
				setCurrentConversationId(conversationId);
			}
		}
	}, [searchParams, setCurrentConversationId]);


	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!message.trim() || isLoading) return;

		try {
			await sendMessage(message, currentProblemId || undefined, currentConversationId || undefined, attachedFiles);
		} catch (error) {
			console.error("Error sending message:", error);
			alert("Failed to send message. Please try again.");
		}

		// Reset form
		setMessage("");
		setAttachedFiles([]);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	// Get current conversation and its messages
	const currentConversation = getCurrentConversation();
	const currentMessages = currentConversation?.messages || [];

	// Get available conversations
	const availableConversations = currentProblemId 
		? getConversationsForProblem(currentProblemId) 
		: getUnlinkedConversations();
	
	console.log("Available conversations:", { currentProblemId, availableConversations });

	// Auto-select first conversation when problemId is set and no conversation is selected
	useEffect(() => {
		console.log("Auto-select effect:", { 
			currentProblemId, 
			currentConversationId, 
			availableConversationsLength: availableConversations.length,
			availableConversations: availableConversations.map(c => ({ id: c.id, title: c.title }))
		});
		if (currentProblemId && !currentConversationId && availableConversations.length > 0) {
			console.log("Auto-selecting conversation:", availableConversations[0].id);
			setCurrentConversationId(availableConversations[0].id);
		} else if (currentProblemId && !currentConversationId && availableConversations.length === 0) {
			console.log("No conversations found for problem:", currentProblemId);
		}
	}, [currentProblemId, currentConversationId, availableConversations, setCurrentConversationId]);

	// Load conversation messages when a conversation is selected
	useEffect(() => {
		if (currentConversationId) {
			fetchConversationMessages(currentConversationId);
		}
	}, [currentConversationId, fetchConversationMessages]);

	const handleDeleteConversation = async (conversationId: number) => {
		if (confirm("Are you sure you want to delete this conversation?")) {
			try {
				await deleteConversation(conversationId);
			} catch (error) {
				alert(`Failed to delete conversation: ${error instanceof Error ? error.message : 'Unknown error'}`);
			}
		}
	};

	// Auto-scroll to bottom when new messages are added
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [currentMessages, isLoading]);

	return (
		<div className="h-full flex flex-col">
			{/* Header */}
			<div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold text-[#e2e8f0]">
							Synapse Chat
						</h1>
						{currentProblemId && (
							<p className="text-[#94a3b8] text-sm">
								Problem: {problems.find(p => p.id === currentProblemId)?.title}
							</p>
						)}
					</div>
					
					{/* Conversation Selector */}
					{availableConversations.length > 0 && (
						<div className="flex items-center gap-2">
							<label className="text-sm text-[#94a3b8]">Conversation:</label>
							<select
								value={currentConversationId || ''}
								onChange={(e) => setCurrentConversationId(e.target.value ? parseInt(e.target.value) : null)}
								className="bg-[#1a1a1a] border border-white/10 rounded px-3 py-1 text-[#e2e8f0] text-sm"
							>
								<option value="">New Conversation</option>
								{availableConversations.map(conv => (
									<option key={conv.id} value={conv.id}>
										{conv.title}
									</option>
								))}
							</select>
						</div>
					)}
				</div>

				{/* Messages */}
				<div className="space-y-4">
					{currentMessages.length === 0 ? (
						<div className="flex items-center justify-center h-64">
							<div className="text-center">
								<div className="mb-4">
									<Image 
										src="/logo.svg" 
										alt="Synapse Logo" 
										width={64} 
										height={64}
										className="mx-auto"
									/>
								</div>
								<div className="text-lg text-[#e2e8f0] mb-2">Welcome to Synapse</div>
								<div className="text-sm text-[#94a3b8]">Ask anything, attach artifacts, or reference problems.</div>
							</div>
						</div>
					) : (
						currentMessages.map((message, index) => (
							<div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-6`}>
								<div className={`max-w-3xl ${message.role === 'user' ? 'ml-12' : 'mr-12'}`}>
									{/* Message bubble */}
									<div className={`rounded-2xl px-4 py-3 ${
										message.role === 'user' 
											? 'bg-[#6366f1] text-white' 
											: 'bg-[#1a1a1a] border border-white/10 text-[#e2e8f0]'
									}`}>
										{/* Message content */}
										<div className="prose prose-invert max-w-none">
											<div className="whitespace-pre-wrap text-sm leading-relaxed">
												{message.content}
											</div>
										</div>
									</div>
									
									{/* Message metadata */}
									<div className={`flex items-center gap-2 mt-2 text-xs text-[#94a3b8] ${
										message.role === 'user' ? 'justify-end' : 'justify-start'
									}`}>
										<span>{message.role === 'user' ? 'You' : 'Synapse'}</span>
										<span>•</span>
										<span>{new Date(message.created_at).toLocaleString()}</span>
									</div>
								</div>
							</div>
						))
					)}
					
					{/* Loading indicator */}
					{isLoading && (
						<div className="flex justify-start mb-6">
							<div className="max-w-3xl mr-12">
								<div className="bg-[#1a1a1a] border border-white/10 rounded-2xl px-4 py-3">
									<div className="flex items-center gap-3">
										<div className="animate-spin w-4 h-4 border-2 border-[#9ecbff] border-t-transparent rounded-full"></div>
										<span className="text-[#e2e8f0] text-sm">Synapse is thinking...</span>
									</div>
								</div>
								<div className="flex items-center gap-2 mt-2 text-xs text-[#94a3b8]">
									<span>Synapse</span>
									<span>•</span>
									<span>Just now</span>
								</div>
							</div>
						</div>
					)}
					
					{/* Scroll anchor */}
					<div ref={messagesEndRef} />
				</div>
			</div>

			{/* Input Form */}
			<div className="border-t border-white/10 p-6">
				<form onSubmit={handleSubmit} className="flex flex-col gap-4">
					{/* File attachments */}
					{attachedFiles.length > 0 && (
						<div className="flex flex-wrap gap-2">
							{attachedFiles.map((file, index) => (
								<div key={index} className="flex items-center gap-2 bg-[#1a1a1a] border border-white/10 rounded px-3 py-2">
									<span className="text-sm text-[#e2e8f0]">{file.name}</span>
									<button
										type="button"
										onClick={() => setAttachedFiles(prev => prev.filter((_, i) => i !== index))}
										className="text-red-400 hover:text-red-300"
									>
										×
									</button>
								</div>
							))}
						</div>
					)}

					<div className="flex gap-4">
						{/* Message input */}
						<div className="flex-1 relative">
							<textarea
								value={message}
								onChange={(e) => setMessage(e.target.value)}
								placeholder="Ask anything..."
								className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-3 text-[#e2e8f0] placeholder-[#64748b] resize-none focus:outline-none focus:border-[#6366f1] min-h-[60px] max-h-[200px]"
								rows={2}
								disabled={isLoading}
							/>
						</div>

						{/* File input */}
						<input
							ref={fileInputRef}
							type="file"
							multiple
							onChange={(e) => {
								if (e.target.files) {
									setAttachedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
								}
							}}
							className="hidden"
						/>

						{/* Action buttons */}
						<div className="flex flex-col gap-2">
							<button
								type="button"
								onClick={() => fileInputRef.current?.click()}
								className="p-3 bg-[#1a1a1a] border border-white/10 rounded-lg hover:bg-[#2a2a2a] transition-colors"
								title="Attach files"
							>
								📎
							</button>
							<button
								type="submit"
								disabled={!message.trim() || isLoading}
								className="px-6 py-3 bg-[#6366f1] text-white rounded-lg hover:bg-[#5b5bd6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							>
								{isLoading ? "Sending..." : "Send"}
							</button>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
}

export default function Home() {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<HomeContent />
		</Suspense>
	);
}