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
          
          {/* Navigation links as Buttons */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, ml: 4 }}>
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