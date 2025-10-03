"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

interface ChatMessage {
  id: number;
  conversation_id: number;
  role: "user" | "ai";
  content: string;
  message_type: "new_problem" | "chat" | "conjecture" | "criticism" | "artifact";
  created_at: string;
}

interface ChatConversation {
  id: number;
  problem_id: number | null;
  title: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  messages?: ChatMessage[];
  profiles?: {
    full_name: string;
    email: string;
  };
}

interface Problem {
  id: number;
  title: string;
  description?: string;
  status: "open" | "in_progress" | "resolved";
  priority: "low" | "medium" | "high";
  owner_id?: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
  problem_collaborators?: Array<{
    user_id: string;
    role: string;
    profiles: {
      full_name: string;
      email: string;
    };
  }>;
}

interface Conjecture {
  id: number;
  problem_id: number;
  content: string;
  created_by: string;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

interface Criticism {
  id: number;
  problem_id: number;
  content: string;
  created_by: string;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

interface Artifact {
  id: number;
  problem_id: number;
  name: string;
  url: string;
  mime_type: string;
  created_by: string;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

interface ProblemCounts {
  conversations: number;
  conjectures: number;
  criticisms: number;
  artifacts: number;
}

interface AppContextType {
  problems: Problem[];
  conversations: ChatConversation[];
  conjectures: Conjecture[];
  criticisms: Criticism[];
  artifacts: Artifact[];
  problemCounts: Record<number, ProblemCounts>;
  currentProblemId: number | null;
  currentConversationId: number | null;
  isLoading: boolean;
  setCurrentProblemId: (id: number | null) => void;
  setCurrentConversationId: (id: number | null) => void;
  fetchProblems: () => Promise<void>;
  fetchConversations: (problemId?: number) => Promise<void>;
  fetchConversationMessages: (conversationId: number) => Promise<void>;
  fetchConjectures: (problemId: number) => Promise<void>;
  fetchCriticisms: (problemId: number) => Promise<void>;
  fetchArtifacts: (problemId: number) => Promise<void>;
  fetchAllConjectures: () => Promise<void>;
  fetchAllCriticisms: () => Promise<void>;
  fetchAllArtifacts: () => Promise<void>;
  fetchProblemCounts: () => Promise<void>;
  sendMessage: (message: string, problemId?: number, conversationId?: number, attachedFiles?: File[]) => Promise<void>;
  updateProblem: (id: number, updates: Partial<Problem>) => Promise<void>;
  deleteProblem: (id: number) => Promise<void>;
  deleteConversation: (id: number) => Promise<void>;
  createConjecture: (problemId: number, content: string) => Promise<void>;
  createCriticism: (problemId: number, content: string) => Promise<void>;
  createArtifact: (problemId: number, name: string, url: string, mime_type: string) => Promise<void>;
  deleteArtifact: (artifactId: number) => Promise<void>;
  getConversationsForProblem: (problemId: number) => ChatConversation[];
  getUnlinkedConversations: () => ChatConversation[];
  getCurrentConversation: () => ChatConversation | null;
  getConjecturesForProblem: (problemId: number) => Conjecture[];
  getCriticismsForProblem: (problemId: number) => Criticism[];
  getArtifactsForProblem: (problemId: number) => Artifact[];
  getProblemCounts: (problemId: number) => ProblemCounts;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [conjectures, setConjectures] = useState<Conjecture[]>([]);
  const [criticisms, setCriticisms] = useState<Criticism[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [problemCounts, setProblemCounts] = useState<Record<number, ProblemCounts>>({});
  const [currentProblemId, setCurrentProblemId] = useState<number | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProblems = async () => {
    try {
      const response = await fetch('/api/problems');
      if (response.ok) {
        const data = await response.json();
        setProblems(data.problems || []);
      }
    } catch (error) {
      console.error("Error fetching problems:", error);
    }
  };

  const fetchConversations = useCallback(async (problemId?: number) => {
    try {
      const url = problemId 
        ? `/api/conversations?problem_id=${problemId}`
        : '/api/conversations?unlinked=true';
      console.log("Fetching conversations for problemId:", problemId, "URL:", url);
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        console.log("Conversations fetched:", data.conversations);
        setConversations(data.conversations || []);
      } else {
        console.error("Failed to fetch conversations:", response.status, response.statusText);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  }, []);

  const fetchConversationMessages = useCallback(async (conversationId: number) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        // Update the conversation with its messages
        setConversations(prev => prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, messages: data.messages || [] }
            : conv
        ));
      }
    } catch (error) {
      console.error("Error fetching conversation messages:", error);
    }
  }, []);

  const fetchConjectures = useCallback(async (problemId: number) => {
    try {
      const response = await fetch(`/api/conjectures?problem_id=${problemId}`);
      if (response.ok) {
        const data = await response.json();
        setConjectures(data.conjectures || []);
      }
    } catch (error) {
      console.error("Error fetching conjectures:", error);
    }
  }, []);

