'use client'
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebaseconfig";
import ResponsiveAppBar from "../navbar"
import { useState } from "react";
import Link from "next/link.js";

    

export default function About() {
    const [email, setEmail] = useState("");
    
    const onResetClick = event => {
        sendPasswordResetEmail(auth, email)
        .then(() => {
            alert("Email send to " + email + ". Check your inbox.");
        })
        .catch((error) => {
            alert(error);
        });
    }
    
    return <div className="flex flex-col items-center">
        <ResponsiveAppBar></ResponsiveAppBar>
        <h1 className="mt-12 mb-4">Reset Password</h1>
        <div className="w-1/3">
            <div className="Label">Email</div>
            <input id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your account email"></input>
            <button onClick={(e) => onResetClick(e)} className="ActionButton" style={{width: "100%"}}>Send Reset Email</button>
            <p className='mt-10 text-center'><Link href="/login" className='underline'>Back to Log in</Link></p>
    </div></div>
}
