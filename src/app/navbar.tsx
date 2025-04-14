'use client'
import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import GrassIcon from '@mui/icons-material/Grass';
import { useRouter } from 'next/navigation'; 
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../utils/firebaseconfig.js';
import { signOut } from "firebase/auth";
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';

const pages = [
  { name: 'Home', path: '/', perm: true },
  { name: 'Add plant', path: '/add', perm: false },
  { name: 'My plants', path: '/my-plants', perm: false },
  { name: 'About us', path: '/about', perm: true },
];

//  TODO ADD WHITE HIGHLIGITNG WHEN ON A SPECIFIC PAGE
function ResponsiveAppBar() {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null); // controls account dropdown
  const open = Boolean(anchorEl); // indicates whether account dropdown is open or closed
  const [uid, setUid] = useState(undefined); // firebase user
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const toggleDrawer = (open) => () => setDrawerOpen(open);
  
  useEffect(()=>{
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
        setDisplayName(user.displayName);      
        console.log("display name: '" + displayName + "'");
        console.log(typeof(displayName))
        setEmail(user.email);
      } else {
        console.log("user is logged out")
      }
    });
  }, []);

  const handleNavigation = (path) => {
    router.push(path); // Navigate to the selected page
  };

  // when account dropdown is clicked
  const handleAccountClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    console.log("display name: '" + displayName + "' type of " + typeof(displayName));
    setAnchorEl(event.currentTarget);
  };

  // when Profile button is clicked 
  const handleProfile = () => {
    handleAccountClose;
    handleNavigation('/account');
  }

  // when Log out button is clicked
  const handleLogout = () => {
    signOut(auth).then(() => {
      setUid(undefined);
      setDisplayName("Authentication Error");
      setEmail("Authentication Error");
      handleNavigation("/");    
    }).catch((error) => {
      alert(error);
    });
  }

  // closes the dropdown
  const handleAccountClose = () => {
    setAnchorEl(null);
  };


  return (
    <AppBar position="static" sx={{ backgroundColor: '#EAF2E0' }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <GrassIcon
            sx={{
              display: { md: 'flex' },
              mr: 1,
              color: '#50734A',
            }}
          />

          {/* Title */}
          <Typography
            variant="h4"
            noWrap
            sx={{
              mr: 1,
              display: { md: 'flex' },
              fontSize: {
                xs: '.75rem',
                sm: '1rem',
                md: '1.25rem',
                lg: '1.25rem', 
                xl: '1.25rem',
              },
              fontFamily: 'Open Sans',
              fontWeight: 700,
              color: '#50734A',
              textDecoration: 'none',
              cursor: 'pointer', 
            }}
            onClick={() => handleNavigation('/')} // Navigate to Home
          >
            SproutSynch
          </Typography>
          
              
          {/* Hamburger menu icon - visible on xs/sm */}
            <Box sx={{ display: { xs: 'flex', sm: 'flex', md: 'none' }, mr: 2 }}>
            <IconButton
              size="large"
              aria-label="menu"
              onClick={toggleDrawer(true)}
              sx={{ color: '#50734A' }}
            >
              <MenuIcon />
            </IconButton>
          </Box>

          <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
            <Box
              sx={{ width: 200 }}
              role="presentation"
              onClick={toggleDrawer(false)}
              onKeyDown={toggleDrawer(false)}
            >
              <List>
                {pages.map((page) => (
                  page.perm === false && uid === undefined
                    ? null
                    : (
                      <ListItem key={page.name} disablePadding>
                        <ListItemButton onClick={() => handleNavigation(page.path)}>
                          <ListItemText primary={page.name} />
                        </ListItemButton>
                      </ListItem>
                    )
                ))}
              </List>
            </Box>
          </Drawer>

          {/* Navigation links as Buttons for larger sizes */}
          <Box sx={{ display: {
            xs: 'none',
            sm: 'none',
            md: 'flex',
          }, flexGrow: 1, ml: 4 }}>
            {pages.map((page) => (
              page.perm === false && uid === undefined 
              ? 
              null
              :
              <Button
              key={page.name}
              onClick={() => handleNavigation(page.path)}
              sx={{
                my: 2,
                color: '#50734A',
                display: 'block',
                textDecoration: 'none',
                fontFamily: 'Open Sans',
                fontSize: {
                  xs: '.35rem',
                  sm: '.5rem',
                  md: '.65rem',
                  lg: '.8rem', 
                  xl: '1rem',
                },
                padding: {
                  xs: '1px 2px',
                  sm: '2px 3px',
                  md: '3px 6px',
                  lg: '5px 9px', 
                  xl: '6px 10px',
                },
                minWidth: 'auto',
                mr: 5,
                justifyContent: {
                  xs: 'center',
                  sm: 'flex-start',
                }
              }}
              >
                {page.name}
              </Button>
            ))}
          </Box>
          {uid === undefined 
          ? 
          <Button
            key='Account'
            onClick={() => handleNavigation('/login')}
            sx={{
              my: 2,
              color: '#50734A',
              display: 'block',
              textDecoration: 'none',
              fontFamily: 'Open Sans',
              fontSize: '0.75rem',
              padding: '5px 9px',
              minWidth: 'auto',
              mr: 1,
            }}
          >
          Log in/Sign up
          </Button> 
          :
          <>
            <Button
              id="basic-button"
              aria-controls={open ? 'basic-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
              onClick={handleAccountClick}
              sx={{
                my: 2,
                color: '#50734A',
                display: 'block',
                textDecoration: 'none',
                fontFamily: 'Open Sans',
                fontSize: '0.75rem',
                padding: '5px 9px',
                minWidth: 'auto',
                mr: 1,
              }}
            >
              {displayName === null || displayName === "" ? email : displayName}
            </Button>
            <Menu
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              id="basic-menu"
              anchorEl={anchorEl}
              open={open}
              onClose={handleAccountClose}
              MenuListProps={{
                'aria-labelledby': 'basic-button',
              }}
            >
              <MenuItem className="DropdownItem" sx={{ml: 'auto', justifyContent: 'flex-end', fontSize: '0.9rem', fontFamily: 'Open Sans'}} onClick={handleProfile}>Account</MenuItem>
              <MenuItem className="DropdownItem" sx={{justifyContent: 'flex-end', fontSize: '0.9rem', ml: 'auto'}} onClick={handleLogout}>Log Out</MenuItem>
            </Menu>
          </>
          }
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default ResponsiveAppBar;