import { useState, useEffect } from "react";
import { request } from "../../api";
import { useSnackbar } from "../../context/SnackbarContext";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { Delete, Add, Business, Domain } from "@mui/icons-material";

export function OrganizationSettings() {
  const [offices, setOffices] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [openOfficeModal, setOpenOfficeModal] = useState(false);
  const [openDeptModal, setOpenDeptModal] = useState(false);
  const { showSnackbar } = useSnackbar();

  // Office Form State
  const [officeName, setOfficeName] = useState("");
  const [officeAddress, setOfficeAddress] = useState("");
  const [officeType, setOfficeType] = useState("branch");

  // Dept Form State
  const [deptName, setDeptName] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [offs, deps] = await Promise.all([
        request("/offices"),
        request("/departments"),
      ]);
      setOffices(offs);
      setDepartments(deps);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddOffice = async () => {
    try {
      await request("/offices", {
        method: "POST",
        body: JSON.stringify({
          name: officeName,
          address: officeAddress,
          type: officeType,
        }),
      });
      showSnackbar("Office added successfully", "success");
      setOpenOfficeModal(false);
      setOfficeName("");
      setOfficeAddress("");
      loadData();
    } catch (err) {
      showSnackbar("Failed to add office", "error");
    }
  };

  const handleDeleteOffice = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await request(`/offices/${id}`, { method: "DELETE" });
      showSnackbar("Office deleted", "success");
      loadData();
    } catch (err) {
      showSnackbar("Failed to delete office", "error");
    }
  };

  const handleAddDept = async () => {
    try {
      await request("/departments", {
        method: "POST",
        body: JSON.stringify({ name: deptName }),
      });
      showSnackbar("Department added successfully", "success");
      setOpenDeptModal(false);
      setDeptName("");
      loadData();
    } catch (err) {
      showSnackbar("Failed to add department", "error");
    }
  };

  const handleDeleteDept = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await request(`/departments/${id}`, { method: "DELETE" });
      showSnackbar("Department deleted", "success");
      loadData();
    } catch (err) {
      showSnackbar("Failed to delete department", "error");
    }
  };

  return (
    <Grid container spacing={4}>
      {/* Offices Section */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h6" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Business /> Offices & Branches
          </Typography>
          <Button startIcon={<Add />} onClick={() => setOpenOfficeModal(true)}>
            Add Office
          </Button>
        </Box>
        <List sx={{ bgcolor: "background.paper", borderRadius: 1 }}>
          {offices.map((office) => (
            <ListItem key={office.id} divider>
              <ListItemText
                primary={office.name}
                secondary={`${office.type} • ${office.address || "No address"}`}
              />
              <ListItemSecondaryAction>
                <IconButton 
                  edge="end" 
                  onClick={() => handleDeleteOffice(office.id)}
                  sx={{ 
                    borderRadius: 1,
                    width: 40,
                    height: 40
                  }}
                >
                  <Delete />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
          {offices.length === 0 && (
            <ListItem>
              <ListItemText secondary="No offices found" />
            </ListItem>
          )}
        </List>
      </Grid>

      {/* Departments Section */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h6" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Domain /> Departments
          </Typography>
          <Button startIcon={<Add />} onClick={() => setOpenDeptModal(true)}>
            Add Department
          </Button>
        </Box>
        <List sx={{ bgcolor: "background.paper", borderRadius: 1 }}>
          {departments.map((dept) => (
            <ListItem key={dept.id} divider>
              <ListItemText primary={dept.name} />
              <ListItemSecondaryAction>
                <IconButton 
                  edge="end" 
                  onClick={() => handleDeleteDept(dept.id)}
                  sx={{ 
                    borderRadius: 1,
                    width: 40,
                    height: 40
                  }}
                >
                  <Delete />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
          {departments.length === 0 && (
            <ListItem>
              <ListItemText secondary="No departments found" />
            </ListItem>
          )}
        </List>
      </Grid>

      {/* Add Office Modal */}
      <Dialog open={openOfficeModal} onClose={() => setOpenOfficeModal(false)}>
        <DialogTitle>Add New Office</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Office Name"
            value={officeName}
            onChange={(e) => setOfficeName(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Address"
            value={officeAddress}
            onChange={(e) => setOfficeAddress(e.target.value)}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Type</InputLabel>
            <Select
              value={officeType}
              label="Type"
              onChange={(e) => setOfficeType(e.target.value)}
            >
              <MenuItem value="headquarters">Headquarters</MenuItem>
              <MenuItem value="branch">Branch</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenOfficeModal(false)}>Cancel</Button>
          <Button onClick={handleAddOffice} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>

      {/* Add Department Modal */}
      <Dialog open={openDeptModal} onClose={() => setOpenDeptModal(false)}>
        <DialogTitle>Add New Department</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Department Name"
            value={deptName}
            onChange={(e) => setDeptName(e.target.value)}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeptModal(false)}>Cancel</Button>
          <Button onClick={handleAddDept} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
}
