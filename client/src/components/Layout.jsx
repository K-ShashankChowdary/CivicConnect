import { Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import Container from '@mui/material/Container';

import { useAuth } from '../context/AuthContext.jsx';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorElUser, setAnchorElUser] = useState(null);

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', flexDirection: 'column', bgcolor: 'background.default' }}>
      <AppBar 
        position="static" 
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 } }}>
          <Toolbar disableGutters sx={{ display: 'flex', justifyContent: 'space-between', py: { xs: 1, sm: 1.5 }, minHeight: { xs: 56, sm: 64 } }}>
            <Typography
              variant="h6"
              noWrap
              component="a"
              href="/"
              sx={{
                mr: 2,
                display: { xs: 'none', sm: 'flex' },
                fontWeight: 700,
                letterSpacing: '0.02em',
                color: 'white',
                textDecoration: 'none',
                alignItems: 'center',
                fontSize: { sm: '1.1rem', md: '1.25rem' },
              }}
            >
              CivicConnect
            </Typography>
            <Typography
              variant="subtitle1"
              noWrap
              component="a"
              href="/"
              sx={{
                display: { xs: 'flex', sm: 'none' },
                flexGrow: 1,
                fontWeight: 700,
                letterSpacing: '0.02em',
                color: 'white',
                textDecoration: 'none',
                alignItems: 'center',
                fontSize: '1rem',
              }}
            >
              CivicConnect
            </Typography>

            <Box sx={{ flexGrow: 0 }}>
              <Tooltip title={user?.name || 'User menu'}>
                <IconButton 
                  onClick={handleOpenUserMenu} 
                  sx={{ 
                    p: 0,
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    '&:hover': {
                      border: '2px solid rgba(255, 255, 255, 0.6)',
                    }
                  }}
                >
                  <Avatar sx={{ 
                    bgcolor: 'secondary.main',
                    fontWeight: 600,
                  }}>
                    {user?.name?.[0]?.toUpperCase() || '?'}
                  </Avatar>
                </IconButton>
              </Tooltip>
              <Menu
                sx={{ mt: '45px' }}
                anchorEl={anchorElUser}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                keepMounted
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
                PaperProps={{
                  elevation: 3,
                  sx: {
                    mt: 1.5,
                    minWidth: 200,
                    borderRadius: 2,
                  }
                }}
              >
                <MenuItem
                  onClick={() => {
                    navigate(user?.role === 'admin' ? '/admin' : '/dashboard');
                    handleCloseUserMenu();
                  }}
                  sx={{ py: 1.5 }}
                >
                  <Typography>Dashboard</Typography>
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    navigate('/submit');
                    handleCloseUserMenu();
                  }}
                  sx={{ py: 1.5 }}
                >
                  <Typography>Submit Complaint</Typography>
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    handleLogout();
                    handleCloseUserMenu();
                  }}
                  sx={{ py: 1.5, color: 'error.main' }}
                >
                  <Typography>Logout</Typography>
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      <Container maxWidth="xl" sx={{ flex: 1, py: { xs: 3, sm: 4 }, px: { xs: 2, sm: 3 } }} className="animate-fade-in">
        <Outlet />
      </Container>

      <Box 
        component="footer" 
        sx={{ 
          py: { xs: 2, sm: 3 }, 
          px: { xs: 2, sm: 3 }, 
          mt: 'auto',
          bgcolor: 'grey.50',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 } }}>
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} CivicConnect · AI-powered priority &amp; search
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;
