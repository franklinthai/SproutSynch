"use client"
import { useRouter } from "next/navigation";
import { db } from "../firebaseconfig";
import React, { useEffect, useState } from "react";
import { getDocs, collection, addDoc, deleteDoc, doc } from "firebase/firestore";
const { DateTime } = require("luxon");
import ResponsiveAppBar from "../navbar";

let added = false;

export async function addFirestore(name, species, interval, time, ampm, duration) {
    try {
        // double check that the time interval and duration numbers are valid
        if (name === "") throw new Error("Name is required");
        if (interval === "") throw new Error("Interval is required");
        if (time === "") throw new Error("Time is required");
        if (duration === "") throw new Error("Duration is required");
        if (time < 1 || time > 12) throw new Error("Invalid time");
        if (interval < 1) throw new Error("Interval is negative");
        if (duration < 1) throw new Error("Duration is negative");
        if (duration > 20) throw new Error("Duration is too long, don't drown your plants!");
        // convert interval, time and duration to integers
        interval = parseInt(interval);
        time = parseInt(time);
        duration = parseInt(duration);
        // translate from 12 hour to 24 hour clock (12am and 12pm are special since 12am = 00:00 
        // and 12pm = 12:00)
        if (ampm === "am" && time === 12) time = 0;
        if (ampm === "pm" && time !== 12) time += 12;
        // current time using luxon's DateTime variable
        const now = DateTime.now();
        // create a last watered variable using current year and month, the provided time, and 
        // setting the day to the current day - interval + 1 so that the next watering time will 
        // be the after the user adds the plant
        console.log(typeof(interval) + typeof(time) + typeof(duration));
        console.log("interval: " + interval + " time: " + time + " duration: " + duration);
        const newDay = now.minus({days: interval-1});
        let lastWatered = DateTime.local(newDay.year, newDay.month, newDay.day, time);
        console.log(lastWatered);
        // if the time hasn't happened yet on the day the user adds the plant, subtract a day so 
        // that the plant will be watered later that day (eg if the user wants their plant to be 
        // watered at 4pm and they add the plant at 1pm, the plant will be watered the same day)
        if (now.hour < time) lastWatered = lastWatered.minus({days: 1});
        // add to the database in the plants collection. lastWatered is translated to ISO format
        // since Firebase doesn't know what a luxon DateTime is
        const docRef = await addDoc(collection(db, "plants"), {
        name: name,
        species: species,
        interval: interval,
        last_watered: lastWatered.toISO(),
        duration: duration
        });
        added = true;
    } catch (error) {
      alert(error);
      added = false;
    } 
  }

export default function Add() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [species, setSpecies] = useState("");
    const [interval, setInterval] = useState("");
    const [time, setTime] = useState("");
    const [ampm, setAmpm] = useState("pm");
    const [duration, setDuration] = useState("");

    const onSubmitClick = async (e) => {
        e.preventDefault();
        // add to the database
        added = false;
        await addFirestore(name, species, interval, time, ampm, duration);
        // if successfully added, give a success alert and return to the main page
        if (added) { 
            alert("Successfully added " + name);
            router.push("/");
        }
    }

    return <div className="flex flex-col items-center">
        <ResponsiveAppBar></ResponsiveAppBar>
        <h1 className="mt-12 mb-4">Customize your plant</h1>
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
        </div>
    </div>
}