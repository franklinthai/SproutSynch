'use client'
import { useRouter } from "next/navigation";
import { db } from "../utils/firebaseconfig"
import React, { useEffect, useState } from "react";
import { getDocs, collection, addDoc, deleteDoc, doc } from "firebase/firestore";
import ResponsiveAppBar from "./navbar";
import { PlayLessonTwoTone } from "@mui/icons-material";
import plant from './../../assets/plant.png';
import Image from 'next/image';
import './globals.css';

// TODO FIX BUTTON 
// TODO IMAGE LOOKS JANK POSSIBLY SWITCH TO SVG
export default function Home() {
  const router = useRouter();

  return (
    <div>
      <ResponsiveAppBar></ResponsiveAppBar>
      <div className="flex justify-around items-center min-h-[70vh]">
        <div className="flex flex-col space-y-4">
          <h1>Let's start <br></br>watering!</h1>
          <p>
            Help take care of your plants by tracking<br/> 
            watering schedules and soil moisture. Add your<br/>
            plants and get started on keeping them healthy<br/>
            and happy.
          </p>
          <button className="ActionButton" onClick={() => router.push("/add")} type="button">Add a plant</button>
        </div>
        <div className="bg-custom-gradient rounded-full overflow-hidden w-96 h-96 flex items-center justify-center shadow-md">
          <div className="w-full h-full flex items-center justify-center">
            <Image
              src={plant}
              alt="Plant"
              width={360} // Adjusted size to fit the larger container
              height={360}
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
