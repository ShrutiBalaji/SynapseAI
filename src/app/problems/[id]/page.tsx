"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useApp } from "../../context/AppContext";

type TabType = "chat" | "conjectures" | "criticisms" | "artifacts";

export default function ProblemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const problemId = parseInt(params.id as string);
  
  const { 
    problems, 
    getConversationsForProblem, 
    getConjecturesForProblem, 
    getCriticismsForProblem,
    getArtifactsForProblem,
    updateProblem,
    fetchProblems,
    sendMessage,
    createConjecture,
    createCriticism,
    createArtifact,
    deleteArtifact,
    deleteConversation,
    deleteProblem,
    setCurrentProblemId,
    fetchConversationMessages,
    fetchArtifacts,
    currentProblemId
  } = useApp();
  
  const [activeTab, setActiveTab] = useState<TabType>("chat");
  const [newConjecture, setNewConjecture] = useState("");
  const [newCriticism, setNewCriticism] = useState("");
  const [newArtifact, setNewArtifact] = useState({ name: "", url: "", mime_type: "" });
  const [newMessage, setNewMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handle tab parameter from URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['chat', 'conjectures', 'criticisms', 'artifacts'].includes(tabParam)) {
      setActiveTab(tabParam as TabType);
    }
  }, [searchParams]);

  const problem = problems.find(p => p.id === problemId);
  const conversations = getConversationsForProblem(problemId);
  const conjectures = getConjecturesForProblem(problemId);
  const criticisms = getCriticismsForProblem(problemId);
  const artifacts = getArtifactsForProblem(problemId);


  useEffect(() => {
    if (!problem && problems.length > 0) {
      router.push("/problems");
    }
  }, [problem, problems, router]);

  // Set current problem ID when component mounts
  useEffect(() => {
    setCurrentProblemId(problemId);
    return () => {
      setCurrentProblemId(null);
    };
  }, [problemId, setCurrentProblemId]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (activeTab === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversations, isSendingMessage, activeTab]);

  // Fetch messages for conversations when they're loaded
  useEffect(() => {
    const fetchMessagesForConversations = async () => {
      for (const conversation of conversations) {
        if (!conversation.messages || conversation.messages.length === 0) {
          await fetchConversationMessages(conversation.id);
        }
      }
    };
    
    if (conversations.length > 0) {
      fetchMessagesForConversations();
    }
  }, [conversations, fetchConversationMessages]);

  if (!problem) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[#9ecbff] border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-[#94a3b8]">Loading problem...</div>
        </div>
      </div>
    );
  }

  const handleCreateConjecture = async () => {
    if (!newConjecture.trim()) return;
    
    try {
      await createConjecture(problemId, newConjecture);
      setNewConjecture("");
    } catch (error) {
      alert("Failed to create conjecture: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const handleCreateCriticism = async () => {
    if (!newCriticism.trim()) return;
    
    try {
      await createCriticism(problemId, newCriticism);
      setNewCriticism("");
    } catch (error) {
      alert("Failed to create criticism: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const handleCreateArtifact = async () => {
    if (!newArtifact.name.trim() || !newArtifact.url.trim()) return;
    
    try {
      await createArtifact(problemId, newArtifact.name, newArtifact.url, newArtifact.mime_type);
      setNewArtifact({ name: "", url: "", mime_type: "" });
    } catch (error) {
      alert("Failed to create artifact: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('problem_id', problemId.toString());

      // Get the current session token
      const { getSupabaseClient } = await import('@/lib/supabase/client');
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      } else {
        // Check for guest user
        const guestUser = localStorage.getItem('synapse_guest_user');
        if (guestUser) {
          const guest = JSON.parse(guestUser);
          headers['x-guest-user-id'] = guest.id;
        }
      }

      const response = await fetch("/api/upload", {
        method: "POST",
        headers,
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        // Refresh artifacts
        await fetchArtifacts(problemId);
        alert("File uploaded successfully!");
      } else {
        const errorData = await response.json();
        console.error("Error uploading file:", errorData);
        alert("Failed to upload file: " + (errorData.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSendingMessage) return;
    
    setIsSendingMessage(true);
    try {
      await sendMessage(newMessage, problemId);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleDeleteConversation = async (conversationId: number) => {
    if (confirm("Are you sure you want to delete this conversation?")) {
      try {
        await deleteConversation(conversationId);
      } catch (error) {
        alert(`Failed to delete conversation: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const handleDeleteProblem = async () => {
    if (problem && confirm(`Are you sure you want to delete "${problem.title}"? This will also delete all associated chats, conjectures, criticisms, and artifacts.`)) {
      try {
        await deleteProblem(problemId);
        router.push("/problems");
      } catch (error) {
        alert(`Failed to delete problem: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    try {
      await updateProblem(problemId, { priority: newPriority as any });
      setUpdateTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Error updating priority:", error);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateProblem(problemId, { status: newStatus as any });
      setUpdateTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const tabs = [
    { id: "chat" as TabType, label: "Chat", count: conversations.length },
    { id: "conjectures" as TabType, label: "Conjectures", count: conjectures.length },
    { id: "criticisms" as TabType, label: "Criticisms", count: criticisms.length },
    { id: "artifacts" as TabType, label: "Artifacts", count: artifacts.length }
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-white/10 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#e2e8f0] mb-2">{problem.title}</h1>
            {problem.description && (
              <p className="text-[#94a3b8] mb-4">{problem.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm">
              <select 
                value={problem.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="bg-transparent border border-white/10 rounded px-3 py-1"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
              <select 
                value={problem.priority}
                onChange={(e) => handlePriorityChange(e.target.value)}
                className="bg-transparent border border-white/10 rounded px-3 py-1"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              <span className="text-[#94a3b8]">
                Created {new Date(problem.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDeleteProblem}
              className="text-red-400 hover:text-red-300 px-3 py-1 rounded border border-red-400/20 hover:border-red-400/40 transition-colors"
            >
              Delete Problem
            </button>
            <button
              onClick={() => router.push("/problems")}
              className="text-[#94a3b8] hover:text-white"
            >
              ← Back to Problems
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/10">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-[#9ecbff] text-[#9ecbff]"
                  : "border-transparent text-[#94a3b8] hover:text-white"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === "chat" && (
          <div className="space-y-6">
            {conversations.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="text-4xl mb-4">💬</div>
                  <div className="text-lg text-[#e2e8f0] mb-2">No conversation yet</div>
                  <div className="text-sm text-[#94a3b8]">Start a conversation about this problem!</div>
                </div>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div key={conversation.id} className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-[#e2e8f0]">{conversation.title}</h3>
                    <button
                      onClick={() => handleDeleteConversation(conversation.id)}
                      className="text-red-400 hover:text-red-300 transition-colors text-sm"
                      title="Delete conversation"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                  <div className="space-y-4">
                    {conversation.messages?.map((message: any) => (
                      <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
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
                    ))}
                  </div>
                </div>
              ))
            )}
            
            {/* Chat Input */}
            <div className="border-t border-white/10 pt-6 mt-8">
              <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                <div className="flex-1">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={1}
                    placeholder="Continue the conversation..."
                    className="w-full resize-none rounded-2xl bg-[#0f1117] border border-white/10 p-4 text-sm outline-none focus:border-[#7dd3fc] focus:ring-1 focus:ring-[#7dd3fc]/20"
                    disabled={isSendingMessage}
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={!newMessage.trim() || isSendingMessage}
                  className="rounded-2xl bg-gradient-to-tr from-[#6366f1] to-[#22d3ee] px-6 py-4 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed hover:from-[#5856eb] hover:to-[#06b6d4] transition-all duration-200"
                >
                  {isSendingMessage ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Sending...</span>
                    </div>
                  ) : (
                    "Send"
                  )}
                </button>
              </form>
            </div>
            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        )}

        {activeTab === "conjectures" && (
          <div className="space-y-4">
            <div className="flex gap-2 mb-6">
              <textarea
                value={newConjecture}
                onChange={(e) => setNewConjecture(e.target.value)}
                placeholder="Add a new conjecture..."
                className="flex-1 rounded-lg bg-[#0f1117] border border-white/10 p-3 text-sm outline-none focus:border-[#7dd3fc]"
                rows={3}
              />
              <button
                onClick={handleCreateConjecture}
                className="rounded-lg bg-gradient-to-tr from-[#6366f1] to-[#22d3ee] px-4 py-2 text-sm font-medium text-white self-start"
              >
                Add
              </button>
            </div>
            {conjectures.length === 0 ? (
              <div className="text-center text-[#94a3b8] py-8">
                No conjectures yet. Add your first hypothesis!
              </div>
            ) : (
              conjectures.map((conjecture) => (
                <div key={conjecture.id} className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-blue-400">💡</span>
                    <span className="text-sm text-[#94a3b8]">
                      {conjecture.profiles?.full_name || "Unknown"} • {new Date(conjecture.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-[#e2e8f0]">{conjecture.content}</div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "criticisms" && (
          <div className="space-y-4">
            <div className="flex gap-2 mb-6">
              <textarea
                value={newCriticism}
                onChange={(e) => setNewCriticism(e.target.value)}
                placeholder="Add a new criticism or evidence..."
                className="flex-1 rounded-lg bg-[#0f1117] border border-white/10 p-3 text-sm outline-none focus:border-[#7dd3fc]"
                rows={3}
              />
              <button
                onClick={handleCreateCriticism}
                className="rounded-lg bg-gradient-to-tr from-[#6366f1] to-[#22d3ee] px-4 py-2 text-sm font-medium text-white self-start"
              >
                Add
              </button>
            </div>
            {criticisms.length === 0 ? (
              <div className="text-center text-[#94a3b8] py-8">
                No criticisms yet. Add evidence or refutations!
              </div>
            ) : (
              criticisms.map((criticism) => (
                <div key={criticism.id} className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-orange-400">⚠️</span>
                    <span className="text-sm text-[#94a3b8]">
                      {criticism.profiles?.full_name || "Unknown"} • {new Date(criticism.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-[#e2e8f0]">{criticism.content}</div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "artifacts" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4 mb-6">
              <h3 className="font-medium mb-3">Add New Artifact</h3>
              <div className="space-y-3">
                {/* File Upload Section */}
                <div className="border-2 border-dashed border-white/20 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileUpload(file);
                      }
                    }}
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <div className="text-2xl">📁</div>
                    <div className="text-sm text-[#94a3b8]">
                      Click to upload a file or drag and drop
                    </div>
                  </label>
                </div>
                
                <div className="text-center text-[#94a3b8] text-sm">OR</div>
                
                {/* Link Section */}
                <input
                  type="text"
                  value={newArtifact.name}
                  onChange={(e) => setNewArtifact(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Artifact name"
                  className="w-full rounded-lg bg-[#0f1117] border border-white/10 p-3 text-sm outline-none focus:border-[#7dd3fc]"
                />
                <input
                  type="url"
                  value={newArtifact.url}
                  onChange={(e) => setNewArtifact(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="URL"
                  className="w-full rounded-lg bg-[#0f1117] border border-white/10 p-3 text-sm outline-none focus:border-[#7dd3fc]"
                />
                <input
                  type="text"
                  value={newArtifact.mime_type}
                  onChange={(e) => setNewArtifact(prev => ({ ...prev, mime_type: e.target.value }))}
                  placeholder="MIME type (optional)"
                  className="w-full rounded-lg bg-[#0f1117] border border-white/10 p-3 text-sm outline-none focus:border-[#7dd3fc]"
                />
                <button
                  onClick={handleCreateArtifact}
                  className="rounded-lg bg-gradient-to-tr from-[#6366f1] to-[#22d3ee] px-4 py-2 text-sm font-medium text-white"
                >
                  Add Link
                </button>
              </div>
            </div>
            {artifacts.length === 0 ? (
              <div className="text-center text-[#94a3b8] py-8">
                No artifacts yet. Add files, links, or documentation!
              </div>
            ) : (
              artifacts.map((artifact) => (
                <div key={artifact.id} className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-[#e2e8f0]">{artifact.name}</div>
                      <div className="text-sm text-[#94a3b8]">
                        {artifact.profiles?.full_name || "Unknown"} • {new Date(artifact.created_at).toLocaleDateString()}
                      </div>
                      {artifact.mime_type && (
                        <div className="text-xs text-[#64748b] mt-1">{artifact.mime_type}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={artifact.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#9ecbff] hover:text-white text-sm"
                      >
                        Open →
                      </a>
                      <button
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this artifact?")) {
                            deleteArtifact(artifact.id);
                          }
                        }}
                        className="text-red-400 hover:text-red-300 text-sm"
                        title="Delete artifact"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
