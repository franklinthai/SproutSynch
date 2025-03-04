import { db } from "./firebaseconfig"
import { getDocs, collection, addDoc, where, query, doc, updateDoc, orderBy} from "firebase/firestore";
const { DateTime } = require("luxon");

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

export async function fetchPlantByName(name, uid) {
    const plantQuery = query(collection(db, "users", uid, "plants"), where("name", "==", name));
    const querySnapshot = await getDocs(plantQuery);
    const plant = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return plant[0]; // Return the first matching plant
}

export async function fetchFirestore(uid) {
    const querySnapshot = await getDocs(query(collection(db, "users", uid, "plants"), orderBy("name", "asc")));
    const plantArr = [];
    querySnapshot.forEach((doc) => {
        plantArr.push({ id: doc.id, ...doc.data()});
    });
    return plantArr;
}

export async function updateFirestore(uid, id, active) {
    try {
        await updateDoc(doc(db, "users", uid, "plants", id), { active: active })
    } catch (error) {
        alert(error);
    }
}