"use client";
import { useState } from "react";
import { useApp } from "../context/AppContext";

interface ProblemFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProblemForm({ isOpen, onClose }: ProblemFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "open" as const,
    priority: "medium" as const,
    conjectures: [""],
    criticisms: [""],
    artifacts: [] as File[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { fetchProblems } = useApp();

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
        await fetchProblems();
        onClose();
        setFormData({
          title: "",
          description: "",
          status: "open",
          priority: "medium",
          conjectures: [""],
          criticisms: [""],
          artifacts: []
        });
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

  const addConjecture = () => {
    setFormData(prev => ({ ...prev, conjectures: [...prev.conjectures, ""] }));
  };

  const removeConjecture = (index: number) => {
    setFormData(prev => ({ 
      ...prev, 
      conjectures: prev.conjectures.filter((_, i) => i !== index) 
    }));
  };

  const addCriticism = () => {
    setFormData(prev => ({ ...prev, criticisms: [...prev.criticisms, ""] }));
  };

  const removeCriticism = (index: number) => {
    setFormData(prev => ({ 
      ...prev, 
      criticisms: prev.criticisms.filter((_, i) => i !== index) 
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({ ...prev, artifacts: [...prev.artifacts, ...files] }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#0b0b0f] border border-white/10 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Create New Problem</h2>
          <button onClick={onClose} className="text-[#94a3b8] hover:text-white">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full bg-[#0f1117] border border-white/10 rounded px-3 py-2 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full bg-[#0f1117] border border-white/10 rounded px-3 py-2 text-sm h-20"
              placeholder="Describe the problem..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full bg-[#0f1117] border border-white/10 rounded px-3 py-2 text-sm"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                className="w-full bg-[#0f1117] border border-white/10 rounded px-3 py-2 text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>


          <div>
            <label className="block text-sm font-medium mb-2">Conjectures (Possible Solutions)</label>
            {formData.conjectures.map((conjecture, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={conjecture}
                  onChange={(e) => {
                    const newConjectures = [...formData.conjectures];
                    newConjectures[index] = e.target.value;
                    setFormData(prev => ({ ...prev, conjectures: newConjectures }));
                  }}
                  className="flex-1 bg-[#0f1117] border border-white/10 rounded px-3 py-2 text-sm"
                  placeholder="Enter a possible solution..."
                />
                <button
                  type="button"
                  onClick={() => removeConjecture(index)}
                  className="text-red-400 hover:text-red-300 px-2"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addConjecture}
              className="text-[#9ecbff] hover:text-white text-sm"
            >
              + Add Conjecture
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Criticisms (Evidence/Refutations)</label>
            {formData.criticisms.map((criticism, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={criticism}
                  onChange={(e) => {
                    const newCriticisms = [...formData.criticisms];
                    newCriticisms[index] = e.target.value;
                    setFormData(prev => ({ ...prev, criticisms: newCriticisms }));
                  }}
                  className="flex-1 bg-[#0f1117] border border-white/10 rounded px-3 py-2 text-sm"
                  placeholder="Enter evidence or criticism..."
                />
                <button
                  type="button"
                  onClick={() => removeCriticism(index)}
                  className="text-red-400 hover:text-red-300 px-2"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addCriticism}
              className="text-[#9ecbff] hover:text-white text-sm"
            >
              + Add Criticism
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Artifacts (Files)</label>
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="w-full bg-[#0f1117] border border-white/10 rounded px-3 py-2 text-sm"
            />
            {formData.artifacts.length > 0 && (
              <div className="mt-2 space-y-1">
                {formData.artifacts.map((file, index) => (
                  <div key={index} className="text-xs text-[#94a3b8]">
                    📎 {file.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-tr from-[#6366f1] to-[#22d3ee] text-white py-2 px-4 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Create Problem"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-white/10 rounded-lg text-sm hover:bg-white/10"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
