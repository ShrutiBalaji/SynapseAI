"use client";
import { useSidebar } from "./SidebarProvider";
import { useApp } from "../context/AppContext";
import Link from "next/link";

export default function SidebarWrapper() {
  const { isOpen } = useSidebar();
  const { problems, conversations, getConversationsForProblem, getConjecturesForProblem, getArtifactsForProblem, getUnlinkedConversations } = useApp();

  // Get all problems with their counts
  const problemsWithCounts = problems.map(problem => ({
    ...problem,
    conversationCount: getConversationsForProblem(problem.id).length,
    conjectureCount: getConjecturesForProblem(problem.id).length,
    criticismCount: getConversationsForProblem(problem.id).length,
    artifactCount: getArtifactsForProblem(problem.id).length
  })).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  // Get unlinked conversations for the sidebar
  const unlinkedConversations = getUnlinkedConversations().sort((a, b) => 
    new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved": return "text-green-400";
      case "in_progress": return "text-yellow-400";
      case "open": return "text-red-400";
      default: return "text-gray-400";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500/20 border-red-500/30";
      case "medium": return "bg-orange-500/20 border-orange-500/30";
      case "low": return "bg-amber-100/20 border-amber-200/30";
      default: return "bg-gray-500/20 border-gray-500/30";
    }
  };

  const getPriorityBorderColor = (priority: string) => {
    switch (priority) {
      case "high": return "border-red-500/40";
      case "medium": return "border-orange-500/40";
      case "low": return "border-amber-200/40";
      default: return "border-gray-500/40";
    }
  };

  return (
    <aside className={`${isOpen ? 'flex' : 'hidden'} flex-col border-r border-white/10 overflow-y-auto w-[320px] h-full transition-all duration-200 bg-[#0f1117]`}>
      {/* Problems Section */}
      <div className="p-3 text-xs uppercase tracking-wide text-[#94a3b8] border-b border-white/10">Problems</div>
      <div className="flex-1 px-2 py-2 space-y-1">
        {problemsWithCounts.length === 0 ? (
          <div className="p-3 text-sm text-[#94a3b8] text-center">
            No problems yet.<br />
            Start a chat to create one!
          </div>
        ) : (
          problemsWithCounts.map((problem) => (
            <Link
              key={`${problem.id}-${problem.priority}-${problem.status}`}
              href={`/problems/${problem.id}`}
              className={`block p-3 text-sm hover:bg-white/5 rounded cursor-pointer border transition-all duration-300 ease-in-out ${
                problem.status === 'resolved' 
                  ? 'opacity-60 hover:opacity-80' 
                  : 'opacity-100'
              } ${
                problem.conversationCount > 0 
                  ? `${getPriorityBorderColor(problem.priority)} hover:${getPriorityBorderColor(problem.priority).replace('/40', '/60')}` 
                  : `${getPriorityBorderColor(problem.priority)} hover:${getPriorityBorderColor(problem.priority).replace('/40', '/60')}`
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="font-medium text-[#e2e8f0] truncate flex-1 mr-2">
                  {problem.title}
                </div>
                <div className={`w-2 h-2 rounded-full ${getPriorityColor(problem.priority)}`} />
              </div>
              
              <div className="text-xs text-[#94a3b8] mb-2">
                <span className={getStatusColor(problem.status)}>
                  {problem.status.replace('_', ' ')}
                </span>
                <span className="mx-1">•</span>
                <span className="capitalize">{problem.priority}</span>
              </div>
              
              
              <div className="text-xs text-[#64748b] mt-1">
                {new Date(problem.updated_at).toLocaleDateString()}
              </div>
            </Link>
          ))
        )}
      </div>
      
      {/* Conversations Section */}
      {unlinkedConversations.length > 0 && (
        <>
          <div className="p-3 text-xs uppercase tracking-wide text-[#94a3b8] border-t border-white/10">Recent Chats</div>
          <div className="px-2 py-2 space-y-1 max-h-48 overflow-y-auto">
            {unlinkedConversations.slice(0, 5).map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => {
                  window.location.href = `/?conversationId=${conversation.id}`;
                }}
                className="block w-full p-2 text-left text-sm hover:bg-white/5 rounded cursor-pointer border border-white/5 hover:border-white/10 transition-all duration-200"
              >
                <div className="font-medium text-[#e2e8f0] truncate">
                  {conversation.title}
                </div>
                <div className="text-xs text-[#64748b] mt-1">
                  {new Date(conversation.updated_at).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
      
      <div className="border-t border-white/10 p-3">
        <Link
          href="/problems"
          className="block text-center text-sm text-[#9ecbff] hover:text-white py-2 rounded border border-white/10 hover:border-white/20 transition-colors"
        >
          View All Problems
        </Link>
      </div>
    </aside>
  );
}
