import { useState } from "react";
import { API_URL } from "../api";
import { useSnackbar } from "../context/SnackbarContext";

interface Props {
  jobId: string;
  onClose: () => void;
  onUpload: () => void;
}

export function CandidateUploadModal({ jobId, onClose, onUpload }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { showSnackbar } = useSnackbar();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name || !email) {
      showSnackbar("Please fill in all fields", "warning");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("jobId", jobId);
    formData.append("cv", file);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/candidates`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      onUpload();
      onClose();
    } catch (err) {
      showSnackbar("Failed to upload candidate", "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ 
      position: "fixed", top: 0, left: 0, width: "100%", height: "100vh", 
      background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center",
      zIndex: 2000
    }}>
      <div style={{ background: "white", padding: "20px", borderRadius: "12px", width: "400px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ margin: 0 }}>Add Candidate</h3>
            <button onClick={onClose} style={{ background: "transparent", border: "none", fontSize: "20px", cursor: "pointer" }}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px" }}>Name</label>
                <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                    style={{ width: "100%", padding: "8px" }}
                />
            </div>
            <div style={{ marginBottom: "15px" }}>
                <label style={{ display: "block", marginBottom: "5px" }}>Email</label>
                <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                    style={{ width: "100%", padding: "8px" }}
                />
            </div>
            <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "5px" }}>CV (PDF/DOC)</label>
                <input 
                    type="file" 
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setFile(e.target.files?.[0] || null)} 
                    required 
                    style={{ width: "100%" }}
                />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" onClick={onClose} style={{ background: "#eee", color: "#333" }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={uploading}>
                    {uploading ? "Uploading..." : "Upload Candidate"}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
}
