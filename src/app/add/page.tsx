'use client'
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
const { DateTime } = require("luxon");
import ResponsiveAppBar from "../navbar";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from '../../utils/firebaseconfig.js';
import { addFirestore } from "@/utils/firestore";

let added = false;


export default function Add() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [species, setSpecies] = useState("");
    const [interval, setInterval] = useState("");
    const [time, setTime] = useState("");
    const [ampm, setAmpm] = useState("pm");
    const [duration, setDuration] = useState("");
    const [uid, setUid] = useState(undefined);

    useEffect(()=>{
        onAuthStateChanged(auth, (user) => {
            if (user) {
                setUid(user.uid);
            } else {
                router.push("/");
            }
        });
    }, []);

    const onSubmitClick = async (e) => {
        e.preventDefault();
        // add to the database
        try {
            await addFirestore(uid, name, species, interval, time, ampm, duration);
             // if successfully added, give a success alert and return to the main page
            alert("Successfully added " + name);
            router.push("/my-plants");
        } catch (error) {
            console.log(error);
        }
       
    }

    return <div className="flex flex-col items-center">
        <ResponsiveAppBar></ResponsiveAppBar>
        {uid === undefined 
        ? 
        <p className="mt-8">You must sign in to access this feature.</p>
        :
        <><h1 className="mt-12 mb-4">Customize your plant</h1>
        <div className="w-1/3">
            <div className="Label">Name</div>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter plant name"></input>
            <div className="Label">Species</div>
            <input id="species" value={species} onChange={(e) => setSpecies(e.target.value)} placeholder="Enter plant species (optional)"></input>
            <div className="Label">Watering Interval (days)</div>
            <input type="number" id="interval" value={interval} onChange={(e) => setInterval(e.target.value)} min={1} placeholder="Days between watering"></input>
            <div className="Label">Time</div>
            <div className="flex">
                <input type="number" id="time" value={time} onChange={(e) => setTime(e.target.value)} min={1} max={12} placeholder="Watering time"></input> 
                <select className="w-1/2 ml-2" id="ampm" value={ampm} onChange={(e) => setAmpm(e.target.value)}>
                    <option value="am">am</option>
                    <option value="pm">pm</option>
                </select>
            </div>
            <div className="Label">Duration (seconds)</div>
            <input type="number" id="duration" value={duration} onChange={(e) => setDuration(e.target.value)} min={1} max={20} placeholder="Duration of each watering"></input>
            <div className="flex justify-end">
                <button onClick={() => router.push("/")} className="ActionButton BackButton mr-2">Cancel</button>
                <button onClick={(e) => onSubmitClick(e)} className="ActionButton">Add plant</button>
            </div>
        </div></>}
    </div>
}