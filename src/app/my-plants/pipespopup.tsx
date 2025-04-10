"use client";
import React, { useEffect, useState } from "react";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardMedia from "@mui/material/CardMedia";
import CardContent from "@mui/material/CardContent";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import plantIcon from "./../../../assets/plantIcon.png";
import { getDocs, collection, doc, updateDoc, query, where } from "firebase/firestore";
import { db } from "../firebaseconfig";

const titleStyle = {
  color: "text.primary",
  fontFamily: "Open Sans, sans-serif",
  fontWeight: 700,
  fontSize: "18px",
  lineHeight: "30px",
};

const textStyle = {
  color: "text.secondary",
  fontFamily: "Open Sans, sans-serif",
  fontWeight: 400,
  fontSize: "18px",
  lineHeight: "30px",
  marginTop: "4px",
};

interface EditPopupProps {
  pipes: string;
  uid: string;
  handleClose: (pipes: string) => void;
  handleUpdate: (updatedPlant: any) => void;
}

export default function PipesPopup({ pipes, uid, handleClose, handleUpdate }: EditPopupProps) {
  const [pipesVal, setPipesVal] = useState(pipes);

  const handleSave = async () => {
    try {
      if (pipesVal === "") throw new Error("Pipes value is required");
      const pipesInt = parseInt(pipesVal);
      if (isNaN(pipesInt)) throw new Error("Pipes value must be a number");
      if (pipesInt <= 0) throw new Error("Pipes value must be positive");
      if (pipesInt > 99) throw new Error("Pipes value is too high");
      const docRef = doc(db, "users", uid);
      await updateDoc(docRef, { pipes: pipesInt });
      if (pipesInt < parseInt(pipes)) {
        const plantQuery = query(collection(db, "users", uid, "plants"), where("pipe_id", ">", pipesInt));
        const querySnapshot = await getDocs(plantQuery);
        querySnapshot.forEach(async (plant) => {
          const plantDoc = doc(db, "users", uid, "plants", plant.id);
          await updateDoc(plantDoc, { pipe_id: 0 });
          console.log("plant: ", { id: plant.id, ...plant.data(), pipe_id: 0});
          handleUpdate({ id: plant.id, ...plant.data(), pipe_id: 0});
        });
      }
      handleClose(pipesVal); // Close the popup after saving
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
        <Typography variant="h6" sx={{ ...titleStyle, fontSize: "15px", marginBottom: 1, marginTop: 3 }}>
          Enter the total number of pipes you have
        </Typography>
        <div className="flex items-center">
            <Typography variant="h6" sx={{ ...titleStyle, fontSize: "20px", marginRight: 1 }}>
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
