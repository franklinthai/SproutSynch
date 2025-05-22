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

// an array of pages to display on the navbar
const pages = [
  { name: 'Add plant', path: '/add', perm: false },
  { name: 'My plants', path: '/my-plants', perm: false },
  { name: 'About us', path: '/about', perm: true },
];

// TODO ADD WHITE HIGHLIGITNG WHEN ON A SPECIFIC PAGE

// The navbar at the top of each page. Contains the website logo and name, some page links, and
// the user's display name which opens a dropdown with account and log out buttons when clicked.
export default function ResponsiveAppBar() {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null); // controls account dropdown
  const open = Boolean(anchorEl); // indicates whether account dropdown is open or closed
  const [uid, setUid] = useState(undefined); // firebase user
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const toggleDrawer = (open) => () => setDrawerOpen(open);
  
  // Called when the component is loaded. Checks if the user is logged in.
  useEffect(()=>{
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
        setDisplayName(user.displayName);      
        setEmail(user.email);
      }
    });
  }, []);

  // Navigates to the provided path using the router.
  const handleNavigation = (path) => {
    router.push(path); // Navigate to the selected page
  };

  // Called when the display name to the right is clicked. Opens a dropdown with account and log
  // out options. 
  const handleDropdownClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  // Called when account button is clicked from the dropdown. Navigates to the account page.
  const handleAccount = () => {
    handleDropdownClose;
    handleNavigation('/account');
  }

  // Called when Log out button is clicked from the dropdown. Signs the user out and sends the
  // user to the home page.
  const handleLogout = () => {
    signOut(auth).then(() => {
      setUid(undefined);
      setDisplayName("Authentication Error");
      setEmail("Authentication Error");
      handleNavigation("/");
      location.reload();
    }).catch((error) => {
      alert(error);
    });
  }

  // Called when the dropdown is closed.
  const handleDropdownClose = () => {
    setAnchorEl(null);
  };


  return (
    <AppBar position="static" sx={{ backgroundColor: '#EAF2E0' }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* Title */}
          <Typography
            variant="h4"
            noWrap
            sx={{
              mr: 1,
              ml: 1,
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
            className="flex items-center"
          >
            <img src="logo.svg" alt="Logo" width={32} height={32}  className="mr-2"/>
            SproutSynch
          </Typography>
          
              
        

          <Drawer anchor="right" open={drawerOpen} onClose={toggleDrawer(false)}>
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
                  md: '.6rem',
                  lg: '.7rem', 
                  xl: '.8rem',
                },
                padding: {
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
              onClick={handleDropdownClick}
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
              onClose={handleDropdownClose}
              MenuListProps={{
                'aria-labelledby': 'basic-button',
              }}
            >
              <MenuItem className="DropdownItem" sx={{ml: 'auto', justifyContent: 'flex-end', fontSize: '0.9rem', fontFamily: 'Open Sans'}} onClick={handleAccount}>Account</MenuItem>
              <MenuItem className="DropdownItem" sx={{justifyContent: 'flex-end', fontSize: '0.9rem', ml: 'auto'}} onClick={handleLogout}>Log Out</MenuItem>
            </Menu>
          </>
          }

          {/* Hamburger menu icon - visible on xs/sm */}
          <Box sx={{ display: { xs: 'flex', sm: 'flex', md: 'none' }, ml: 'auto' }}>
            <IconButton
              size="large"
              aria-label="menu"
              onClick={toggleDrawer(true)}
              sx={{ color: '#50734A' }}
            >
              <MenuIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}