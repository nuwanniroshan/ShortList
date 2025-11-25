import { useState, type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  IconButton,
  useTheme,
  Avatar,
  InputBase,
  Badge,
  Menu,
  MenuItem,
  Divider,
  Breadcrumbs,
  Link,
  Popover
} from "@mui/material";
import { 
  Menu as MenuIcon, 
  Dashboard as DashboardIcon, 
  Work as WorkIcon, 
  People as PeopleIcon, 
  Settings as SettingsIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Lightbulb as LightbulbIcon,
  Language as LanguageIcon,
} from "@mui/icons-material";
import { useNotifications } from "../context/NotificationContext";
import { NotificationList } from "./NotificationList";

interface LayoutProps {
  children: ReactNode;
}

const DRAWER_WIDTH = 260;
const COLLAPSED_DRAWER_WIDTH = 72;

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);
  const theme = useTheme();
  // const isMobile = useMediaQuery(theme.breakpoints.down("md")); // Unused for now
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed] = useState(false); // Fixed to false for now as button is removed
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);
  const { unreadCount, markAllAsRead } = useNotifications();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // const handleCollapseToggle = () => {
  //   setIsCollapsed(!isCollapsed);
  // };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    localStorage.clear();
    navigate("/");
  };

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
    // Mark all unread notifications as read when panel opens
    if (unreadCount > 0) {
      markAllAsRead();
    }
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };



  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    { text: "Jobs", icon: <WorkIcon />, path: "/dashboard" },
    { text: "Candidates", icon: <PeopleIcon />, path: "/candidates" },
    { text: "Settings", icon: <SettingsIcon />, path: "/settings" },
  ];

  const drawerContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: "#fff" }}>
      <Box sx={{ p: 3, display: "flex", alignItems: "center", justifyContent: isCollapsed ? "center" : "space-between" }}>
        {!isCollapsed && (
          <Typography variant="h6" color="text.primary" sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1.5, fontSize: '1.25rem' }}>
            Shortlist
          </Typography>
        )}
        {isCollapsed && (
           <Box component="span" sx={{ bgcolor: "primary.main", width: 24, height: 24, borderRadius: 1, display: "inline-block" }} />
        )}
      </Box>

      <Box sx={{ px: 3, py: 2 }}>
        {!isCollapsed && (
          <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, letterSpacing: 1, mb: 2, display: "block" }}>
            MAIN
          </Typography>
        )}
        <List sx={{ p: 0 }}>
          {menuItems.map((item) => {
            const isSelected = location.pathname === item.path;
            return (
              <ListItem key={item.text} disablePadding sx={{ display: "block", mb: 1 }}>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  selected={isSelected}
                  sx={{
                    minHeight: 44,
                    justifyContent: isCollapsed ? "center" : "initial",
                    px: 2,
                    borderRadius: 2,
                    bgcolor: "transparent",
                    "&.Mui-selected": {
                      bgcolor: "transparent",
                      color: "primary.main",
                      "& .MuiListItemIcon-root": {
                        color: "primary.main",
                      },
                      "& .MuiTypography-root": {
                        fontWeight: 600,
                      },
                    },
                    "&:hover": {
                      bgcolor: "action.hover",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: isCollapsed ? 0 : 2,
                      justifyContent: "center",
                      color: isSelected ? "primary.main" : "text.secondary",
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{ 
                      fontSize: '0.95rem',
                      fontWeight: isSelected ? 600 : 500,
                      color: isSelected ? "primary.main" : "text.secondary"
                    }}
                    sx={{ opacity: isCollapsed ? 0 : 1 }} 
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      
      <Box sx={{ mt: "auto", p: 2 }}>
          {!isCollapsed && (
            <Box sx={{ p: 2, bgcolor: "background.default", borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold">Need Help?</Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                    Check our docs
                </Typography>
                <Button variant="contained" fullWidth size="small">Documentation</Button>
            </Box>
          )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${isCollapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH}px)` },
          ml: { md: `${isCollapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH}px` },
          transition: theme.transitions.create(["width", "margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { md: "none" },
              borderRadius: 1,
              width: 40,
              height: 40
            }}
          >
            <MenuIcon />
          </IconButton>
          
          {/* Search Bar */}
          <Box sx={{ 
            position: 'relative', 
            borderRadius: 4, 
            bgcolor: 'background.default', 
            mr: 2, 
            ml: 0, 
            width: '100%', 
            maxWidth: 400,
            display: 'flex',
            alignItems: 'center',
            px: 2,
            py: 0.5
          }}>
            <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
            <InputBase
              placeholder="Search"
              inputProps={{ 'aria-label': 'search' }}
              sx={{ width: '100%' }}
            />
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton 
              size="small"
              sx={{ 
                borderRadius: 1,
                width: 32,
                height: 32
              }}
            >
              <LanguageIcon fontSize="small" />
            </IconButton>
            <IconButton 
              size="small"
              sx={{ 
                borderRadius: 1,
                width: 32,
                height: 32
              }}
            >
              <LightbulbIcon fontSize="small" />
            </IconButton>
            <IconButton 
              size="small"
              onClick={handleNotificationClick}
              sx={{ 
                borderRadius: 1,
                width: 32,
                height: 32
              }}
            >
                <Badge badgeContent={unreadCount} color="error">
                    <NotificationsIcon fontSize="small" />
                </Badge>
            </IconButton>
            <Popover
              open={Boolean(notificationAnchorEl)}
              anchorEl={notificationAnchorEl}
              onClose={handleNotificationClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              PaperProps={{
                elevation: 3,
                sx: { mt: 1.5 }
              }}
            >
              <NotificationList />
            </Popover>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: 2 }}>
                <IconButton 
                  onClick={handleMenuOpen} 
                  size="small" 
                  sx={{ 
                    p: 0,
                    borderRadius: 1, 
                  }}
                >
                  <Avatar 
                    variant="rounded"
                    sx={{ 
                      width: 32, 
                      height: 32, 
                      bgcolor: "primary.main",
                      borderRadius: 1
                    }}
                  >
                      {user.email ? user.email[0].toUpperCase() : "U"}
                  </Avatar>
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                  onClick={handleMenuClose}
                  PaperProps={{
                    elevation: 0,
                    sx: {
                      overflow: 'visible',
                      filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                      mt: 1.5,
                      '& .MuiAvatar-root': {
                        width: 32,
                        height: 32,
                        ml: -0.5,
                        mr: 1,
                      },
                      '&:before': {
                        content: '""',
                        display: 'block',
                        position: 'absolute',
                        top: 0,
                        right: 14,
                        width: 10,
                        height: 10,
                        bgcolor: 'background.paper',
                        transform: 'translateY(-50%) rotate(45deg)',
                        zIndex: 0,
                      },
                      minWidth: 220,
                    },
                  }}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <MenuItem onClick={() => navigate("/settings")}>
                    Profile
                  </MenuItem>
                  <MenuItem onClick={() => navigate("/settings")}>
                    Settings
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={handleLogout}>
                    Logout
                  </MenuItem>
                </Menu>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: isCollapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: DRAWER_WIDTH },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: isCollapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH,
              transition: theme.transitions.create("width", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              overflowX: "hidden",
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${isCollapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH}px)` },
          mt: 8,
        }}
      >
        <Box sx={{ mb: 2 }}>
          <Breadcrumbs aria-label="breadcrumb">
            <Link underline="hover" color="inherit" href="/dashboard" onClick={(e) => { e.preventDefault(); navigate("/dashboard"); }}>
              Home
            </Link>
            {pathnames.map((value, index) => {
              const last = index === pathnames.length - 1;
              const to = `/${pathnames.slice(0, index + 1).join('/')}`;
              const name = value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' ');

              return last ? (
                <Typography color="text.primary" key={to}>
                  {name}
                </Typography>
              ) : (
                <Link underline="hover" color="inherit" href={to} onClick={(e) => { e.preventDefault(); navigate(to); }} key={to}>
                  {name}
                </Link>
              );
            })}
          </Breadcrumbs>
        </Box>
        {children}
      </Box>
    </Box>
  );
}
