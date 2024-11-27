import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import GrassIcon from '@mui/icons-material/Grass';
import { useRouter } from 'next/navigation'; // Import useRouter

const pages = [
  { name: 'Home', path: '/' },
  { name: 'Add plant', path: '/add' },
  { name: 'My plants', path: '/my-plants' },
  { name: 'About us', path: '/about' },
];

function ResponsiveAppBar() {
  const router = useRouter();

  const handleNavigation = (path) => {
    router.push(path); // Navigate to the selected page
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: '#EAF2E0' }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* Logo Icon (Visible on larger screens) */}
          <GrassIcon
            sx={{
              display: { xs: 'none', md: 'flex' },
              mr: 1,
              color: '#50734A',
            }}
          />

          {/* Title */}
          <Typography
            variant="h4"
            noWrap
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              fontFamily: 'Open Sans',
              fontWeight: 700,
              color: '#50734A',
              textDecoration: 'none',
              cursor: 'pointer', // Make it look clickable
            }}
            onClick={() => handleNavigation('/')} // Navigate to Home
          >
            SproutSynch
          </Typography>

          {/* Logo Icon (Visible on smaller screens) */}
          <GrassIcon sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }} />

          {/* Title for smaller screens */}
          <Typography
            variant="h5"
            noWrap
            sx={{
              mr: 2,
              display: { xs: 'flex', md: 'none' },
              flexGrow: 1,
              fontFamily: 'monospace',
              fontWeight: 700,
              color: '#50734A',
              textDecoration: 'none',
              cursor: 'pointer', // Make it look clickable
            }}
            onClick={() => handleNavigation('/')} // Navigate to Home
          >
            LOGO
          </Typography>

          {/* Navigation links as Buttons */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, ml: 4 }}>
            {pages.map((page) => (
              <Button
                key={page.name}
                onClick={() => handleNavigation(page.path)}
                sx={{
                  backgroundColor: page.name === 'Home' ? 'white' : 'transparent',
                  my: 2,
                  color: '#50734A',
                  display: 'block',
                  textDecoration: 'none',
                  fontFamily: 'Open Sans',
                  fontSize: '0.75rem',
                  padding: '5px 9px',
                  minWidth: 'auto',
                  mr: 5,
                }}
              >
                {page.name}
              </Button>
            ))}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default ResponsiveAppBar;