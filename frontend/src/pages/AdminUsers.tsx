import { useEffect, useState } from "react";
import { request } from "../api";
import { useSnackbar } from "../context/SnackbarContext";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Chip,
} from "@mui/material";
import { Delete, ArrowBack, Add, Block, CheckCircle } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

interface User {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
}

interface AdminUsersProps {
  embedded?: boolean;
}

export function AdminUsers({ embedded = false }: AdminUsersProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("engineering_manager");
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await request("/users");
      setUsers(data);
    } catch (err) {
      showSnackbar("Failed to load users", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await request(`/users/${id}`, { method: "DELETE" });
      loadUsers();
      showSnackbar("User deleted successfully", "success");
    } catch (err) {
      showSnackbar("Failed to delete user", "error");
    }
  };

  const handleRoleChange = async (id: string, newRole: string) => {
    try {
      await request(`/users/${id}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole }),
      });
      loadUsers();
      showSnackbar("Role updated successfully", "success");
    } catch (err) {
      showSnackbar("Failed to update role", "error");
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await request(`/users/${id}/toggle-active`, { method: "PATCH" });
      loadUsers();
      showSnackbar("User status updated", "success");
    } catch (err) {
      showSnackbar("Failed to update user status", "error");
    }
  };

  const handleAddUser = async () => {
    try {
      await request("/auth/register", {
        method: "POST",
        body: JSON.stringify({ 
          email: newUserEmail, 
          password: newUserPassword, 
          role: newUserRole 
        }),
      });
      showSnackbar("User created successfully", "success");
      setOpenAddModal(false);
      setNewUserEmail("");
      setNewUserPassword("");
      loadUsers();
    } catch (err: any) {
      showSnackbar(err.message || "Failed to create user", "error");
    }
  };

  return (
    <Box sx={{ maxWidth: embedded ? "100%" : 1200, mx: "auto", p: embedded ? 0 : 3 }}>
      {!embedded && (
        <IconButton
          onClick={() => navigate("/dashboard")}
          sx={{ 
            mb: 2,
            borderRadius: 1,
            width: 40,
            height: 40
          }}
        >
          <ArrowBack />
        </IconButton>
      )}

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h5" gutterBottom={!embedded}>
          User Management
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<Add />}
          onClick={() => setOpenAddModal(true)}
        >
          Add User
        </Button>
      </Box>

      <Card variant={embedded ? "outlined" : "elevation"}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Typography variant="body1">
                        {user.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        size="small"
                        sx={{ minWidth: 150 }}
                      >
                        <MenuItem value="admin">Admin</MenuItem>
                        <MenuItem value="hr">HR</MenuItem>
                        <MenuItem value="engineering_manager">
                          Engineering Manager
                        </MenuItem>
                        <MenuItem value="recruiter">Recruiter</MenuItem>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={user.is_active ? "Active" : "Disabled"} 
                        color={user.is_active ? "success" : "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={() => handleToggleActive(user.id)}
                        title={user.is_active ? "Disable User" : "Enable User"}
                        color={user.is_active ? "default" : "success"}
                        sx={{ 
                          borderRadius: 1,
                          width: 40,
                          height: 40
                        }}
                      >
                        {user.is_active ? <Block /> : <CheckCircle />}
                      </IconButton>
                      <IconButton
                        onClick={() => handleDelete(user.id)}
                        color="error"
                        title="Delete User"
                        sx={{ 
                          borderRadius: 1,
                          width: 40,
                          height: 40
                        }}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {users.length === 0 && (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                No users found
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog open={openAddModal} onClose={() => setOpenAddModal(false)}>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={newUserPassword}
            onChange={(e) => setNewUserPassword(e.target.value)}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Role</InputLabel>
            <Select
              value={newUserRole}
              label="Role"
              onChange={(e) => setNewUserRole(e.target.value)}
            >
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="hr">HR</MenuItem>
              <MenuItem value="engineering_manager">Engineering Manager</MenuItem>
              <MenuItem value="recruiter">Recruiter</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddModal(false)}>Cancel</Button>
          <Button onClick={handleAddUser} variant="contained">Create User</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
