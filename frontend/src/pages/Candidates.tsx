import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  Pagination,
  CircularProgress,
} from "@mui/material";
import { getCandidates, request } from "../api";
import { CandidateDetailsDrawer } from "../components/CandidateDetailsDrawer";

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
  job: {
    id: string;
    title: string;
  };
  profile_picture?: string;
}

export function Candidates() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchCandidates = async (pageNumber: number) => {
    setLoading(true);
    try {
      const response = await getCandidates(pageNumber);
      setCandidates(response.data);
      setTotalPages(response.totalPages);
      setPage(response.page);
    } catch (error) {
      console.error("Failed to fetch candidates:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates(page);
  }, [page]);

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleCandidateClick = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedCandidate(null);
    // Refresh list to show any status updates
    fetchCandidates(page);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "New":
        return "info";
      case "Reviewed":
        return "warning";
      case "Interviewing":
        return "primary";
      case "Offer":
        return "success";
      case "Hired":
        return "success";
      case "Rejected":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h4" fontWeight="bold">
          Candidates
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Job</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Applied Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {candidates.map((candidate) => (
                  <TableRow
                    key={candidate.id}
                    hover
                    onClick={() => handleCandidateClick(candidate)}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Avatar src={candidate.profile_picture ? `/api/candidates/${candidate.id}/profile-picture` : undefined}>
                          {candidate.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {candidate.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {candidate.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{candidate.job?.title || "N/A"}</TableCell>
                    <TableCell>
                      <Chip
                        label={candidate.status}
                        size="small"
                        color={getStatusColor(candidate.status) as any}
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(candidate.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
                {candidates.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No candidates found</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
              shape="rounded"
            />
          </Box>
        </>
      )}

      {selectedCandidate && (
        <CandidateDetailsDrawer
          candidate={selectedCandidate as any}
          open={drawerOpen}
          onClose={handleDrawerClose}
          onStatusChange={async (id: string, status: string) => {
            try {
              await request(`/candidates/${id}/status`, {
                method: "PATCH",
                body: JSON.stringify({ status }),
              });
              fetchCandidates(page);
            } catch (error) {
              console.error("Failed to update status:", error);
            }
          }}
          onUpdate={() => fetchCandidates(page)}
          statuses={[
            { value: "new", label: "New" },
            { value: "reviewed", label: "Reviewed" },
            { value: "interviewing", label: "Interviewing" },
            { value: "offer", label: "Offer" },
            { value: "hired", label: "Hired" },
            { value: "rejected", label: "Rejected" },
          ]}
        />
      )}
    </Box>
  );
}
