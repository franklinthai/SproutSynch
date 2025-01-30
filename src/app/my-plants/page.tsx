"use client"
import { useRouter } from "next/navigation";
import { db } from "../firebaseconfig";
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

export async function fetchFirestore() {
    const querySnapshot = await getDocs(query(collection(db, "plants"), orderBy("name", "asc")));
    const plantArr = [];
    querySnapshot.forEach((doc) => {
        plantArr.push({ id: doc.id, ...doc.data()});
    });
    return plantArr;
}

export async function updateFirestore(id, active) {
    try {
        await updateDoc(doc(db, "plants", id), { active: active })
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

    useEffect(() => {
        async function fetchData() {
            const data = await fetchFirestore();
            setPlantArr(data);
        }
        fetchData();
    }, []);

    const toggleActive = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setActive(e.target.checked);
        await updateFirestore(e.target.value, e.target.checked);
    };

    return (
        <div className="flex flex-col items-center">
            <ResponsiveAppBar />
            <h1 className="mt-12 mb-4">My Plants</h1>
           
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
                        p: 4,
                        borderRadius: 2,
                    }}
                >
                    {selectedPlant && (
                        <EditPopup plantId={selectedPlant.name} handleClose={handleClose} />
                    )}
                </Box>
            </Modal>
        </div>
    );
}
