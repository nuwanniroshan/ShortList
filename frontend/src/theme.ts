import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563EB', // Bright Blue for primary actions (like "New Opening")
      light: '#60A5FA',
      dark: '#1E40AF',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#64748B', // Slate gray for secondary text/icons
      light: '#94A3B8',
      dark: '#475569',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F8FAFC', // Very light gray/blueish background
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1E293B', // Dark slate for primary text
      secondary: '#64748B', // Lighter slate for secondary text
    },
    divider: '#E2E8F0',
    success: {
      main: '#10B981', // Green for "Fulltime" etc
      light: '#D1FAE5',
    },
    warning: {
      main: '#F59E0B', // Orange for "Remote" etc
      light: '#FEF3C7',
    },
    info: {
      main: '#3B82F6', // Blue for "Day Shift" etc
      light: '#DBEAFE',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      color: '#1E293B',
      fontSize: '1.75rem',
    },
    h6: {
      fontWeight: 600,
      color: '#1E293B',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
    body1: {
      color: '#334155',
    },
    body2: {
      color: '#64748B',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
        },
        containedPrimary: {
          backgroundColor: '#2563EB',
          '&:hover': {
            backgroundColor: '#1D4ED8',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
          border: '1px solid #E2E8F0', // Subtle border instead of shadow
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
          fontSize: '0.75rem',
          height: '24px',
        },
        filled: {
          backgroundColor: '#F1F5F9',
          color: '#475569',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          color: '#1E293B',
          boxShadow: 'none',
          borderBottom: '1px solid #E2E8F0',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid #E2E8F0',
        },
      },
    },
  },
});