'use client'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebaseconfig.js";
import ResponsiveAppBar from "../navbar";
import Link from 'next/link.js';

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [passwordOne, setPasswordOne] = useState("");
  const [passwordTwo, setPasswordTwo] = useState("");
  const router = useRouter();
  const [uid, setUid] = useState(undefined);
      
  useEffect(()=>{
      onAuthStateChanged(auth, (user) => {
        if (user) {
          router.push("/");
        } else {
          setUid(undefined);
        }
      });
  }, []);

  const onSubmitClick = event => {
    if (email.length === 0) alert("You must enter an email");
    else if (passwordOne.length < 8) alert("Password must be at least 8 characters");
    else if (passwordOne === passwordTwo) {
      createUserWithEmailAndPassword(auth, email, passwordOne)
      .then(authUser => {
        router.push("/");
      })
      .catch(error => {
        alert(error);
      });
    } else {
        alert("Passwords do not match");
    }
    event.preventDefault();
  };

  return <div className="flex flex-col items-center">
        <ResponsiveAppBar></ResponsiveAppBar>
        {uid === undefined
        ? 
        <><h1 className="mt-12 mb-4">Sign Up</h1>
        <div className="w-1/3">
            <div className="Label">Email</div>
            <input id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter email"></input>
            <div className="Label">Password (must be at least 8 characters)</div>
            <input id="passwordone" value={passwordOne} onChange={(e) => setPasswordOne(e.target.value)} placeholder="Enter password"></input>
            <div className="Label">Confirm Password</div>
            <input id="passwordone" value={passwordTwo} onChange={(e) => setPasswordTwo(e.target.value)} placeholder="Enter password"></input>
            <p className='mt-2'>Already have an account? <Link href="/login" className='underline'>Log in</Link></p>
            <div className="flex justify-end">
                <button onClick={(e) => onSubmitClick(e)} className="ActionButton">Sign Up</button>
            </div>
        </div></>
        :
        <p className='mt-8'>You are already logged in. To access this feature, please log out first.</p>}
    </div>
}

export default SignUp;