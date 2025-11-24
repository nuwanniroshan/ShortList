import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { CreateJob } from "./pages/CreateJob";
import { EditJob } from "./pages/EditJob";
import { JobDetails } from "./pages/JobDetails";
import { AdminUsers } from "./pages/AdminUsers";
import { Settings } from "./pages/Settings";
import { AddCandidate } from "./pages/AddCandidate";
import { SnackbarProvider } from "./context/SnackbarContext";
import { Layout } from "./components/Layout";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { theme } from "./theme";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
            <Route path="/create-job" element={<Layout><CreateJob /></Layout>} />
            <Route path="/jobs/:id" element={<Layout><JobDetails /></Layout>} />
            <Route path="/jobs/:id/add-candidate" element={<Layout><AddCandidate /></Layout>} />
            <Route path="/jobs/:id/edit" element={<Layout><EditJob /></Layout>} />
            <Route path="/admin/users" element={<Layout><AdminUsers /></Layout>} />
            <Route path="/settings" element={<Layout><Settings /></Layout>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
