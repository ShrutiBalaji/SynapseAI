"use client";
import { useState } from "react";
import { useApp } from "../context/AppContext";

interface NewProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewProblemModal({ isOpen, onClose }: NewProblemModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "open" as const,
    priority: "medium" as const,
  });
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { fetchProblems } = useApp();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };

      const response = await fetch('/api/problems', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          status: formData.status,
          priority: formData.priority
        })
      });

      if (response.ok) {
        const { problem } = await response.json();
        
        // Upload files if any are attached
        if (attachedFiles.length > 0) {
          for (const file of attachedFiles) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('problemId', problem.id.toString());

            // Create headers for file upload (without Content-Type)
            const uploadHeaders: Record<string, string> = {};

            const uploadResponse = await fetch('/api/upload', {
              method: 'POST',
              headers: uploadHeaders,
              body: formData
            });

            if (!uploadResponse.ok) {
              console.error(`Failed to upload file: ${file.name}`);
            }
          }
        }

        await fetchProblems();
        onClose();
        setFormData({
          title: "",
          description: "",
          status: "open",
          priority: "medium",
        });
        setAttachedFiles([]);
      } else {
        const errorData = await response.json();
        console.error("Error creating problem:", errorData);
        alert(`Error: ${errorData.error || 'Failed to create problem'}`);
      }
    } catch (error) {
      console.error("Error creating problem:", error);
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to create problem'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-lg w-full max-w-2xl mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-white font-medium">New Problem</span>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onClose}
              className="text-[#94a3b8] hover:text-white p-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4">
          <div className="space-y-4">
            {/* Title Input */}
            <div>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full bg-transparent border-none text-white text-lg font-medium placeholder-[#94a3b8] focus:outline-none"
                placeholder="Problem title"
                required
              />
            </div>

            {/* Description Input */}
            <div>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-transparent border-none text-white placeholder-[#94a3b8] focus:outline-none resize-none"
                placeholder="Add description..."
                rows={4}
              />
            </div>

            {/* Status and Priority Dropdowns */}
            <div className="flex items-center gap-4">
              {/* Status Dropdown */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-[#94a3b8]">Status:</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
                >
                  <option value="open">Backlog</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              {/* Priority Dropdown */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-[#94a3b8]">Priority:</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#6366f1]"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            {/* File Upload */}
            <div className="flex items-center gap-2">
              <input
                type="file"
                id="file-upload"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              <label
                htmlFor="file-upload"
                className="flex items-center gap-2 text-[#94a3b8] hover:text-white cursor-pointer p-2 hover:bg-white/5 rounded-md transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span className="text-sm">Add files</span>
              </label>
            </div>

            {/* Attached Files List */}
            {attachedFiles.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm text-[#94a3b8]">Attached files:</div>
                {attachedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-white/5 rounded-md px-3 py-2">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#94a3b8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm text-white">{file.name}</span>
                      <span className="text-xs text-[#94a3b8]">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end pt-4 border-t border-white/10 mt-6">
            <button
              type="submit"
              disabled={isSubmitting || !formData.title.trim()}
              className="bg-[#6366f1] hover:bg-[#5856eb] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md text-sm font-medium transition-colors"
            >
              {isSubmitting ? "Creating..." : "Create Problem"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

