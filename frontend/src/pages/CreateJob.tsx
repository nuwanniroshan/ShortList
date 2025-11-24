import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { request } from "../api";
import { useSnackbar } from "../context/SnackbarContext";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { Save, ArrowBack } from "@mui/icons-material";

export function CreateJob() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState("");
  const [branch, setBranch] = useState("");
  const [tags, setTags] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedClosingDate, setExpectedClosingDate] = useState("");
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const [error, setError] = useState<string | null>(null); // Added

  const [departmentsList, setDepartmentsList] = useState<any[]>([]);
  const [branchesList, setBranchesList] = useState<any[]>([]);
  const [recruitersList, setRecruitersList] = useState<any[]>([]);
  const [selectedRecruiters, setSelectedRecruiters] = useState<string[]>([]);

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      const [deps, offs, users] = await Promise.all([
        request("/departments"),
        request("/offices"),
        request("/users"),
      ]);
      setDepartmentsList(deps);
      setBranchesList(offs);
      // Filter only recruiters
      const recruiters = users.filter((u: any) => u.role === "recruiter");
      setRecruitersList(recruiters);
    } catch (err) {
      console.error(err);
      setError("Failed to load options.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors

    // Validate dates
    if (new Date(expectedClosingDate) <= new Date(startDate)) {
      showSnackbar("Expected closing date must be after start date", "error");
      setError("Expected closing date must be after start date");
      return;
    }
    
    try {
      await request("/jobs", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          department,
          branch,
          tags: tags.split(",").map(t => t.trim()).filter(t => t),
          start_date: startDate,
          expected_closing_date: expectedClosingDate,
          assigneeIds: selectedRecruiters,
        }),
      });
      showSnackbar("Job created successfully!", "success");
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to create job");
      showSnackbar("Failed to create job", "error");
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate("/dashboard")}
        sx={{ mb: 2 }}
      >
        Back to Dashboard
      </Button>

      <Typography variant="h4" gutterBottom>
        Create New Job
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
              placeholder="e.g., Senior Frontend Developer"
            />
            <TextField
              fullWidth
              label="Job Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              multiline
              rows={6}
              margin="normal"
              placeholder="Describe the role, responsibilities, and requirements..."
            />
            
            <Box sx={{ display: "flex", gap: 2 }}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Department</InputLabel>
                <Select
                  value={department}
                  label="Department"
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  {departmentsList.map((dep) => (
                    <MenuItem key={dep.id} value={dep.name}>
                      {dep.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal">
                <InputLabel>Branch</InputLabel>
                <Select
                  value={branch}
                  label="Branch"
                  onChange={(e) => setBranch(e.target.value)}
                >
                  {branchesList.map((off) => (
                    <MenuItem key={off.id} value={off.name}>
                      {off.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <TextField
              fullWidth
              label="Tags (comma separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              margin="normal"
              helperText="e.g. Remote, Urgent, Senior"
            />

            <FormControl fullWidth margin="normal">
              <InputLabel>Assign Recruiters</InputLabel>
              <Select
                multiple
                value={selectedRecruiters}
                label="Assign Recruiters"
                onChange={(e) => setSelectedRecruiters(e.target.value as string[])}
                renderValue={(selected) => 
                  selected.map(id => 
                    recruitersList.find(r => r.id === id)?.email || id
                  ).join(", ")
                }
              >
                {recruitersList.map((recruiter) => (
                  <MenuItem key={recruiter.id} value={recruiter.id}>
                    {recruiter.email} {recruiter.name ? `(${recruiter.name})` : ""}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                margin="normal"
                InputLabelProps={{ shrink: true }}
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
                onClick={() => navigate("/dashboard")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<Save />}
              >
                Create Job
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
