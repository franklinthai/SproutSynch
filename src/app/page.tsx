'use client'
import { useRouter } from "next/navigation";
import ResponsiveAppBar from "./navbar";
import plant from './../../assets/hello.png';
import Image from 'next/image';
import './globals.css';
import { useEffect, useState } from "react";
import { auth } from '../utils/firebaseconfig.js';
import { onAuthStateChanged } from "firebase/auth";

// TODO FIX BUTTON 
// TODO IMAGE LOOKS JANK POSSIBLY SWITCH TO SVG

// The default home page. Contains basic info and buttons to relevant pages.
export default function Home() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(()=>{
      onAuthStateChanged(auth, (user) => {
        if (user) {
          setLoggedIn(true);
        }
      });
  }, []);

  return (
    <div>
      <ResponsiveAppBar></ResponsiveAppBar>
      <div className="flex flex-col lg:flex-row justify-around items-center min-h-screen px-4 py-8">
        <div className="flex flex-col space-y-4 max-w-md text-center lg:text-left">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">
            Let's start<br/>watering!
          </h1>
          <p className="text-base sm:text-lg md:text-xl">
            Help take care of your plants by setting up
            automatic watering schedules. 
            {loggedIn ? 
            " Add a new plant or check in on your current plants below."
            : 
            " Log in or sign up to get started. Your plants will thank you!"
            }
          </p>
          <div className="flex">
            <button
              className="ActionButton w-fit"
              onClick={loggedIn ? () => router.push("/add") : () => router.push("/login")}
              type="button"
            >
              {loggedIn ? "Add a plant" : "Log in"}
            </button>
            <button
              className="ActionButton w-fit ml-2"
              onClick={loggedIn ? () => router.push("/my-plants") : () => router.push("/signup")}
              type="button"
            >
              {loggedIn ? "My plants" : "Sign up"}
            </button>
          </div>
        </div>
        <div className="relative bg-custom-gradient rounded-full overflow-hidden w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 shadow-md mt-8 lg:mt-0">
          <Image
            src={plant}
            alt="Plant"
            fill
            className="object-contain"
          />
        </div>
      </div>
    </div>
  );
}
