import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  Drawer,
  Avatar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Tabs,
  Tab,
  TextField,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from "@mui/material";
import {
  Close,
  Email,
  Phone,
  LocationOn,
  AttachMoney,
  Person,
  Description,
  Quiz,
  Note,
  Send,
  Download
} from "@mui/icons-material";
import { API_URL, request } from "../api";

interface Candidate {
  id: string;
  name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone: string;
  current_address?: string;
  permanent_address?: string;
  status: string;
  cv_file_path: string;
  cover_letter_path?: string;
  profile_picture?: string;
  education?: any[];
  experience?: any[];
  desired_salary?: number;
  referred_by?: string;
  website?: string;
  created_at: string;
  notes?: string;
  interview_date?: string;
  interview_link?: string;
  created_by?: {
    id: string;
    email: string;
    name?: string;
  };
}

interface Comment {
  id: string;
  text: string;
  created_at: string;
  created_by: {
    email: string;
    name?: string;
  };
}

interface CandidateDetailsDrawerProps {
  candidate: Candidate | null;
  open: boolean;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
  onUpdate: () => void;
  statuses?: { value: string; label: string }[];
}

export function CandidateDetailsDrawer({
  candidate,
  open,
  onClose,
  onStatusChange,
  onUpdate,
  statuses = []
}: CandidateDetailsDrawerProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [notes, setNotes] = useState("");
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (candidate) {
      loadComments();
      loadCv();
      setNotes(candidate.notes || "");
    } else {
      setComments([]);
      setCvUrl(null);
      setNotes("");
    }
  }, [candidate]);

  const loadComments = async () => {
    if (!candidate) return;
    try {
      const data = await request(`/candidates/${candidate.id}/comments`);
      setComments(data);
    } catch (err) {
      console.error("Failed to load comments", err);
    }
  };

  const loadCv = async () => {
    if (!candidate) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/candidates/${candidate.id}/cv`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setCvUrl(url);
      }
    } catch (err) {
      console.error("Failed to load CV", err);
    }
  };

  const handleAddComment = async () => {
    if (!candidate || !newComment.trim()) return;
    try {
      await request(`/candidates/${candidate.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ text: newComment }),
      });
      setNewComment("");
      loadComments();
    } catch (err) {
      console.error("Failed to add comment", err);
    }
  };

  const handleSaveNotes = async () => {
    if (!candidate) return;
    setIsSavingNotes(true);
    try {
      await request(`/candidates/${candidate.id}/notes`, {
        method: "PATCH",
        body: JSON.stringify({ notes }),
      });
      onUpdate();
    } catch (err) {
      console.error("Failed to save notes", err);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleDeleteCandidate = async () => {
    if (!candidate) return;
    try {
      await request(`/candidates/${candidate.id}`, {
        method: "DELETE",
      });
      setShowDeleteDialog(false);
      onClose();
      onUpdate();
    } catch (err) {
      console.error("Failed to delete candidate", err);
    }
  };

  if (!candidate) return null;

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{ sx: { width: { xs: "100%", md: "900px" }, display: "flex", flexDirection: "row" } }}
      >
        {/* Left Sidebar */}
        <Box sx={{ width: "320px", borderRight: "1px solid", borderColor: "divider", display: "flex", flexDirection: "column", bgcolor: "background.paper" }}>
          <Box sx={{ p: 3, display: "flex", flexDirection: "column", alignItems: "center", borderBottom: "1px solid", borderColor: "divider" }}>
            <Avatar
              src={candidate.profile_picture ? `${API_URL}/candidates/${candidate.id}/profile-picture` : `https://api.dicebear.com/7.x/avataaars/svg?seed=${candidate.id}`}
              sx={{ width: 80, height: 80, mb: 2, bgcolor: "primary.light" }}
            />
            <Typography variant="h6" fontWeight="bold" textAlign="center">{candidate.name}</Typography>
            <Chip
              label={statuses.find(o => o.value === candidate.status)?.label || candidate.status}
              size="small"
              color={candidate.status === 'rejected' ? 'error' : 'primary'}
              sx={{ mt: 1 }}
            />
          </Box>

          <Box sx={{ p: 3, flexGrow: 1, overflowY: "auto" }}>
            {/* Basic Section */}
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, color: "text.primary" }}>
              Basic
            </Typography>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" fontWeight="medium">{candidate.first_name} {candidate.last_name}</Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Contacts Section */}
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, color: "text.primary" }}>
              Contacts
            </Typography>
            
            {candidate.email && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <Email fontSize="small" color="action" />
                <Typography variant="body2">{candidate.email}</Typography>
              </Box>
            )}
            
            {candidate.phone && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <Phone fontSize="small" color="action" />
                <Typography variant="body2">{candidate.phone}</Typography>
              </Box>
            )}
            
            {candidate.current_address && (
              <Box sx={{ display: "flex", alignItems: "start", gap: 1, mb: 1.5 }}>
                <LocationOn fontSize="small" color="action" sx={{ mt: 0.2 }} />
                <Typography variant="body2">{candidate.current_address}</Typography>
              </Box>
            )}

            {candidate.desired_salary && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <AttachMoney fontSize="small" color="action" />
                <Typography variant="body2">${candidate.desired_salary.toLocaleString()}</Typography>
              </Box>
            )}

            <Divider sx={{ my: 2 }} />

            {/* Education Section */}
            {candidate.education && candidate.education.length > 0 && (
              <>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, color: "text.primary" }}>
                  Education
                </Typography>
                {candidate.education.map((edu: any, index: number) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight="medium">{edu.degree}</Typography>
                    <Typography variant="caption" color="text.secondary">{edu.institution}</Typography>
                  </Box>
                ))}
                <Divider sx={{ my: 2 }} />
              </>
            )}

            {/* Experience Section */}
            {candidate.experience && candidate.experience.length > 0 && (
              <>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, color: "text.primary" }}>
                  Experience
                </Typography>
                {candidate.experience.map((exp: any, index: number) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight="medium">{exp.title}</Typography>
                    <Typography variant="caption" color="text.secondary">{exp.company}</Typography>
                  </Box>
                ))}
                <Divider sx={{ my: 2 }} />
              </>
            )}

            {/* More Section */}
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, color: "text.primary" }}>
              More
            </Typography>
            
            {candidate.referred_by && (
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="caption" color="text.secondary">Referred By</Typography>
                <Typography variant="body2">{candidate.referred_by}</Typography>
              </Box>
            )}
            
            {candidate.website && (
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="caption" color="text.secondary">Website</Typography>
                <Typography variant="body2">{candidate.website}</Typography>
              </Box>
            )}
            
            {candidate.created_by && (
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="caption" color="text.secondary">Created By</Typography>
                <Typography variant="body2">{candidate.created_by.name || candidate.created_by.email}</Typography>
              </Box>
            )}
          </Box>

          {/* Actions */}
          <Box sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}>
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Pipeline Status</InputLabel>
              <Select
                value={candidate.status}
                label="Pipeline Status"
                onChange={(e) => onStatusChange(candidate.id, e.target.value)}
              >
                {statuses.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button 
              variant="outlined" 
              color="error" 
              fullWidth 
              onClick={() => onStatusChange(candidate.id, "rejected")}
              disabled={candidate.status === "rejected"}
            >
              Reject Candidate
            </Button>

            <Button 
              variant="contained" 
              color="error" 
              fullWidth 
              onClick={() => setShowDeleteDialog(true)}
              sx={{ mt: 1 }}
            >
              Delete Candidate
            </Button>
          </Box>
        </Box>

        {/* Right Content Area */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
            <Typography variant="h6">Candidate Details</Typography>
            <IconButton onClick={onClose}>
              <Close />
            </IconButton>
          </Box>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}>
            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
              <Tab icon={<Description />} label="Documents" />
              <Tab icon={<Quiz />} label="Questionaries" />
              <Tab icon={<Note />} label="Notes" />
              <Tab icon={<Person />} label="Activity" />
            </Tabs>
          </Box>

          {/* Tab Content */}
          <Box sx={{ flexGrow: 1, overflowY: "auto", p: 3 }}>
            {activeTab === 0 && (
              <Box>
                {cvUrl && (
                  <Button variant="outlined" startIcon={<Download />} href={cvUrl} download={`${candidate.name}_CV.pdf`} sx={{ mb: 2 }}>
                    Download CV
                  </Button>
                )}
                {!cvUrl && <Typography color="text.secondary">No CV available</Typography>}
              </Box>
            )}

            {activeTab === 1 && (
              <Typography color="text.secondary">No questionaries available</Typography>
            )}

            {activeTab === 2 && (
              <Box>
                <TextField
                  fullWidth
                  multiline
                  rows={10}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this candidate..."
                />
                <Button variant="contained" onClick={handleSaveNotes} disabled={isSavingNotes} sx={{ mt: 2 }}>
                  {isSavingNotes ? "Saving..." : "Save Notes"}
                </Button>
              </Box>
            )}

            {activeTab === 3 && (
              <Box>
                {comments.length === 0 ? (
                  <Typography color="text.secondary" textAlign="center">No comments yet</Typography>
                ) : (
                  <List>
                    {comments.map((comment) => (
                      <ListItem key={comment.id} alignItems="flex-start">
                        <ListItemAvatar>
                          <Avatar>{comment.created_by.name?.charAt(0) || comment.created_by.email.charAt(0)}</Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={comment.created_by.name || comment.created_by.email}
                          secondary={
                            <>
                              <Typography variant="body2" component="span">{comment.text}</Typography>
                              <Typography variant="caption" display="block" color="text.secondary">
                                {new Date(comment.created_at).toLocaleString()}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}

                <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                  />
                  <IconButton 
                    color="primary" 
                    onClick={handleAddComment} 
                    disabled={!newComment.trim()}
                    sx={{ 
                      borderRadius: 1,
                      width: 40,
                      height: 40
                    }}
                  >
                    <Send />
                  </IconButton>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
      >
        <DialogTitle>Delete Candidate</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this candidate? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteCandidate} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
