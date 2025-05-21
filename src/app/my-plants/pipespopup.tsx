"use client";
import React, { useState } from "react";
import CardContent from "@mui/material/CardContent";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import { getDocs, collection, doc, updateDoc, query, where } from "firebase/firestore";
import { db } from "../../utils/firebaseconfig";
import { text } from "stream/consumers";

// CSS for the text
const textStyle = {
  color: "text.primary",
  fontFamily: "Open Sans, sans-serif",
  fontWeight: 700,
  fontSize: "18px",
  lineHeight: "30px",
};

// Interface for the main function.
interface EditPopupProps {
  pipes: string;
  uid: string;
  handleClose: (pipes: string) => void;
  handleUpdate: (updatedPlant: any) => void;
}

// The pipes popup, which is called whenever the user clicks the pipes button at the bottom left
// of the my plants page.
export default function PipesPopup({ pipes, uid, handleClose, handleUpdate }: EditPopupProps) {
  const [pipesVal, setPipesVal] = useState(pipes);

  // fixes an error where a component changes an uncontrolled input to be controlled.
  // initial state for pipes could be undefined, so we set it to 0
  if(pipes === undefined) {
    pipes = "0";
  }

  // Called when the save button is clicked. Updates Firestore with the new pipe number, and if the
  // pipe number was decreased, checks each of the user's plants and sets their pipe id to 0 if
  // it is no longer valid.
  const handleSave = async () => {
    try {
      if (pipesVal === "") throw new Error("Pipes value is required");
      const pipesInt = parseInt(pipesVal);
      if (isNaN(pipesInt)) throw new Error("Pipes value must be a number");
      if (pipesInt <= 0) throw new Error("Pipes value must be positive");
      if (pipesInt > 99) throw new Error("Pipes value is too high");
      const docRef = doc(db, "users", uid);
      // update Firestore
      await updateDoc(docRef, { pipes: pipesInt });
      // if the user decreased the pipes number, check each plant to check if its pipe id is no
      // longer valid.
      if (pipesInt < parseInt(pipes)) {
        // get all of the user's plants whose pipe id is less than the new pipe number
        const plantQuery = query(collection(db, "users", uid, "plants"), where("pipe_id", ">", pipesInt));
        const querySnapshot = await getDocs(plantQuery);
        // set each of their pipe ids to 0
        querySnapshot.forEach(async (plant) => {
          const plantDoc = doc(db, "users", uid, "plants", plant.id);
          await updateDoc(plantDoc, { pipe_id: 0 });
          // send update call back to my plants page
          handleUpdate({ id: plant.id, ...plant.data(), pipe_id: 0});
        });
      }
      // close the popup after saving
      handleClose(pipesVal); 
    } catch (error) {
      alert(error);
    }
  };

  return (
    <div>
      <IconButton onClick={(e) => handleClose(pipes)} aria-label="close" sx={{ position: "absolute", right: 14, top: 10 }}>
        <CloseIcon/>
      </IconButton>
      <CardContent>
        <Typography variant="h6" sx={{ ...textStyle, fontSize: "15px", marginBottom: 1, marginTop: 3 }}>
          Enter the total number of pipes you have
        </Typography>
        <div className="flex items-center">
            <Typography variant="h6" sx={{ ...textStyle, fontSize: "20px", marginRight: 1 }}>
            Pipes:
            </Typography>
            <TextField
                fullWidth
                variant="outlined"
                size="small"
                value={pipesVal}
                onChange={(e) => setPipesVal(e.target.value)}
            />    
            <IconButton
              aria-label="save"
              sx={{ ml: "auto" }}
              onClick={handleSave}
            >
              <SaveIcon fontSize="small" />
            </IconButton>
        </div>    
      </CardContent>
    </div>
  );
}