  const fetchCriticisms = useCallback(async (problemId: number) => {
    try {
      const response = await fetch(`/api/criticisms?problem_id=${problemId}`);
      if (response.ok) {
        const data = await response.json();
        setCriticisms(data.criticisms || []);
      }
    } catch (error) {
      console.error("Error fetching criticisms:", error);
    }
  }, []);

  const fetchArtifacts = useCallback(async (problemId: number) => {
    try {
      const response = await fetch(`/api/artifacts?problem_id=${problemId}`);
      if (response.ok) {
        const data = await response.json();
        setArtifacts(data.artifacts || []);
      }
    } catch (error) {
      console.error("Error fetching artifacts:", error);
    }
  }, []);

  const fetchAllConjectures = useCallback(async () => {
    try {
      const response = await fetch('/api/conjectures');
      if (response.ok) {
        const data = await response.json();
        setConjectures(data.conjectures || []);
      }
    } catch (error) {
      console.error("Error fetching all conjectures:", error);
    }
  }, []);

  const fetchAllCriticisms = useCallback(async () => {
    try {
      const response = await fetch('/api/criticisms');
      if (response.ok) {
        const data = await response.json();
        setCriticisms(data.criticisms || []);
      }
    } catch (error) {
      console.error("Error fetching all criticisms:", error);
    }
  }, []);

  const fetchAllArtifacts = useCallback(async () => {
    try {
      const response = await fetch('/api/artifacts');
      if (response.ok) {
        const data = await response.json();
        setArtifacts(data.artifacts || []);
      }
    } catch (error) {
      console.error("Error fetching all artifacts:", error);
    }
  }, []);

  const fetchProblemCounts = useCallback(async () => {
    try {
      const response = await fetch('/api/problems/counts');
      if (response.ok) {
        const data = await response.json();
        setProblemCounts(data.counts || {});
      }
    } catch (error) {
      console.error("Error fetching problem counts:", error);
    }
  }, []);

