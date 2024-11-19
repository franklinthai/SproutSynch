"use client";

import { useRouter, useParams } from "next/navigation";
import { db } from "../../firebaseconfig";
import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
const { DateTime } = require("luxon");

export default function Edit() {
  const router = useRouter();
  const { name } = useParams(); // Get the plant name from the URL
  const plantName = name; 

  const [documentId, setDocumentId] = useState(""); // Store the Firestore document ID
  const [species, setSpecies] = useState("");
  const [interval, setInterval] = useState(1);
  const [time, setTime] = useState(12);
  const [ampm, setAmpm] = useState("pm");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlantData = async () => {
      try {
        const plantsRef = collection(db, "plants");
        const q = query(plantsRef, where("name", "==", plantName));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const docSnapshot = querySnapshot.docs[0]; // Assume the name is unique
          const plantData = docSnapshot.data();
          setDocumentId(docSnapshot.id); // Store the document ID for updates

          // Populate form fields with plant data
          setSpecies(plantData.species);
          setInterval(plantData.interval);

          const lastWatered = DateTime.fromISO(plantData.last_watered);
          let hours = lastWatered.hour;
          setAmpm(hours >= 12 ? "pm" : "am");
          if (hours === 0) hours = 12;
          if (hours > 12) hours -= 12;
          setTime(hours);

          setLoading(false);
        } else {
          alert("Plant not found!");
          router.push("/");
        }
      } catch (error) {
        console.error("Failed to fetch plant data:", error);
        alert("Error loading plant data.");
        router.push("/");
      }
    };

    if (plantName) {
      fetchPlantData();
    }
  }, [plantName, router]);

  const onSubmitClick = async (e) => {
    e.preventDefault();

    try {
      if (time < 1 || time > 12) {
        alert("Invalid time");
        return;
      }
      if (interval < 1) {
        alert("Interval must be at least 1 day");
        return;
      }

      let hour = time;
      if (ampm === "am" && time === 12) hour = 0;
      if (ampm === "pm" && time !== 12) hour += 12;

      const now = DateTime.now();
      let lastWatered = DateTime.local(now.year, now.month, now.day - interval + 1, hour);
      if (now.hour < hour) lastWatered = lastWatered.minus({ days: 1 });

      const plantRef = doc(db, "plants", documentId);
      await updateDoc(plantRef, {
        name: plantName,
        species: species,
        interval: interval,
        last_watered: lastWatered.toISO(),
      });

      alert("Plant updated successfully!");
      router.push("/");
    } catch (error) {
      console.error("Failed to update plant:", error);
      alert("Failed to update plant. Please try again.");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col">
      <h1 className="font-bold text-2xl pb-4 center">Edit Plant</h1>
      <form onSubmit={(e) => onSubmitClick(e)}>
        <div className="pt-2">
          Species:{" "}
          <input
            id="species"
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
            className="text-black rounded-lg h-6"
            required
          />
        </div>
        <div className="pt-2">
          Watering Interval: Every{" "}
          <input
            type="number"
            id="interval"
            value={interval}
            onChange={(e) => setInterval(parseInt(e.target.value))}
            className="text-black rounded-lg w-9 h-6"
            min={1}
            required
          />{" "}
          {interval === 1 ? "day" : "days"} at{" "}
          <input
            type="number"
            id="time"
            value={time}
            onChange={(e) => setTime(parseInt(e.target.value))}
            className="text-black rounded-lg w-9 h-6"
            min={1}
            max={12}
            required
          />{" "}
          <select
            id="ampm"
            value={ampm}
            onChange={(e) => setAmpm(e.target.value)}
            className="text-black rounded-lg w-12 h-6"
            required
          >
            <option value="am">am</option>
            <option value="pm">pm</option>
          </select>
        </div>
        <button
          type="submit"
          className="border-2 mt-4 p-1 rounded-2xl hover:bg-green-600 bg-white text-black"
        >
          Update
        </button>
      </form>
      <button
        onClick={() => router.push("/")}
        className="border-2 mt-4 p-1 rounded-2xl hover:bg-green-600 bg-white text-black w-16"
      >
        Back
      </button>
    </div>
  );
}

