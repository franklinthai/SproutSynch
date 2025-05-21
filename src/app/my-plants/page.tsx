"use client"
import { useRouter } from "next/navigation";
import { auth } from "../../utils/firebaseconfig";
import React, { useEffect, useState } from "react";
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
import PipesPopup from "./pipespopup";
import { fetchFirestoreByUser, updateActive } from "@/utils/firestore";
import { fetchFirestorePipes } from "@/utils/firestore";

const theme = createTheme({
  palette: {
    primary: {
    main: '#50734A'
    }
  }
});

// The my plants page, which contains all the user's plants in a grid. Allows user to turn plants
// on and off, as well as change the number of pipes they have.
export default function MyPlants() {
  const router = useRouter();
  const [plantArr, setPlantArr] = useState([]);
  const [active, setActive] = useState(true);
  const [pipes, setPipes] = useState("");
  const [editPipes, setEditPipes] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState(null); // State to track selected plant
  const handleClose = () => setSelectedPlant(null); // Close the modal
  const togglePipes = () => setEditPipes(!editPipes); // Toggle the pipes modal
  const [uid, setUid] = useState(undefined);

  // Called when the page loads. Checks to make sure the user is logged in, and fetches the user's
  // plants from Firestore.
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
      const data = await fetchFirestoreByUser(userid);
      setPlantArr(data);
      const num = await fetchFirestorePipes(userid);
      setPipes(num);
    }
  }, []);

  // Called when the user toggles the activation for one of their plants. Updates Firestore.
  const toggleActive = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setActive(e.target.checked);
    await updateActive(uid, e.target.value, active);
  }

  // Called when the user clicks on the pipes bubble in the bottom left. Opens a box that allows
  // them to edit the number of pipes they have. 
  const openPipes = () => {
    setEditPipes(true);
  }

  // Called when the user closes the pipes box.
  const closePipes = (p: string) => {
    setEditPipes(false);
    setPipes(p);
  }

  // Called when the user clicks the save button from within the edit popup. Updates the array
  // of plants to contain the updated version of the plant. 
  const updateCard = (updatedPlant) => {
    setPlantArr((prevPlants) =>
      prevPlants.map((plant) => (plant.id === updatedPlant.id ? updatedPlant : plant))
    );
  }

  // Called when the user blicks the delete button from within the edit popup. Updates the array
  // of plants to not include the given plant. 
  const handleRemove = (pid) => {
    handleClose();
    setPlantArr(arr => arr.filter(plant => plant.id !== pid));
  }

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
            className="Card w-96 h-72 rounded-xl bg-white shadow-lg"
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
            <p className="pl-4">Pipe Number: {plant.pipe_id || "None"}</p>
          </div>
        ))}
      </div>
      <button className="fixed bottom-8 left-8 ActionButton !rounded-full !w-auto !px-4" onClick={openPipes}>
        Pipes: {pipes}
      </button>
      <Modal
        open={editPipes} 
        onClose={handleClose}
        aria-labelledby="plant-details-modal"
        aria-describedby="plant-details-description"
      >
        <Box
          sx={{
            position: "fixed",
            bottom: "1.9rem",
            left: "1.9rem",
            width: "25rem",
            height: "9rem",
            bgcolor: "background.paper",
            boxShadow: 24,
            borderRadius: 6,
          }}
          style={{ border: "none"}}
        >
          <PipesPopup pipes={pipes} uid={uid} handleClose={closePipes} handleUpdate={updateCard}/>
        </Box>
      </Modal>
      <Modal
        open={!!selectedPlant} // Only open when a plant is selected
        onClose={handleClose}
        aria-labelledby="plant-details-modal"
        aria-describedby="plant-details-description"
        style={{ border: "none"}}
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
            <EditPopup plantName={selectedPlant.name} pipes={pipes} uid={uid} handleClose={handleClose} handleUpdate={updateCard} handleRemove={handleRemove}/>
          )}
        </Box>
      </Modal></>}
    </div>
}
