import { useState, useEffect } from "react";
import { request } from "../../api";
import { useSnackbar } from "../../context/SnackbarContext";
import {
  Box,
  TextField,
  Button,
  Typography,
  Avatar,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { Save } from "@mui/icons-material";

export function ProfileSettings() {
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [officeLocation, setOfficeLocation] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [departments, setDepartments] = useState<any[]>([]);
  const [offices, setOffices] = useState<any[]>([]);
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      // In a real app, we might want to fetch the latest user data from API
      // For now, let's assume we can get it or just use what we have, but better to fetch
      // Since we don't have a "me" endpoint, let's use the list and filter (not ideal but works for now)
      // Or better, let's just use the local storage and update it.
      // Actually, we should probably fetch the user list to find ourselves if we want fresh data
      // But for simplicity, let's rely on local storage for ID and then maybe fetch if needed.
      // Wait, we added updateProfile but not getProfile. Let's assume we can use the user object from login for now
      // and maybe we should have added a /me endpoint.
      // Let's just use the stored user and update it on save.
      
      setUser(userData);
      setName(userData.name || "");
      setDepartment(userData.department || "");
      setOfficeLocation(userData.office_location || "");
      setProfilePicture(userData.profile_picture || "");

      const deps = await request("/departments");
      setDepartments(deps);
      const offs = await request("/offices");
      setOffices(offs);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    try {
      const updatedUser = await request(`/users/${user.id}/profile`, {
        method: "PATCH",
        body: JSON.stringify({
          name,
          department,
          office_location: officeLocation,
          profile_picture: profilePicture,
        }),
      });
      
      // Update local storage
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem("user", JSON.stringify({ ...currentUser, ...updatedUser }));
      
      showSnackbar("Profile updated successfully", "success");
    } catch (err) {
      showSnackbar("Failed to update profile", "error");
    }
  };

  if (!user) return null;

  return (
    <Box sx={{ maxWidth: 600 }}>
      <Typography variant="h6" gutterBottom>
        Personal Information
      </Typography>
      
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
        <Avatar
          src={profilePicture}
          sx={{ width: 80, height: 80, bgcolor: "primary.main" }}
        >
          {name?.[0] || user.email?.[0]}
        </Avatar>
        <TextField
          label="Profile Picture URL"
          value={profilePicture}
          onChange={(e) => setProfilePicture(e.target.value)}
          size="small"
          fullWidth
        />
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth>
            <InputLabel>Department</InputLabel>
            <Select
              value={department}
              label="Department"
              onChange={(e) => setDepartment(e.target.value)}
            >
              {departments.map((dep) => (
                <MenuItem key={dep.id} value={dep.name}>
                  {dep.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth>
            <InputLabel>Office Location</InputLabel>
            <Select
              value={officeLocation}
              label="Office Location"
              onChange={(e) => setOfficeLocation(e.target.value)}
            >
              {offices.map((off) => (
                <MenuItem key={off.id} value={off.name}>
                  {off.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
          >
            Save Changes
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}
