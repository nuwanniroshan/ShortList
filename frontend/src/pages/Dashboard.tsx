
import { useEffect, useState } from "react";
import { request } from "../api";
import { useNavigate } from "react-router-dom";
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  Chip, 
  IconButton, 
  InputBase,
  Avatar,
  Stack,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from "@mui/material";
import { 
  Add, 
  Search, 
  MoreHoriz,
  ViewModule,
  ViewList
} from "@mui/icons-material";
import { EditJobModal } from "../components/EditJobModal";
import { UserAssignmentModal } from "../components/UserAssignmentModal";
import { useSnackbar } from "../context/SnackbarContext";

interface Job {
  id: string;
  title: string;
  description: string;
  status: string;
  start_date: string;
  expected_closing_date: string;
  actual_closing_date?: string;
  candidates: any[];
  created_by: { id: string; email: string };
  assignees?: { id: string; email: string; role: string }[];
  department?: string;
  branch?: string;
  tags?: string[];
}

export function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const data = await request("/jobs");
      setJobs(data);
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, job: Job) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedJob(job);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    handleMenuClose();
    setEditModalOpen(true);
  };

  const handleDelete = () => {
    handleMenuClose();
    setDeleteDialogOpen(true);
  };

  const handleAssignRecruiter = () => {
    handleMenuClose();
    setAssignModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedJob) return;
    
    try {
      await request(`/jobs/${selectedJob.id}`, {
        method: "DELETE",
      });
      showSnackbar("Job deleted successfully", "success");
      setDeleteDialogOpen(false);
      setSelectedJob(null);
      loadJobs();
    } catch (err: any) {
      showSnackbar(err.message || "Failed to delete job", "error");
    }
  };

  const canManageJob = (job: Job) => {
    // Engineering Manager can manage jobs they created
    // Admin and HR can manage all jobs
    if (user.role === "admin" || user.role === "hr") {
      return true;
    }
    if (user.role === "engineering_manager" && job.created_by?.id === user.id) {
      return true;
    }
    return false;
  };

  // Filter jobs based on search query
  const filteredJobs = jobs.filter((job) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    const title = job.title?.toLowerCase() || "";
    const department = job.department?.toLowerCase() || "";
    const branch = job.branch?.toLowerCase() || "";
    const hiringManager = job.created_by?.email?.toLowerCase() || "";
    const tags = job.tags?.join(" ").toLowerCase() || "";
    
    return (
      title.includes(query) ||
      department.includes(query) ||
      branch.includes(query) ||
      hiringManager.includes(query) ||
      tags.includes(query)
    );
  });

  return (
    <Box sx={{ maxWidth: 1600, mx: "auto" }}>

      {/* Header Section */}
      <Box sx={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        mb: 4,
        flexWrap: "wrap",
        gap: 2
      }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Job Openings
        </Typography>

        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          {/* Search */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            bgcolor: 'background.paper', 
            borderRadius: 2, 
            px: 2, 
            py: 0.5,
            border: '1px solid',
            borderColor: 'divider',
            width: 300
          }}>
            <Search sx={{ color: 'text.secondary', mr: 1 }} />
            <InputBase
              placeholder="Search by title, department, manager..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: '100%' }}
            />
          </Box>

          {/* View Toggle */}
          <Box sx={{ 
            display: 'flex', 
            bgcolor: 'background.paper', 
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
            p: 0.5
          }}>
            <IconButton 
              size="small"
              onClick={() => setViewMode("card")}
              sx={{ 
                bgcolor: viewMode === "card" ? 'primary.main' : 'transparent',
                color: viewMode === "card" ? 'white' : 'text.secondary',
                '&:hover': { 
                  bgcolor: viewMode === "card" ? 'primary.dark' : 'action.hover'
                }
              }}
            >
              <ViewModule fontSize="small" />
            </IconButton>
            <IconButton 
              size="small"
              onClick={() => setViewMode("list")}
              sx={{ 
                bgcolor: viewMode === "list" ? 'primary.main' : 'transparent',
                color: viewMode === "list" ? 'white' : 'text.secondary',
                '&:hover': { 
                  bgcolor: viewMode === "list" ? 'primary.dark' : 'action.hover'
                }
              }}
            >
              <ViewList fontSize="small" />
            </IconButton>
          </Box>

          {/* New Opening Button */}
          {(user.role === "admin" || user.role === "hr" || user.role === "engineering_manager") && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate("/create-job")}
              sx={{ px: 3 }}
            >
              New Opening
            </Button>
          )}
        </Box>
      </Box>

      {/* Job Cards/List View */}
      {viewMode === "card" ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(2, 1fr)",
              lg: "repeat(3, 1fr)",
            },
            gap: 3,
          }}
        >
          {filteredJobs.map((job) => {
            const candidateCount = job.candidates?.length || 0;
            
            return (
              <Card
                key={job.id}
                onClick={() => navigate(`/jobs/${job.id}`)}
                sx={{ 
                  cursor: "pointer",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  '&:hover': {
                    transform: "translateY(-4px)",
                    boxShadow: "0 12px 24px rgba(0,0,0,0.05)"
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  {/* Card Header */}
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                        {job.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {job.department || "No Dept"} &bull; {job.branch || "No Branch"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, display: 'block', mb: 2 }}>
                        {formatDate(job.start_date)} - {formatDate(job.expected_closing_date)}
                      </Typography>
                    </Box>
                    {canManageJob(job) && (
                      <IconButton 
                        onClick={(e) => handleMenuOpen(e, job)}
                      >
                        <MoreHoriz />
                      </IconButton>
                    )}
                  </Box>

                  {/* Candidates Count */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {candidateCount}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Candidates
                    </Typography>
                  </Box>

                  {/* Hiring Lead */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
                    <Avatar 
                      sx={{ width: 32, height: 32, bgcolor: 'primary.light', fontSize: '0.875rem' }}
                    >
                      {job.created_by?.email?.[0].toUpperCase() || 'U'}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {job.created_by?.email?.split('@')[0] || 'Unknown User'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Hiring Lead
                      </Typography>
                    </Box>
                  </Box>

                  {/* Tags */}
                  <Box sx={{ display: "flex", alignItems: "center", mt: "auto" }}>
                    <Stack direction="row" spacing={1}>
                      {job.tags?.map((tag, index) => (
                        <Chip 
                          key={index}
                          label={tag} 
                          size="small" 
                          sx={{ bgcolor: 'primary.light', color: 'primary.dark', fontWeight: 600 }} 
                        />
                      ))}
                    </Stack>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {filteredJobs.map((job) => {
            const candidateCount = job.candidates?.length || 0;
            
            return (
              <Card
                key={job.id}
                onClick={() => navigate(`/jobs/${job.id}`)}
                sx={{ 
                  cursor: "pointer",
                  transition: "box-shadow 0.2s",
                  '&:hover': {
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    {/* Left Section - Job Info */}
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                        {job.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {job.department || "No Dept"} &bull; {job.branch || "No Branch"}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        {job.tags?.map((tag, index) => (
                          <Chip 
                            key={index}
                            label={tag} 
                            size="small" 
                            sx={{ bgcolor: 'primary.light', color: 'primary.dark', fontWeight: 600 }} 
                          />
                        ))}
                      </Stack>
                    </Box>

                    {/* Middle Section - Hiring Lead */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 4 }}>
                      <Avatar 
                        sx={{ width: 32, height: 32, bgcolor: 'primary.light', fontSize: '0.875rem' }}
                      >
                        {job.created_by?.email?.[0].toUpperCase() || 'U'}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {job.created_by?.email?.split('@')[0] || 'Unknown User'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Hiring Lead
                        </Typography>
                      </Box>
                    </Box>

                    {/* Right Section - Stats and Actions */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Box sx={{ textAlign: "center" }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {candidateCount}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Candidates
                        </Typography>
                      </Box>
                      
                      <Box sx={{ textAlign: "right", minWidth: 120 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {formatDate(job.start_date)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {formatDate(job.expected_closing_date)}
                        </Typography>
                      </Box>

                      {canManageJob(job) && (
                        <IconButton 
                          onClick={(e) => handleMenuOpen(e, job)}
                        >
                          <MoreHoriz />
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {filteredJobs.length === 0 && jobs.length > 0 && (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No jobs match your search
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Try adjusting your search query
          </Typography>
        </Box>
      )}

      {jobs.length === 0 && (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No job openings found
          </Typography>
          <Button 
            variant="contained" 
            sx={{ mt: 2 }}
            onClick={() => navigate("/create-job")}
          >
            Create your first job
          </Button>
        </Box>
      )}

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
        <MenuItem onClick={handleAssignRecruiter}>
          Assign Recruiter
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          Delete Job
        </MenuItem>
      </Menu>

      {/* Edit Job Modal */}
      {selectedJob && (
        <EditJobModal
          job={selectedJob}
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onUpdate={() => {
            loadJobs();
            setSelectedJob(null);
          }}
        />
      )}

      {/* Assign Recruiter Modal */}
      {selectedJob && assignModalOpen && (
        <UserAssignmentModal
          jobId={selectedJob.id}
          currentAssignees={selectedJob.assignees || []}
          onClose={() => setAssignModalOpen(false)}
          onAssign={() => {
            loadJobs();
            setSelectedJob(null);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Job</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{selectedJob?.title}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
