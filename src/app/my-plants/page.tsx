"use client"
import { useRouter } from "next/navigation";
import { auth, db } from "../firebaseconfig";
import React, { useEffect, useState } from "react";
import { getDocs, collection, doc, updateDoc, orderBy, query } from "firebase/firestore";
const { DateTime } = require("luxon");
import ResponsiveAppBar from "../navbar";
import plantIcon from './../../../assets/plantIcon.png';
import Image from 'next/image';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import Switch from "@mui/material/Switch";
import createTheme from "@mui/material/styles/createTheme";
import { Box, Modal, ThemeProvider } from "@mui/material";
import EditPopup from "./editpopup";
import { onAuthStateChanged } from "firebase/auth";

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

const theme = createTheme({
    palette: {
      primary: {
        main: '#50734A'
      }
    }
});

export default function MyPlants() {
    const router = useRouter();
    const [plantArr, setPlantArr] = useState([]);
    const [active, setActive] = useState(true);
    const [selectedPlant, setSelectedPlant] = useState(null); // State to track selected plant
    const handleClose = () => setSelectedPlant(null); // Close the modal
    const [uid, setUid] = useState(undefined);

    useEffect(()=>{
        onAuthStateChanged(auth, (user) => {
            if (user) {
                setUid(user.uid);
                fetchData(user.uid);
            } else {
                router.push("/");
            }
        });

        async function fetchData(userid) {
            const data = await fetchFirestore(userid);
            setPlantArr(data);
        }
    }, []);

    const toggleActive = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setActive(e.target.checked);
        await updateFirestore(uid, e.target.value, e.target.checked);
    };

    return <div className="flex flex-col items-center">
            <ResponsiveAppBar />
            {uid === undefined
            ?
            <p className="mt-8">You must sign in to access this feature.</p>
            :
            <><h1 className="mt-12 mb-4">My Plants</h1>
            <div className="Grid w-100 grid grid-cols-3 gap-12 my-12">
                {plantArr.map((plant) => (
                    <div 
                        key={plant.id} 
                        className="Card w-96 h-64 rounded-xl bg-white shadow-lg"
                        onClick={() => setSelectedPlant(plant)} // Open modal when clicked
                    >
                        <Image src={plantIcon} alt="PlantIcon" className="h-1/2 object-cover"/>
                        <div className="Label pl-4 flex justify-between items-center">
                            {plant.name}
                            <PowerSettingsNewIcon className="Icon mr-0 ml-auto" fontSize="small"/>
                            <ThemeProvider theme={theme}>
                                <Switch defaultChecked value={plant.id} onChange={toggleActive} />
                            </ThemeProvider>
                        </div>
                        <p className="pl-4">{plant.species ? `Species: ${plant.species}` : ""}</p>
                        <p className="pl-4">
                            Next Watering:{" "}
                            {DateTime.fromISO(plant.last_watered)
                                .plus({ days: plant.interval })
                                .toLocaleString({ month: "short", day: "numeric", hour: "numeric", minute: "numeric" })}
                        </p>
                    </div>
                ))}
            </div>
            <Modal
                open={!!selectedPlant} // Only open when a plant is selected
                onClose={handleClose}
                aria-labelledby="plant-details-modal"
                aria-describedby="plant-details-description"
            >
                <Box
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: "50%",
                        bgcolor: "background.paper",
                        boxShadow: 24,
                        borderRadius: 2,
                    }}
                    style={{ border: "none"}}
                >
                    {selectedPlant && (
                        <EditPopup plantId={selectedPlant.name} uid={uid} handleClose={handleClose} />
                    )}
                </Box>
            </Modal></>}
        </div>
}
