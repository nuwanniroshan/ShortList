import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { request, API_URL } from "../api";
import { useSnackbar } from "../context/SnackbarContext";
import { UserAssignmentModal } from "../components/UserAssignmentModal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { EditJobModal } from "../components/EditJobModal";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  MenuItem,
  IconButton,
  Alert,
  CircularProgress,
  Link,
  Avatar,
  Breadcrumbs,
  Menu
} from "@mui/material";
import {
  PersonAdd,
  MoreHoriz,
} from "@mui/icons-material";
import { CandidateDetailsDrawer } from "../components/CandidateDetailsDrawer";

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  cv_file_path: string;
  profile_picture?: string;
  created_at: string;
}

interface Job {
  id: string;
  title: string;
  description: string;
  status: string;
  department?: string;
  branch?: string;
  tags?: string[];
  start_date: string;
  expected_closing_date: string;
  actual_closing_date?: string;
  candidates: Candidate[];
  created_by: { id: string; email: string; name?: string };
  assignees: { id: string; email: string; name?: string }[];
}



export function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const [job, setJob] = useState<Job | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [pipelineStatuses, setPipelineStatuses] = useState<{id: string, value: string, label: string}[]>([]);

  useEffect(() => {
    loadJob();
    loadStatuses();
  }, [id]);

  const loadStatuses = async () => {
    try {
      const data = await request("/pipeline-statuses");
      // Map backend status to column format if needed, or just use as is
      // Backend returns { id, value, label, order }
      // We need to map 'value' to 'id' for COLUMNS usage if we want to keep structure similar
      // But COLUMNS was { id: "new", label: "Applied" } where id was the value.
      setPipelineStatuses(data.map((s: any) => ({ id: s.value, label: s.label })));
    } catch (err) {
      console.error("Failed to load statuses", err);
    }
  };

  const loadJob = async () => {
    try {
      setError(null);
      const data = await request(`/jobs/${id}`);
      setJob(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load job");
    }
  };


  const handleStatusChange = async (candidateId: string, newStatus: string) => {
    try {
      await request(`/candidates/${candidateId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      loadJob();
      if (selectedCandidate?.id === candidateId) {
        setSelectedCandidate(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      showSnackbar("Failed to update status", "error");
    }
  };







  const handleDeleteJob = async () => {
    try {
      await request(`/jobs/${id}`, { method: "DELETE" });
      showSnackbar("Job deleted successfully", "success");
      navigate("/dashboard");
    } catch (err) {
      showSnackbar("Failed to delete job", "error");
    }
    setShowDeleteDialog(false);
  };

  const handleCloseJob = async () => {
    try {
      await request(`/jobs/${id}/close`, { method: "POST" });
      showSnackbar("Job closed successfully", "success");
      loadJob();
    } catch (err) {
      showSnackbar("Failed to close job", "error");
    }
    setShowCloseDialog(false);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    handleMenuClose();
    setEditModalOpen(true);
  };

  const handleDeleteFromMenu = () => {
    handleMenuClose();
    setShowDeleteDialog(true);
  };

  const handleAssignUsers = () => {
    handleMenuClose();
    setShowAssignmentModal(true);
  };

  const canManageJob = () => {
    if (!job) return false;
    // Admin/HR have full access to all jobs
    if (user.role === "admin" || user.role === "hr") {
      return true;
    }
    // Engineering Manager has full access to jobs they created
    if (user.role === "engineering_manager" && job.created_by?.id === user.id) {
      return true;
    }
    return false;
  };

  const canAddCandidate = () => {
    if (!job) return false;
    // Admin/HR can add candidates to all jobs
    if (user.role === "admin" || user.role === "hr") {
      return true;
    }
    // Engineering Manager can add candidates to jobs they created
    if (user.role === "engineering_manager" && job.created_by?.id === user.id) {
      return true;
    }
    // Assigned recruiters can add candidates
    if (job.assignees?.some((assignee: any) => assignee.id === user.id)) {
      return true;
    }
    return false;
  };

  const isJobClosed = job?.status === "closed";

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };



  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!job) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  const candidates = job.candidates || [];
  const candidatesByStatus = pipelineStatuses.reduce((acc, col) => {
    acc[col.id] = candidates.filter(c => c.status === col.id);
    return acc;
  }, {} as Record<string, Candidate[]>);

  return (
    <Box sx={{ p: 3, height: "100vh", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link underline="hover" color="inherit" href="/dashboard">
          Home
        </Link>
        <Typography color="text.primary">Pipeline</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              {job.title}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {job.department || "Department"} &nbsp;•&nbsp; {job.branch || "Branch"}
              </Typography>
              {job.tags && job.tags.map((tag, index) => (
                <Box 
                  key={index} 
                  sx={{ 
                    bgcolor: "action.hover", 
                    px: 1, 
                    py: 0.5, 
                    borderRadius: 1,
                    fontSize: "0.75rem",
                    color: "text.secondary"
                  }}
                >
                  {tag}
                </Box>
              ))}
            </Box>
            <Typography variant="body1" color="text.primary" sx={{ maxWidth: "800px", mb: 2 }}>
                {job.description}
            </Typography>
            
            <Box sx={{ display: "flex", gap: 4, flexWrap: "wrap", mt: 2 }}>
                <Box sx={{ display: "flex", gap: 0.5 }}>
                    <Typography variant="subtitle2" fontWeight="bold">{candidates.length}</Typography>
                    <Typography variant="body2" color="text.secondary">Candidates</Typography>
                </Box>
                
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">Hiring Lead:</Typography>
                    <Typography variant="subtitle2" fontWeight="bold">
                        {/* @ts-ignore */}
                        {job.created_by?.name || job.created_by?.email?.split('@')[0] || "Unknown"}
                    </Typography>
                </Box>

                {job.assignees && job.assignees.length > 0 && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="body2" color="text.secondary">Recruiters:</Typography>
                        <Box sx={{ display: "flex", gap: 1 }}>
                            {job.assignees.map((assignee: any) => (
                                <Typography key={assignee.id} variant="subtitle2" fontWeight="bold">
                                    {assignee.name || assignee.email?.split('@')[0]}
                                </Typography>
                            ))}
                        </Box>
                    </Box>
                )}

                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">Timeline:</Typography>
                    <Typography variant="subtitle2" fontWeight="bold">
                        {formatDate(job.start_date)} - {formatDate(job.expected_closing_date)}
                    </Typography>
                </Box>
            </Box>
          </Box>
          
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
             {!isJobClosed && canAddCandidate() && (
                <Button
                  variant="contained"
                  startIcon={<PersonAdd />}
                  onClick={() => navigate(`/jobs/${id}/add-candidate`)}
                  sx={{ borderRadius: 2, px: 3, py: 1 }}
                >
                  Add Candidate
                </Button>
              )}
              {canManageJob() && (
                <IconButton 
                  onClick={handleMenuOpen}
                  sx={{ 
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    width: 40,
                    height: 40
                  }}
                >
                  <MoreHoriz />
                </IconButton>
              )}
          </Box>
        </Box>
      </Box>

      {/* Kanban Board */}
      <Box sx={{ 
        display: "flex", 
        gap: 3, 
        overflowX: "auto", 
        pb: 2, 
        flexGrow: 1, 
        minHeight: 0 
      }}>
        {pipelineStatuses.length === 0 ? (
          <Box sx={{ 
            display: "flex", 
            justifyContent: "center", 
            alignItems: "center", 
            width: "100%", 
            height: "100%",
            flexDirection: "column",
            gap: 2
          }}>
            <Typography variant="h6" color="text.secondary">
              Pipeline not configured
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please configure the pipeline stages in Settings.
            </Typography>
          </Box>
        ) : (
          pipelineStatuses.map((col, index) => (
            <Box 
              key={col.id} 
              sx={{ 
                minWidth: 320, 
                flexShrink: 0, 
                display: "flex", 
                flexDirection: "column", 
                height: "100%",
                borderRight: index !== pipelineStatuses.length - 1 ? "1px solid" : "none",
                borderColor: "divider",
                pr: 3
              }}
            >
              {/* Column Header */}
              <Box sx={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center", 
                  mb: 2,
                  px: 1
              }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                      {col.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                      ({candidatesByStatus[col.id]?.length || 0})
                  </Typography>
                </Box>
              </Box>

              {/* Column Content */}
              <Box sx={{ 
                  display: "flex", 
                  flexDirection: "column", 
                  gap: 2, 
                  overflowY: "auto", 
                  flexGrow: 1,
                  pr: 1,
                  pb: 2
              }}>
                {candidatesByStatus[col.id]?.map(candidate => {

                  return (
                    <Card
                      key={candidate.id}
                      sx={{
                        cursor: "pointer",
                        borderRadius: 1,
                        boxShadow: "none",
                        border: "1px solid",
                        borderColor: selectedCandidate?.id === candidate.id ? "primary.main" : "divider",
                        bgcolor: "background.paper",
                        transition: "all 0.2s",
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
                        },
                      }}
                      onClick={() => setSelectedCandidate(candidate)}
                    >
                      <CardContent sx={{ p: 2.5 }}>
                        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                          <Avatar 
                              src={candidate.profile_picture ? `${API_URL}/candidates/${candidate.id}/profile-picture` : undefined}
                              sx={{ width: 48, height: 48, bgcolor: 'primary.light' }} 
                          >
                            {!candidate.profile_picture && `${candidate.name.charAt(0).toUpperCase()}${candidate.name.charAt(1).toUpperCase()}`}
                          </Avatar>
                          <Box>
                              <Typography variant="subtitle1" fontWeight="bold" sx={{ lineHeight: 1.2, mb: 0.5 }}>
                                  {candidate.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                  Date added: {formatDate(candidate.created_at || new Date().toISOString())}
                              </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            </Box>
          ))
        )}
      </Box>

      {/* Modals & Drawers (Keep functionality) */}
      {showAssignmentModal && (
        <UserAssignmentModal 
          jobId={job.id} 
          // @ts-ignore
          currentAssignees={job.assignees || []} 
          onClose={() => setShowAssignmentModal(false)} 
          onAssign={() => {
            loadJob();
            showSnackbar("Assignments updated!", "success");
          }} 
        />
      )}

      <CandidateDetailsDrawer
        candidate={selectedCandidate}
        open={!!selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        onStatusChange={handleStatusChange}
        onUpdate={loadJob}
        statuses={pipelineStatuses.map(s => ({ value: s.id, label: s.label }))}
      />

      <ConfirmDialog
        open={showDeleteDialog}
        title="Delete Job"
        message="Are you sure you want to delete this job? This action cannot be undone."
        confirmLabel="Delete"
        confirmColor="error"
        onConfirm={handleDeleteJob}
        onCancel={() => setShowDeleteDialog(false)}
      />

      <ConfirmDialog
        open={showCloseDialog}
        title="Close Job"
        message="Are you sure you want to close this job?"
        confirmLabel="Close Job"
        confirmColor="warning"
        onConfirm={handleCloseJob}
        onCancel={() => setShowCloseDialog(false)}
      />

      {/* Dropdown Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleEdit}>
          Edit Job
        </MenuItem>
        <MenuItem onClick={handleAssignUsers}>
          Assign Recruiter
        </MenuItem>
        <MenuItem onClick={handleDeleteFromMenu} sx={{ color: 'error.main' }}>
          Delete Job
        </MenuItem>
      </Menu>

      {/* Edit Job Modal */}
      {job && (
        <EditJobModal
          job={job}
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onUpdate={() => {
            loadJob();
          }}
        />
      )}
    </Box>
  );
}
