import { db } from "./firebaseconfig"
import { NextResponse } from 'next/server'
import { getDocs, getDoc, collection, addDoc, where, query, doc, updateDoc, orderBy, deleteDoc } from "firebase/firestore";
const { DateTime } = require("luxon");

// Returns the pipes field for the provided user
// Parameters:
//   - uid: the id of the user
export async function fetchFirestorePipes(uid) {
    try {
        const docRef = doc(db, "users", uid);
        const docSnapshot = await getDoc(docRef);
        if (docSnapshot) {
            return docSnapshot.data().pipes;
        } else return 0;
    } catch (error) {
        alert(error);
    }
}

// Deletes the provided plant belonging to the provided user
// Parameters:
//   - uid: the id of the user
//   - pid: the id of the plant
export async function deleteFirestore(uid, pid) {
    try {
        await deleteDoc(doc(db, "users", uid, "plants", pid));
    } catch (error) {
        alert(error);
    }
}

// Adds a plant for a specific user
// Parameters:
//   - uid: the id of the user
//   - name: the name of the plant
//   - species: the species of the plant
//   - interval: the plant's watering time interval
//   - time: an int from 1-12 representing the time of day to water the plant
//   - ampm: indicates whether the time is am or pm
//   - duration: the amount of seconds the plant is watered for during each watering
export async function addFirestore(uid, name, species, interval, time, ampm, duration) {
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
        const newDay = now.minus({days: interval-1});
        let lastWatered = DateTime.local(newDay.year, newDay.month, newDay.day, time);
        // if the time hasn't happened yet on the day the user adds the plant, subtract a day so 
        // that the plant will be watered later that day (eg if the user wants their plant to be 
        // watered at 4pm and they add the plant at 1pm, the plant will be watered the same day)
        if (now.hour < time) lastWatered = lastWatered.minus({days: 1});
        // add to the database in the plants collection. lastWatered is translated to ISO format
        // since Firebase doesn't know what a luxon DateTime is
        lastWatered = lastWatered.setZone('UTC');
        const docRef = await addDoc(collection(db, "users", uid, "plants"), {
            name: name,
            species: species,
            interval: interval,
            last_watered: lastWatered.toISO(),
            duration: duration,
            active: true,
            description: ""
        });
    } catch (error) {
        alert(error); 
    } 
}

// Returns a plant record, with all of the plant's data, as well as an id field with the plant's id.
// Parameters:
//   - name: the name of the plant
//   - uid: the id of the user
export async function fetchPlantByName(name, uid) {
    try {
        const plantQuery = query(collection(db, "users", uid, "plants"), where("name", "==", name));
        const querySnapshot = await getDocs(plantQuery);
        const plant = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        return plant[0];
    } catch (error) {
        alert(error);
    }
}

// Returns an array of all of the plants for a given user. Each item of the array is a plant record, 
// with all of the plant's data, as well as an id field with the plant's id.
// Parameters:
//   - uid: the id of the user
export async function fetchFirestoreByUser(uid) {
    try {
        const querySnapshot = await getDocs(query(collection(db, "users", uid, "plants"), orderBy("name", "asc")));
        const plantArr = [];
        querySnapshot.forEach((doc) => {
            plantArr.push({ id: doc.id, ...doc.data()});
        });
        return plantArr;
    } catch (error) {
        alert(error);
    }
}

// Updates the active field on a plant to turn it on/off.
// Parameters: 
//   - uid: the id of the user
//   - pid: the id of the plant
//   - active: a boolean indicating the new active state of the plant
export async function updateActive(uid, pid, active) {
    try {
        await updateDoc(doc(db, "users", uid, "plants", pid), { active: active })
    } catch (error) {
        alert(error);
    }
}

// Updates the last watered field of a user's plant with a new time
// Parameters:
//   - uid: the id of the user
//   - pid: the id of the plant
//   - time: the time that the plant was last watered, a UTC time in ISO format
export async function updateLastWatered(uid, pid, time) {
    try {
        await updateDoc(doc(db, "users", uid, "plants", pid), { last_watered: time });
    } catch (error) {
        return NextResponse.json({ error: "failed to update database: " + error }, { status: 500 });
    }
}