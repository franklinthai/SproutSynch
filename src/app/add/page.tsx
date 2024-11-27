"use client"
import { useRouter } from "next/navigation";
import { db } from "../firebaseconfig";
import React, { useEffect, useState } from "react";
import { getDocs, collection, addDoc, deleteDoc, doc } from "firebase/firestore";
const { DateTime } = require("luxon");
import ResponsiveAppBar from "../navbar";

async function addFirestore(name, species, interval, time, ampm, duration) {
    try {
        // double check that the time and interval numbers are valid
        if (time < 1 || time > 12) {
            alert("Invalid time");
            return false;
        }
        if (interval < 1) {
            alert("Interval is negative");
            return false;
        }
        if (duration < 1) {
            alert("Duration is negative");
            return false;
        }
        if (duration > 20) {
            alert("Duration is too long, don't drown your plants!");
            return false;
        }
        // translate from 12 hour to 24 hour clock (12am and 12pm are special since 12am = 00:00 
        // and 12pm = 12:00)
        if (ampm === "am" && time === 12) time = 0;
        if (ampm === "pm" && time !== 12) time += 12;
        // current time using luxon's DateTime variable
        const now = DateTime.now();
        // create a last watered variable using current year and month, the provided time, and 
        // setting the day to the current day - interval + 1 so that the next watering time will 
        // be the after the user adds the plant
        let lastWatered = DateTime.local(now.year, now.month, now.day - interval + 1, time);
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
        return true;
    } catch (error) {
      console.error("Could not add document, error " + error);
      return false;
    }
  }

export default function Add() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [species, setSpecies] = useState("");
    const [interval, setInterval] = useState(1);
    const [time, setTime] = useState(12);
    const [ampm, setAmpm] = useState("pm");
    const [duration, setDuration] = useState(5);

    const onSubmitClick = async (e) => {
        e.preventDefault();
        // add to the database
        const added = addFirestore(name, species, interval, time, ampm, duration);
        // if successfully added, give a success alert and return to the main page
        if (added) { 
          router.push("/");
          alert("Successfully added " + name);
        }
    }

    return <div className="flex flex-col">
         <ResponsiveAppBar></ResponsiveAppBar>
        <h1 className="font-bold text-2xl pb-4 center">New Plant</h1>
        <form onSubmit={(e) => onSubmitClick(e)}>
            <div className="m-2">Name: <input id="name" value={name} onChange={(e) => setName(e.target.value)} className="text-black rounded-lg h-6"></input></div>
            <div className="m-2">Species: <input id="species" value={species} onChange={(e) => setSpecies(e.target.value)} className="text-black rounded-lg h-6"></input></div>
            <div className="m-2">Watering Interval: Every <input type="number" id="interval" value={interval} onChange={(e) => setInterval(parseInt(e.target.value))} className="text-black rounded-lg w-9 h-6" min={1}></input>
                {interval == 1 ? " day" : " days"} at <input type="number" id="time" value={time} onChange={(e) => setTime(parseInt(e.target.value))} className="text-black rounded-lg w-9 h-6" min={1} max={12}>
                </input> <select id="ampm" value={ampm} onChange={(e) => setAmpm(e.target.value)} className="text-black rounded-lg w-12 h-6">
                    <option value="am">am</option>
                    <option value="pm">pm</option>
                </select>
            </div>
            <div className="m-2">Water for <input type="number" id="duration" value={duration} onChange={(e) => setDuration(parseInt(e.target.value))} className="text-black rounded-lg w-9 h-6" min={1} max={20}></input> seconds each time</div>
            <button type="submit" className="border-2 mt-4 p-1 rounded-2xl hover:bg-green-600 bg-white text-black">Add</button>
        </form>
        <button onClick={() => router.push("/")} className="border-2 mt-4 p-1 rounded-2xl hover:bg-green-600 bg-white text-black w-16">Back</button>
    </div>
}