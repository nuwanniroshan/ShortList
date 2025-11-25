import { useState, useEffect, useRef } from "react";
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
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent
} from "@mui/lab";
import {
  Close,
  Description,
  Send,
  Download,
  Upload,
  ExpandMore,
  ExpandLess
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
    id: string;
    email: string;
    name?: string;
  };
  attachment_path?: string;
  attachment_original_name?: string;
  attachment_type?: string;
  attachment_size?: number;
}

interface ActivityLog {
  id: string;
  old_status: string;
  new_status: string;
  changed_at: string;
  changed_by: {
    name?: string;
    email: string;
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
  const [attachment, setAttachment] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activityHistory, setActivityHistory] = useState<ActivityLog[]>([]);
  const [isUploadingCv, setIsUploadingCv] = useState(false);
  const [isCommentsExpanded, setIsCommentsExpanded] = useState(true);
  const cvFileInputRef = useRef<HTMLInputElement>(null);
  
  // Hardcoded questionnaire data
  const [questionnaires] = useState({
    whyWorkHere: "I am passionate about this company's mission and believe my skills align perfectly with the role requirements.",
    salaryExpectations: "$80,000 - $100,000",
    startDate: "2025-01-15",
    willingToRelocate: "yes"
  });

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isRecruiter = user.role === "recruiter" || user.role === "hr" || user.role === "admin";

