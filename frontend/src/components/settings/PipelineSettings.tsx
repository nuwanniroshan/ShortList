import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Divider
} from "@mui/material";
import { Add, Edit, Delete, ArrowUpward, ArrowDownward } from "@mui/icons-material";
import { request } from "../../api";
import { useSnackbar } from "../../context/SnackbarContext";

interface PipelineStatus {
  id: string;
  value: string;
  label: string;
  order: number;
}

export function PipelineSettings() {
  const [statuses, setStatuses] = useState<PipelineStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingStatus, setEditingStatus] = useState<PipelineStatus | null>(null);
  const [formData, setFormData] = useState({ value: "", label: "" });
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    loadStatuses();
  }, []);

  const loadStatuses = async () => {
    try {
      setLoading(true);
      const data = await request("/pipeline-statuses");
      setStatuses(data);
    } catch (err) {
      showSnackbar("Failed to load pipeline statuses", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (status?: PipelineStatus) => {
    if (status) {
      setEditingStatus(status);
      setFormData({ value: status.value, label: status.label });
    } else {
      setEditingStatus(null);
      setFormData({ value: "", label: "" });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingStatus(null);
    setFormData({ value: "", label: "" });
  };

  const handleSubmit = async () => {
    try {
      if (editingStatus) {
        await request(`/pipeline-statuses/${editingStatus.id}`, {
          method: "PATCH",
          body: JSON.stringify({ label: formData.label }),
        });
        showSnackbar("Status updated successfully", "success");
      } else {
        // Calculate next order
        const maxOrder = Math.max(...statuses.map(s => s.order), -1);
        await request("/pipeline-statuses", {
          method: "POST",
          body: JSON.stringify({
            value: formData.value,
            label: formData.label,
            order: maxOrder + 1,
          }),
        });
        showSnackbar("Status created successfully", "success");
      }
      loadStatuses();
      handleCloseDialog();
    } catch (err: any) {
      showSnackbar(err.message || "Failed to save status", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this status?")) return;
    try {
      await request(`/pipeline-statuses/${id}`, { method: "DELETE" });
      showSnackbar("Status deleted successfully", "success");
      loadStatuses();
    } catch (err: any) {
      showSnackbar(err.message || "Failed to delete status", "error");
    }
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === statuses.length - 1) return;

    const newStatuses = [...statuses];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    
    // Swap order values
    const tempOrder = newStatuses[index].order;
    newStatuses[index].order = newStatuses[targetIndex].order;
    newStatuses[targetIndex].order = tempOrder;

    // Swap positions in array
    [newStatuses[index], newStatuses[targetIndex]] = [newStatuses[targetIndex], newStatuses[index]];
    
    setStatuses(newStatuses); // Optimistic update

    try {
      await request("/pipeline-statuses/order", {
        method: "PUT",
        body: JSON.stringify({
          orders: newStatuses.map(s => ({ id: s.id, order: s.order }))
        }),
      });
    } catch (err) {
      showSnackbar("Failed to update order", "error");
      loadStatuses(); // Revert on error
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h6">Pipeline Stages</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add Stage
        </Button>
      </Box>

      <Paper variant="outlined">
        <List>
          {statuses.map((status, index) => (
            <div key={status.id}>
              <ListItem>
                <ListItemText
                  primary={status.label}
                  secondary={`Value: ${status.value}`}
                />
                <ListItemSecondaryAction>
                  <IconButton 
                    onClick={() => handleMove(index, "up")} 
                    disabled={index === 0}
                    size="small"
                    sx={{ 
                      borderRadius: 1,
                      width: 32,
                      height: 32
                    }}
                  >
                    <ArrowUpward fontSize="small" />
                  </IconButton>
                  <IconButton 
                    onClick={() => handleMove(index, "down")} 
                    disabled={index === statuses.length - 1}
                    size="small"
                    sx={{ 
                      borderRadius: 1,
                      width: 32,
                      height: 32
                    }}
                  >
                    <ArrowDownward fontSize="small" />
                  </IconButton>
                  <IconButton 
                    onClick={() => handleOpenDialog(status)} 
                    size="small" 
                    sx={{ 
                      ml: 1,
                      borderRadius: 1,
                      width: 32,
                      height: 32
                    }}
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton 
                    onClick={() => handleDelete(status.id)} 
                    size="small" 
                    color="error"
                    sx={{ 
                      borderRadius: 1,
                      width: 32,
                      height: 32
                    }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
              {index < statuses.length - 1 && <Divider />}
            </div>
          ))}
          {statuses.length === 0 && !loading && (
            <ListItem>
              <ListItemText primary="No pipeline stages defined" />
            </ListItem>
          )}
        </List>
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingStatus ? "Edit Stage" : "Add New Stage"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Stage Label"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Internal Value (ID)"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              fullWidth
              required
              disabled={!!editingStatus}
              helperText={editingStatus ? "Cannot be changed after creation" : "Unique identifier for this stage (e.g., 'phone_screen')"}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.label || !formData.value}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
