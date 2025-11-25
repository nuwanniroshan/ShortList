import { useState } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
} from "@mui/material";
import { ProfileSettings } from "../components/settings/ProfileSettings";
import { OrganizationSettings } from "../components/settings/OrganizationSettings";
import { PipelineSettings } from "../components/settings/PipelineSettings";
import { AdminUsers } from "./AdminUsers";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export function Settings() {
  const [value, setValue] = useState(0);
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.role === "admin";
  const isHR = user.role === "hr";

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto" }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Settings
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={value} onChange={handleChange}>
          <Tab label="Profile" />
          {(isAdmin || isHR) && <Tab label="Organization" />}
          {isAdmin && <Tab label="User Management" />}
          {isAdmin && <Tab label="Pipeline" />}
        </Tabs>
      </Box>

      <TabPanel value={value} index={0}>
        <Card>
          <CardContent>
            <ProfileSettings />
          </CardContent>
        </Card>
      </TabPanel>

      {(isAdmin || isHR) && (
        <TabPanel value={value} index={1}>
          <Card>
            <CardContent>
              <OrganizationSettings />
            </CardContent>
          </Card>
        </TabPanel>
      )}

      {isAdmin && (
        <TabPanel value={value} index={2}>
          <AdminUsers embedded />
        </TabPanel>
      )}

      {isAdmin && (
        <TabPanel value={value} index={3}>
          <Card>
            <CardContent>
              <PipelineSettings />
            </CardContent>
          </Card>
        </TabPanel>
      )}
    </Box>
  );
}