  useEffect(() => {
    if (candidate) {
      loadComments();
      loadCv();
      loadActivityHistory();
      setNotes(candidate.notes || "");
    } else {
      setComments([]);
      setCvUrl(null);
      setNotes("");
      setActivityHistory([]);
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

  const loadActivityHistory = async () => {
    if (!candidate) return;
    try {
      const data = await request(`/candidates/${candidate.id}/pipeline-history`);
      setActivityHistory(data);
    } catch (err) {
      console.error("Failed to load pipeline history", err);
      setActivityHistory([]);
    }
  };

  const handleAddComment = async () => {
    if (!candidate || (!newComment.trim() && !attachment)) return;
    try {
      const formData = new FormData();
      formData.append('text', newComment);
      if (attachment) {
          formData.append('attachment', attachment);
      }

      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/candidates/${candidate.id}/comments`, {
          method: "POST",
          headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData
      });

      if (!response.ok) {
          throw new Error("Failed to add comment");
      }

      setNewComment("");
      setAttachment(null);
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

  const handleOpenInNewTab = () => {
    if (cvUrl) {
      window.open(cvUrl, '_blank');
    }
  };

  const handleCvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !candidate) return;

    // Validate file size (6MB max)
    if (file.size > 6 * 1024 * 1024) {
      alert("File size must not exceed 6MB");
      return;
    }

    // Validate file type
    const validTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!validTypes.includes(file.type)) {
      alert("Only PDF, DOC, and DOCX files are allowed");
      return;
    }

    setIsUploadingCv(true);
    try {
      const formData = new FormData();
      formData.append('cv', file);

      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/candidates/${candidate.id}/cv`, {
        method: "PATCH",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload CV");
      }

      // Reload CV after successful upload
      loadCv();
      onUpdate();
      alert("CV uploaded successfully");
    } catch (err) {
      console.error("Failed to upload CV", err);
      alert("Failed to upload CV");
    } finally {
      setIsUploadingCv(false);
      // Reset file input
      if (cvFileInputRef.current) {
        cvFileInputRef.current.value = '';
      }
    }
  };

  if (!candidate) return null;

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{ sx: { width: { xs: "100%", md: "1000px" }, display: "flex", flexDirection: "row" } }}
      >
        {/* Left Sidebar - UNCHANGED */}
        <Box sx={{ width: "280px", borderRight: "1px solid", borderColor: "divider", display: "flex", flexDirection: "column", bgcolor: "background.paper" }}>
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
              Email
            </Typography>
            {candidate.email && (
              <Typography variant="body2" color="primary" sx={{ mb: 2 }}>{candidate.email}</Typography>
            )}

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, color: "text.primary" }}>
              Phone No
            </Typography>
            {candidate.phone && (
              <Typography variant="body2" sx={{ mb: 2 }}>{candidate.phone}</Typography>
            )}

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, color: "text.primary" }}>
              Address
            </Typography>
            {candidate.current_address && (
              <Typography variant="body2" sx={{ mb: 2 }}>{candidate.current_address}</Typography>
            )}

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, color: "text.primary" }}>
              Desired Salary
            </Typography>
            {candidate.desired_salary && (
              <Typography variant="body2" sx={{ mb: 2 }}>${candidate.desired_salary.toLocaleString()}</Typography>
            )}

            <Divider sx={{ my: 2 }} />

            {candidate.referred_by && (
              <>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, color: "text.primary" }}>
                  Referred By
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>{candidate.referred_by}</Typography>
                <Divider sx={{ my: 2 }} />
              </>
            )}

            {candidate.website && (
              <>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, color: "text.primary" }}>
                  Website/Portfolio
                </Typography>
                <Typography variant="body2" color="primary" sx={{ mb: 2, wordBreak: "break-all" }}>{candidate.website}</Typography>
                <Divider sx={{ my: 2 }} />
              </>
            )}

            {/* Education Section */}
            {candidate.education && candidate.education.length > 0 && (
              <>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, color: "text.primary" }}>
                  Education
                </Typography>
                {candidate.education.map((edu: any, index: number) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight="medium">{edu.degree}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block">{edu.institution}</Typography>
                    {(edu.startDate || edu.endDate) && (
                      <Typography variant="caption" color="text.secondary">
                        {edu.startDate}
                        {edu.startDate && edu.endDate && ' - '}
                        {edu.endDate}
                      </Typography>
                    )}
                  </Box>
                ))}
                <Divider sx={{ my: 2 }} />
              </>
            )}

            {/* Experience Section */}
            {candidate.experience && candidate.experience.length > 0 && (
              <>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, color: "text.primary" }}>
                  Experiences
                </Typography>
                {candidate.experience.map((exp: any, index: number) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight="medium">{exp.position || exp.title}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block">{exp.company}</Typography>
                    {(exp.startDate || exp.endDate) && (
                      <Typography variant="caption" color="text.secondary">
                        {exp.startDate}
                        {exp.startDate && exp.endDate && ' - '}
                        {exp.endDate}
                      </Typography>
                    )}
                  </Box>
                ))}
              </>
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
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
            <Typography variant="h6">Candidate Details</Typography>
            <IconButton onClick={onClose}>
              <Close />
            </IconButton>
          </Box>

          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}>
            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
              <Tab label="Documents" />
              <Tab label="Questionaries" />
              <Tab label="Notes" />
              <Tab label="Pipeline History" />
              <Tab label="Attachments" />
            </Tabs>
          </Box>

          {/* Tab Content - Takes remaining space above comments */}
          <Box sx={{ flexGrow: 1, overflowY: "auto", p: 3, minHeight: 0 }}>
            {/* Documents Tab */}
            {activeTab === 0 && (
              <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                {/* Document Preview */}
                {cvUrl ? (
                  <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
                    <Box sx={{ display: "flex", gap: 2, mb: 2, alignItems: "center", justifyContent: "flex-end" }}>
                      <Button 
                        component="a"
                        href={cvUrl} 
                        download={`${candidate.name}_CV.pdf`}
                      >
                        Download
                      </Button>
                      <Button
                        component="a"
                        onClick={handleOpenInNewTab}
                      >
                        Open in New Tab
                      </Button>
                    </Box>
                    <Box 
                      sx={{ 
                        flexGrow: 1,
                        border: "1px solid", 
                        borderColor: "divider", 
                        borderRadius: 1,
                        overflow: "hidden",
                        minHeight: 0
                      }}
                    >
                      <iframe 
                        src={cvUrl} 
                        style={{ width: "100%", height: "100%", border: "none" }}
                        title="CV Preview"
                      />
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ 
                    display: "flex", 
                    flexDirection: "column", 
                    alignItems: "center", 
                    justifyContent: "center",
                    height: "300px",
                    border: "2px dashed",
                    borderColor: "divider",
                    borderRadius: 2,
                    bgcolor: "background.default"
                  }}>
                    <Description sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      No CV available
                    </Typography>
                    {isRecruiter && (
                      <>
                        <input
                          type="file"
                          ref={cvFileInputRef}
                          style={{ display: 'none' }}
                          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          onChange={handleCvUpload}
                        />
                        <Button 
                          variant="contained" 
                          startIcon={<Upload />}
                          onClick={() => cvFileInputRef.current?.click()}
                          disabled={isUploadingCv}
                          sx={{ mt: 2 }}
                        >
                          {isUploadingCv ? "Uploading..." : "Upload CV"}
                        </Button>
                      </>
                    )}
                  </Box>
                )}
              </Box>
            )}

            {/* Questionaries Tab */}
            {activeTab === 1 && (
              <Box>
                <Typography variant="h6" gutterBottom>Screening Questions</Typography>
                
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Why do you want to work here?
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: "background.default" }}>
                    <Typography variant="body2">{questionnaires.whyWorkHere}</Typography>
                  </Paper>

                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    What are your salary expectations?
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: "background.default" }}>
                    <Typography variant="body2">{questionnaires.salaryExpectations}</Typography>
                  </Paper>

                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    When can you start?
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: "background.default" }}>
                    <Typography variant="body2">{new Date(questionnaires.startDate).toLocaleDateString()}</Typography>
                  </Paper>

                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                    Are you willing to relocate?
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: "background.default" }}>
                    <Typography variant="body2">{questionnaires.willingToRelocate === 'yes' ? 'Yes' : 'No'}</Typography>
                  </Paper>
                </Box>
              </Box>
            )}

            {/* Notes Tab */}
            {activeTab === 2 && (
              <Box>
                <TextField
                  fullWidth
                  multiline
                  rows={12}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this candidate..."
                  disabled={!isRecruiter}
                />
                {isRecruiter && (
                  <Button variant="contained" onClick={handleSaveNotes} disabled={isSavingNotes} sx={{ mt: 2 }}>
                    {isSavingNotes ? "Saving..." : "Save Notes"}
                  </Button>
                )}
                {!isRecruiter && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                    Only recruiters can edit notes
                  </Typography>
                )}
              </Box>
            )}

            {/* Pipeline History Tab */}
            {activeTab === 3 && (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  Pipeline History
                </Typography>
                
                {activityHistory.length === 0 ? (
                  <Typography color="text.secondary" textAlign="center" sx={{ mt: 4 }}>
                    No activity history available
                  </Typography>
                ) : (
                  <Timeline position="right" sx={{ mt: 2 }}>
                    {activityHistory.map((activity, index) => (
                      <TimelineItem key={activity.id}>
                        <TimelineOppositeContent color="text.secondary" sx={{ flex: 0.3 }}>
                          <Typography variant="caption">
                            {new Date(activity.changed_at).toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption" display="block">
                            {new Date(activity.changed_at).toLocaleTimeString()}
                          </Typography>
                        </TimelineOppositeContent>
                        <TimelineSeparator>
                          <TimelineDot color="primary" />
                          {index < activityHistory.length - 1 && <TimelineConnector />}
                        </TimelineSeparator>
                        <TimelineContent>
                          <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
                            <Typography variant="body2" fontWeight="medium">
                              Status changed: {statuses.find(s => s.value === activity.old_status)?.label || activity.old_status} → {statuses.find(s => s.value === activity.new_status)?.label || activity.new_status}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              by {activity.changed_by.name || activity.changed_by.email}
                            </Typography>
                          </Paper>
                        </TimelineContent>
                      </TimelineItem>
                    ))}
                  </Timeline>
                )}
              </Box>
            )}
            {/* Attachments Tab */}
            {activeTab === 4 && (
              <Box>
                <Typography variant="h6" gutterBottom>Attachments</Typography>
                {comments.filter(c => c.attachment_path).length === 0 ? (
                  <Typography color="text.secondary" textAlign="center" sx={{ mt: 4 }}>
                    No attachments found
                  </Typography>
                ) : (
                  <List>
                    {comments.filter(c => c.attachment_path).map((comment) => (
                      <ListItem key={comment.id} sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: "primary.light" }}>
                            <Description />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={comment.attachment_original_name}
                          secondary={
                            <>
                              <Typography variant="caption" display="block">
                                Uploaded by {comment.created_by.name || comment.created_by.email} on {new Date(comment.created_at).toLocaleDateString()}
                              </Typography>
                              <Typography variant="caption" display="block">
                                Size: {comment.attachment_size ? (comment.attachment_size / 1024).toFixed(2) : '0'} KB
                              </Typography>
                            </>
                          }
                        />
                        <Box>
                          <IconButton 
                            component="a" 
                            href={`${API_URL}/comments/${comment.id}/attachment?token=${localStorage.getItem("token")}`}
                            target="_blank"
                            download
                          >
                            <Download />
                          </IconButton>
                          {(user.id === comment.created_by.id || user.role === 'admin') && (
                             <IconButton 
                               color="error"
                               onClick={async () => {
                                 if (window.confirm("Are you sure you want to delete this attachment?")) {
                                   try {
                                     await request(`/comments/${comment.id}/attachment`, { method: "DELETE" });
                                     loadComments();
                                   } catch (err) {
                                     console.error("Failed to delete attachment", err);
                                   }
                                 }
                               }}
                             >
                               <Close />
                             </IconButton>
                          )}
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            )}
          </Box>

          {/* Comments Section - Collapsible at bottom */}
          <Box sx={{ 
            borderTop: "2px solid", 
            borderColor: "divider", 
            bgcolor: "background.paper",
            display: "flex",
            flexDirection: "column",
            height: isCommentsExpanded ? "300px" : "auto"
          }}>
            <Box 
              sx={{ 
                p: 2, 
                pb: 1, 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                cursor: "pointer",
                "&:hover": { bgcolor: "action.hover" }
              }}
              onClick={() => setIsCommentsExpanded(!isCommentsExpanded)}
            >
              <Typography variant="subtitle1" fontWeight="bold">
                Comments ({comments.length})
              </Typography>
              <IconButton size="small">
                {isCommentsExpanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>
            
            {isCommentsExpanded && (
              <>
                {/* Comments List - Scrollable */}
                <Box sx={{ flexGrow: 1, overflowY: "auto", px: 2, minHeight: 0 }}>
                  {comments.length === 0 ? (
                    <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                      No comments yet
                    </Typography>
                  ) : (
                    <List sx={{ py: 0 }}>
                      {[...comments].reverse().map((comment) => (
                        <ListItem key={comment.id} alignItems="flex-start" sx={{ px: 0 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ width: 32, height: 32 }}>
                              {comment.created_by.name?.charAt(0) || comment.created_by.email.charAt(0)}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <Typography variant="body2" fontWeight="medium">
                                  {comment.created_by.name || comment.created_by.email}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(comment.created_at).toLocaleString()}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2" sx={{ mt: 0.5 }}>
                                  {comment.text}
                                </Typography>
                                {comment.attachment_path && (
                                  <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
                                    <Chip 
                                      icon={<Description />} 
                                      label={comment.attachment_original_name} 
                                      size="small" 
                                      variant="outlined"
                                      component="a"
                                      href={`${API_URL}/comments/${comment.id}/attachment?token=${localStorage.getItem("token")}`}
                                      target="_blank"
                                      clickable
                                    />
                                  </Box>
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>

                {/* Add Comment Input - Fixed at bottom */}
                <Box sx={{ p: 2, pt: 1, borderTop: "1px solid", borderColor: "divider" }}>
                  <Box sx={{ display: "flex", gap: 1, flexDirection: 'column' }}>
                    {attachment && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                            <Chip 
                                label={attachment.name} 
                                onDelete={() => setAttachment(null)} 
                                size="small"
                            />
                        </Box>
                    )}
                    <Box sx={{ display: "flex", gap: 1 }}>
                        <TextField
                        fullWidth
                        size="small"
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleAddComment()}
                        />
                        <input
                            type="file"
                            id="comment-attachment"
                            style={{ display: "none" }}
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    setAttachment(e.target.files[0]);
                                }
                            }}
                        />
                        <label htmlFor="comment-attachment">
                            <IconButton component="span" color={attachment ? "primary" : "default"}>
                                <Upload />
                            </IconButton>
                        </label>
                        <IconButton 
                        color="primary" 
                        onClick={handleAddComment} 
                        disabled={!newComment.trim() && !attachment}
                        sx={{ 
                            bgcolor: (newComment.trim() || attachment) ? "primary.main" : "action.disabledBackground",
                            color: (newComment.trim() || attachment) ? "white" : "action.disabled",
                            "&:hover": {
                            bgcolor: (newComment.trim() || attachment) ? "primary.dark" : "action.disabledBackground"
                            },
                            borderRadius: 1,
                            width: 40,
                            height: 40
                        }}
                        >
                        <Send fontSize="small" />
                        </IconButton>
                    </Box>
                  </Box>
                </Box>
              </>
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
