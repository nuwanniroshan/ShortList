import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { request } from "../api";
import { useSnackbar } from "../context/SnackbarContext";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Save, ArrowBack } from "@mui/icons-material";

export function EditJob() {
  const { id } = useParams();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState("");
  const [branch, setBranch] = useState("");
  const [tags, setTags] = useState("");
  const [startDate, setStartDate] = useState("");
  const [expectedClosingDate, setExpectedClosingDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    loadJob();
  }, [id]);

  const loadJob = async () => {
    try {
      const data = await request(`/jobs/${id}`);
      setTitle(data.title);
      setDescription(data.description);
      setDepartment(data.department || "");
      setBranch(data.branch || "");
      setTags(data.tags ? data.tags.join(", ") : "");
      setStartDate(data.start_date ? new Date(data.start_date).toISOString().split('T')[0] : "");
      setExpectedClosingDate(data.expected_closing_date ? new Date(data.expected_closing_date).toISOString().split('T')[0] : ""); // Modified based on diff, but kept original robustness
      setLoading(false);
    } catch (err: any) { // Modified error handling
      setError(err.message); // Modified error handling
      showSnackbar("Failed to load job", "error"); // Kept snackbar for consistency
      navigate("/dashboard"); // Kept original navigation
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate dates
    if (new Date(expectedClosingDate) <= new Date(startDate)) {
      showSnackbar("Expected closing date must be after start date", "error");
      return;
    }
    
    try {
      await request(`/jobs/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          title,
          description,
          department,
          branch,
          tags: tags.split(",").map(t => t.trim()).filter(t => t),
          expected_closing_date: expectedClosingDate,
        }),
      });
      showSnackbar("Job updated successfully!", "success");
      navigate(`/jobs/${id}`); // Kept original navigation
    } catch (err: any) { // Modified error handling
      setError(err.message); // Modified error handling
      showSnackbar("Failed to update job", "error"); // Kept snackbar for consistency
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(`/jobs/${id}`)}
        sx={{ mb: 2 }}
      >
        Back to Job
      </Button>

      <Typography variant="h4" gutterBottom>
        Edit Job
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>} {/* Added */}
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Job Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              margin="normal"
            />
            {/* Removed original Department and Branch TextFields */}
            <TextField
              fullWidth
              label="Job Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              multiline
              rows={6}
              margin="normal"
            />
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={startDate}
                disabled
                margin="normal"
                InputLabelProps={{ shrink: true }}
                helperText="Start date cannot be changed"
              />
              <TextField
                fullWidth
                label="Expected Closing Date"
                type="date"
                value={expectedClosingDate}
                onChange={(e) => setExpectedClosingDate(e.target.value)}
                required
                margin="normal"
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: startDate }}
              />
            </Box>
            <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mt: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate(`/jobs/${id}`)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<Save />}
              >
                Save Changes
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
