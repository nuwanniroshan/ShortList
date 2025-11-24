import { useEffect, useState } from "react";
import { request } from "../api";
import { useSnackbar } from "../context/SnackbarContext";

interface User {
  id: string;
  email: string;
  role: string;
}

interface Props {
  jobId: string;
  currentAssignees: User[];
  onClose: () => void;
  onAssign: () => void;
}

export function UserAssignmentModal({ jobId, currentAssignees, onClose, onAssign }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    loadUsers();
    setSelectedUserIds(currentAssignees.map(u => u.id));
  }, []);

  const loadUsers = async () => {
    try {
      const data = await request("/users");
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleUser = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSave = async () => {
    try {
      await request(`/jobs/${jobId}/assign`, {
        method: "POST",
        body: JSON.stringify({ userIds: selectedUserIds }),
      });
      onAssign();
      onClose();
    } catch (err) {
      showSnackbar("Failed to assign users", "error");
    }
  };

  return (
    <div style={{ 
      position: "fixed", top: 0, left: 0, width: "100%", height: "100vh", 
      background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center",
      zIndex: 2000
    }}>
      <div style={{ background: "white", padding: "20px", borderRadius: "12px", width: "400px", maxHeight: "80vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ margin: 0 }}>Assign Users</h3>
            <button onClick={onClose} style={{ background: "transparent", border: "none", fontSize: "20px", cursor: "pointer" }}>&times;</button>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
            {users.map(user => (
                <label key={user.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", background: "#f9f9f9", borderRadius: "8px", cursor: "pointer" }}>
                    <input 
                        type="checkbox" 
                        checked={selectedUserIds.includes(user.id)} 
                        onChange={() => toggleUser(user.id)}
                    />
                    <div>
                        <div style={{ fontWeight: "bold" }}>{user.email}</div>
                        <div style={{ fontSize: "12px", color: "#666" }}>{user.role}</div>
                    </div>
                </label>
            ))}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button onClick={onClose} style={{ background: "#eee", color: "#333" }}>Cancel</button>
            <button className="btn-primary" onClick={handleSave}>Save Assignments</button>
        </div>
      </div>
    </div>
  );
}