  const sendMessage = async (message: string, problemId?: number, conversationId?: number, attachedFiles?: File[]) => {
    setIsLoading(true);
    try {
      let uploadedFiles = [];
      
      // If there are attached files, upload them first
      if (attachedFiles && attachedFiles.length > 0) {
        console.log("Uploading attached files:", attachedFiles.map(f => f.name));
        for (const file of attachedFiles) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('problem_id', (problemId || 0).toString()); // Use 0 as placeholder if no problemId

          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          });

          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            console.log("File uploaded successfully:", file.name, "URL:", uploadData.url);
            uploadedFiles.push({
              name: file.name,
              url: uploadData.url,
              mime_type: file.type
            });
          } else {
            console.error("Failed to upload file:", file.name, uploadResponse.status);
          }
        }
      }

      // Send message with or without file information
      const requestBody = { 
        message, 
        problemId: problemId || null,
        conversationId: conversationId || null,
        attachedFiles: uploadedFiles.length > 0 ? uploadedFiles : undefined
      };
      console.log("Sending to chat handler:", requestBody);
      
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const response = await fetch('/api/chat-handler', {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Chat handler response data:", data);
        
        setCurrentProblemId(data.problemId);
        setCurrentConversationId(data.conversationId);
        
        // Show notification if chat was linked to existing problem
        if (data.problemLinked && data.linkedProblemTitle) {
          console.log(`Chat linked to existing problem: ${data.linkedProblemTitle}`);
          // Dispatch custom event for notification
          window.dispatchEvent(new CustomEvent('showNotification', {
            detail: {
              message: `Chat linked to existing problem: "${data.linkedProblemTitle}"`,
              type: 'info'
            }
          }));
        }
        
        // Refresh all data
        console.log("Refreshing data...");
        await fetchProblems();
        await fetchProblemCounts();
        if (data.problemId) {
          await fetchConversations(data.problemId);
          await fetchConjectures(data.problemId);
          await fetchCriticisms(data.problemId);
          await fetchArtifacts(data.problemId);
        } else {
          // Refresh unlinked conversations when no problem is created
          await fetchConversations();
        }
        
        // Load messages for the current conversation
        if (data.conversationId) {
          await fetchConversationMessages(data.conversationId);
        }
        
        console.log("Data refresh completed");
      } else {
        const errorData = await response.json();
        console.error("Chat handler error:", errorData);
        throw new Error(errorData.error || 'Failed to send message');
      }
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProblem = async (id: number, updates: Partial<Problem>) => {
    try {
      const response = await fetch(`/api/problems?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        await fetchProblems();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update problem');
      }
    } catch (error) {
      console.error("Error updating problem:", error);
      throw error;
    }
  };

  const deleteProblem = async (id: number) => {
    try {
      const response = await fetch(`/api/problems?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchProblems();
        // Clear current problem if it was deleted
        if (currentProblemId === id) {
          setCurrentProblemId(null);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete problem');
      }
    } catch (error) {
      console.error("Error deleting problem:", error);
      throw error;
    }
  };

  const deleteConversation = async (id: number) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };

      const response = await fetch(`/api/conversations?id=${id}`, {
        method: 'DELETE',
        headers
      });

      if (response.ok) {
        // Refresh conversations for current problem or unlinked conversations
        if (currentProblemId) {
          await fetchConversations(currentProblemId);
        } else {
          await fetchConversations();
        }
        
        // Clear current conversation if it was deleted
        if (currentConversationId === id) {
          setCurrentConversationId(null);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete conversation');
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
      throw error;
    }
  };

  const getConversationsForProblem = (problemId: number) => {
    return conversations.filter(conv => conv.problem_id === problemId);
  };

  const getUnlinkedConversations = () => {
    return conversations.filter(conv => conv.problem_id === null);
  };

  const getCurrentConversation = () => {
    if (!currentConversationId) return null;
    return conversations.find(conv => conv.id === currentConversationId) || null;
  };

  const getConjecturesForProblem = (problemId: number) => {
    return conjectures.filter(conjecture => conjecture.problem_id === problemId);
  };

  const getCriticismsForProblem = (problemId: number) => {
    return criticisms.filter(criticism => criticism.problem_id === problemId);
  };

  const getArtifactsForProblem = (problemId: number) => {
    return artifacts.filter(artifact => artifact.problem_id === problemId);
  };

  const getProblemCounts = (problemId: number) => {
    return problemCounts[problemId] || { conversations: 0, conjectures: 0, criticisms: 0, artifacts: 0 };
  };

  const createConjecture = async (problemId: number, content: string) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };

      const response = await fetch('/api/conjectures', {
        method: 'POST',
        headers,
        body: JSON.stringify({ problem_id: problemId, content }),
      });

      if (response.ok) {
        await fetchConjectures(problemId);
        await fetchProblemCounts();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create conjecture');
      }
    } catch (error) {
      console.error("Error creating conjecture:", error);
      throw error;
    }
  };

  const createCriticism = async (problemId: number, content: string) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };

      const response = await fetch('/api/criticisms', {
        method: 'POST',
        headers,
        body: JSON.stringify({ problem_id: problemId, content }),
      });

      if (response.ok) {
        await fetchCriticisms(problemId);
        await fetchProblemCounts();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create criticism');
      }
    } catch (error) {
      console.error("Error creating criticism:", error);
      throw error;
    }
  };

  const createArtifact = async (problemId: number, name: string, url: string, mime_type: string) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };

      const response = await fetch('/api/artifacts', {
        method: 'POST',
        headers,
        body: JSON.stringify({ problem_id: problemId, name, url, mime_type }),
      });

      if (response.ok) {
        await fetchArtifacts(problemId);
        await fetchProblemCounts();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create artifact');
      }
    } catch (error) {
      console.error("Error creating artifact:", error);
      throw error;
    }
  };

  const deleteArtifact = async (artifactId: number) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };

      const response = await fetch(`/api/artifacts?id=${artifactId}`, {
        method: 'DELETE',
        headers
      });

      if (response.ok) {
        // Refresh artifacts for current problem
        if (currentProblemId) {
          await fetchArtifacts(currentProblemId);
        }
        await fetchProblemCounts();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete artifact');
      }
    } catch (error) {
      console.error("Error deleting artifact:", error);
      throw error;
    }
  };

  // Load initial data
  useEffect(() => {
    fetchProblems();
    fetchProblemCounts();
    // Also load unlinked conversations initially since currentProblemId starts as null
    fetchConversations();
  }, []);

  // Load problem-specific data when current problem changes
  useEffect(() => {
    if (currentProblemId) {
      fetchConversations(currentProblemId);
      fetchConjectures(currentProblemId);
      fetchCriticisms(currentProblemId);
      fetchArtifacts(currentProblemId);
    } else {
      // Load unlinked conversations when no problem is selected
      fetchConversations();
    }
  }, [currentProblemId]);
  
  return (
    <AppContext.Provider value={{ 
      problems,
      conversations,
      conjectures,
      criticisms,
      artifacts,
      problemCounts,
      currentProblemId,
      currentConversationId,
      isLoading,
      setCurrentProblemId,
      setCurrentConversationId,
      fetchProblems,
      fetchConversations,
      fetchConversationMessages,
      fetchConjectures,
      fetchCriticisms,
      fetchArtifacts,
      fetchAllConjectures,
      fetchAllCriticisms,
      fetchAllArtifacts,
      fetchProblemCounts,
      sendMessage,
      updateProblem,
      deleteProblem,
      deleteConversation,
      createConjecture,
      createCriticism,
      createArtifact,
      deleteArtifact,
      getConversationsForProblem,
      getUnlinkedConversations,
      getCurrentConversation,
      getConjecturesForProblem,
      getCriticismsForProblem,
      getArtifactsForProblem,
      getProblemCounts
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}