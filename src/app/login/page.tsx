'use client'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseconfig.js";
import ResponsiveAppBar from "../navbar";
import Link from 'next/link.js';

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    else if (password.length === 0) alert("You must enter a password");
    else {
      signInWithEmailAndPassword(auth, email, password)
      .then(authUser => {
        router.push("/");
      })
      .catch(error => {
        alert(error);
      });
    event.preventDefault();
    };
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
            <input id="passwordone" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password"></input>
            <p className='mt-2'>Don't have an account yet? <Link href="/signup" className='underline'>Sign Up</Link></p>
            <div className="flex justify-end">
                <button onClick={(e) => onSubmitClick(e)} className="ActionButton">Log In</button>
            </div>
        </div></>
        :
        <p className='mt-8'>You are already logged in. To access this feature, please log out first.</p>}
    </div>
}

export default SignUp;