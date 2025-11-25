import { Box, List, ListItem, ListItemText, Typography, Divider, Chip } from '@mui/material';
import { useNotifications } from '../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

export function NotificationList() {
  const { notifications, markAsRead } = useNotifications();

  const handleNotificationClick = (id: number) => {
    markAsRead(id);
  };

  // Limit to 30 most recent notifications
  const recentNotifications = notifications.slice(0, 30);

  return (
    <Box sx={{ width: 380, maxHeight: 500, overflow: 'auto' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight={600}>Notifications</Typography>
      </Box>
      
      {recentNotifications.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">No notifications</Typography>
        </Box>
      ) : (
        <List sx={{ p: 0 }}>
          {recentNotifications.map((notification, index) => (
            <Box key={notification.id}>
              <ListItem
                onClick={() => handleNotificationClick(notification.id)}
                sx={{
                  cursor: 'pointer',
                  bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                  '&:hover': { bgcolor: 'action.selected' },
                  py: 2
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="body2" fontWeight={notification.isRead ? 400 : 600}>
                        {notification.message}
                      </Typography>
                      {!notification.isRead && (
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            flexShrink: 0
                          }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Chip 
                        label={notification.type.replace('_', ' ')} 
                        size="small" 
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
              {index < notifications.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      )}
    </Box>
  );
}
