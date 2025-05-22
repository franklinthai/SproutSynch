'use client'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../../utils/firebaseconfig.js";
import ResponsiveAppBar from "../navbar";
import Link from 'next/link.js';
import GoogleIcon from '@mui/icons-material/Google';

const provider = new GoogleAuthProvider();

// The login page, which allows users to login with email and password or with Google.
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const [uid, setUid] = useState(undefined);
  
  // Runs when the page is loaded, and ensures that the user is logged in.
  useEffect(()=>{
    onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push("/");
      } else {
        setUid(undefined);
      }
    });
  }, []);

  // Called when the user clicks the log in button. Logs the user in and sends them to the home
  // page if their username and password were correct, or alerts them otherwise.
  const onSubmitClick = event => {
    if (email.length === 0) alert("You must enter an email");
    else if (password.length === 0) alert("You must enter a password");
    else {
      signInWithEmailAndPassword(auth, email, password)
      .then(authUser => {
        // send to home page
        router.push("/");
      })
      .catch(error => {
        alert(error);
      });
    event.preventDefault();
    };
  }   

  // Called when the user clicks the Google icon. Opens a popup to let them sign in with Google.
  const onGoogleClick = event => {
    signInWithPopup(auth, provider)
    .then(authUser => {
      router.push("/");
    })
    .catch(error => {
      alert(error);
    });
    event.preventDefault();
  }

  return <div className="flex flex-col items-center">
    <ResponsiveAppBar></ResponsiveAppBar>
    {uid === undefined 
    ?
    <><h1 className="mt-12 mb-4">Log In</h1>
    <div className="w-1/3">
      <div className="Label">Email</div>
      <input id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter email"></input>
      <div className="Label">Password</div>
      <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password"></input>
      <button onClick={(e) => onSubmitClick(e)} className="ActionButton" style={{width: "100%"}}>Log In</button>
      <p className='mt-2'><Link href="/resetpassword" className='underline'>Forgot password?</Link></p>
      <p className='mt-14 text-center'>Or continue with</p>
      <div className='flex justify-center'>
        <button className='text-center ActionButton BackButton' style={{width: "4.5rem"}} onClick={onGoogleClick}><GoogleIcon/></button>
      </div>
      <p className='mt-10 text-center'>Don't have an account yet? <Link href="/signup" className='underline'>Sign Up</Link></p>
    </div></>
    :
    <p className='mt-8'>You are already logged in. To access this feature, please log out first.</p>}
  </div>
}