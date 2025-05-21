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
import DeleteIcon from "@mui/icons-material/Delete"
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import plantIcon from "./../../../assets/plantIcon.png";
import { getDocs, collection, doc, updateDoc, query, where } from "firebase/firestore";
import { db } from "../../utils/firebaseconfig";
import { fetchPlantByName, deleteFirestore } from "@/utils/firestore";
import { MenuItem, Select } from "@mui/material";

// CSS for the titles.
const titleStyle = {
  color: "text.primary",
  fontFamily: "Open Sans, sans-serif",
  fontWeight: 700,
  fontSize: "18px",
  lineHeight: "30px",
};

// CSS for the text.
const textStyle = {
  color: "text.secondary",
  fontFamily: "Open Sans, sans-serif",
  fontWeight: 400,
  fontSize: "18px",
  lineHeight: "30px",
  marginTop: "4px",
};

// CSS for the grid.
const gridItemStyle = {
  marginBottom: "16px",
};

// Interface for the main function.
interface EditPopupProps {
  plantName: string;
  pipes: string;
  uid: string;
  handleClose: () => void;
  handleUpdate: (updatedPlant: any) => void;
  handleRemove: (pid: any) => void;
}

// The edit popup, which is a popup that appears when the user clicks on one of their plants on
// the my-plants page. It allows the user to edit the species, description, duration, interval
// and pipe number of their plant.
export default function EditPopup({ plantName, pipes, uid, handleClose, handleUpdate, handleRemove}: EditPopupProps) {
  const [plant, setPlant] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [updatedPlant, setUpdatedPlant] = useState(null);

  // Called when plantName changes (i.e. when the popup is created). Sets the plant data for the popup based on the name
  useEffect(() => {
    async function fetchData() {
      const data = await fetchPlantByName(plantName, uid);
      setPlant(data);
      // Initialize updatedPlant with fetched data
      setUpdatedPlant(data);
    }

    if (plantName) {
      fetchData();
    }
  }, [plantName]);

  // Called when the edit button is clicked. Turns on editing mode.
  const handleEdit = () => {
    if (!isEditing) {
      // Switch to editing mode, initialize fields if not already done
      setUpdatedPlant({ ...plant });
    }
    setIsEditing(true);
  };

  // Called when the user clicks the save button. Makes sure all fields are valid before
  // updating the plant.
  const handleSave = async () => {
    if (updatedPlant) {
      try {
        if (updatedPlant.duration <= 0) throw new Error("Duration must be positive");
        if (updatedPlant.interval <= 0) throw new Error("Interval must be positive");
        // check if another plant is already using the pipe id
        const plantQuery = query(collection(db, "users", uid, "plants"), where("pipe_id", "==", updatedPlant.pipe_id));
        const querySnapshot = await getDocs(plantQuery);
        querySnapshot.forEach((doc) => {
          if (doc.id !== updatedPlant.id) {
            throw new Error("Pipe number already in use");
          }
        });
        // update plant
        const plantDoc = doc(db, "users", uid, "plants", updatedPlant.id);
        await updateDoc(plantDoc, {
          species: updatedPlant.species,
          description: updatedPlant.description,
          duration: updatedPlant.duration,
          pipe_id: updatedPlant.pipe_id,
          interval: updatedPlant.interval,
          //soil_moisture: updatedPlant.soil_moisture,
        });
        // update the displayed data
        setPlant(updatedPlant); 
        // exit editing mode
        setIsEditing(false); 
        // update the plant in the main page
        handleUpdate(updatedPlant); 
      } catch (error) {
        alert(error);
      }
    }
  };

  // Called when the user clicks the delete button. Prompts them to confirm their choice and
  // removes the plant from Firestore and from the current instance of the my-plants page.
  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this plant?")) {
      try {
        await deleteFirestore(uid, plant.id);
        // remove plant from the my-plants page
        handleRemove(plant.id)
      } catch (error) {
        alert(error);
      }
    }
  }

  // Called when any of the editable fields are changed. Updates the UpdatedPlant variable.
  const handleChange = (field, value) => {
    setUpdatedPlant((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Calculates the next watering field.
  const calculateNextWatering = () => {
    if (plant?.last_watered && plant?.interval) {
      const nextWateringDate = new Date(
        new Date(plant.last_watered).getTime() + plant.interval * 24 * 60 * 60 * 1000
      );
      return nextWateringDate.toLocaleDateString();
    }
    return "Unknown";
  };

  if (!plant) {
    return <p>Loading plant details...</p>;
  }

  return (
    <Card sx={{ maxWidth: "100%" }} style={{ border: "none"}}>
      <CardHeader
        action={
          <IconButton onClick={handleClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        }
        title={
          <Typography variant="h6" component="div" sx={{ display: "flex", alignItems: "center" }}>
            {plant.name}
            
            <IconButton
              aria-label={isEditing ? "save" : "edit"}
              size="small"
              sx={{ ml: 1 }}
              onClick={isEditing ? handleSave : handleEdit}
            >
              {isEditing ? <SaveIcon fontSize="small" /> : <EditIcon fontSize="small" />}
            </IconButton>

            {isEditing ? <IconButton
              aria-label="delete"
              size="small"
              sx={{ ml: 1 }}
              onClick={isEditing ? handleDelete : null}
            >
              <DeleteIcon fontSize="small"/>
            </IconButton> : <></>}
          </Typography>
        }
      />
      <CardMedia component="img" height="194" image={plantIcon.src} alt="Plant Icon" />
      <CardContent>

      <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "16px",
          }}
        >
          <div style={gridItemStyle}>
          <Typography variant="h6" sx={{ ...titleStyle, fontSize: "20px"}}>
            Species
          </Typography>
          {isEditing ? (
            <TextField
              fullWidth
              variant="outlined"
              value={updatedPlant?.species || ""}
              onChange={(e) => handleChange("species", e.target.value)}
            />
        ) : (
            <Typography variant="body1" sx={{ ...textStyle, fontSize: "20px"}}>
              {plant.species || "Unknown"}
            </Typography>
          )}
          </div>

          <div style={gridItemStyle}>
          <Typography variant="h6" sx={{ ...titleStyle, fontSize: "20px"}}>
            Description
          </Typography>
          {isEditing ? (
            <TextField
              fullWidth
              variant="outlined"
              value={updatedPlant?.description || ""}
              onChange={(e) => handleChange("description", e.target.value)}
            />
          ) : (
            <Typography variant="body1" sx={{ ...textStyle, fontSize: "20px"}}>
              {plant.description}
            </Typography>
          )}
          </div>

      
          <div style={gridItemStyle}>
            <Typography variant="body2" sx={titleStyle}>
              Duration
            </Typography>
            {isEditing ? (
              <TextField
                type="number"
                fullWidth
                variant="outlined"
                value={updatedPlant?.duration || ""}
                onChange={(e) => handleChange("duration", parseInt(e.target.value))}
              />
            ) : (
              <Typography variant="body1" sx={textStyle}>
                {plant.duration} seconds
              </Typography>
            )}
          </div>

          <div style={gridItemStyle}>
            <Typography variant="body2" sx={titleStyle}>
              Interval
            </Typography>
            {isEditing ? (
              <TextField
                type="number"
                fullWidth
                variant="outlined"
                value={updatedPlant?.interval || ""}
                onChange={(e) => handleChange("interval", parseInt(e.target.value))}
              />
            ) : (
              <Typography variant="body1" sx={textStyle}>
                {plant.interval} Days
              </Typography>
            )}
          </div>

          <div style={gridItemStyle}>
            <Typography variant="body2" sx={titleStyle}>
              Pipe Number
            </Typography>
            {isEditing ? (
              <Select
                type="number"
                fullWidth
                variant="outlined"
                value={updatedPlant?.pipe_id || "None"}
                onChange={(e) => handleChange("pipe_id", parseInt(e.target.value))}
              >
                <MenuItem value={0}>None</MenuItem>
                {
                   Number.isInteger(parseInt(pipes)) && parseInt(pipes) > 0
                   ? [...Array(parseInt(pipes)).keys()].map((i) => (
                       <MenuItem key={i} value={i + 1}>
                         {i + 1}
                       </MenuItem>
                     ))
                   : null
                }
              </Select>
            ) : (
              <Typography variant="body1" sx={textStyle}>
                {plant.pipe_id || "None"}
              </Typography>
            )}
          </div>

          <div style={gridItemStyle}>
            <Typography variant="body2" sx={titleStyle}>
              Last Watered
            </Typography>
            <Typography variant="body1" sx={textStyle}>
              {new Date(plant.last_watered).toLocaleDateString()}
            </Typography>
          </div>

          <div>
            <Typography variant="body2" sx={titleStyle}>
              Next Watering
            </Typography>
            <Typography variant="body1" sx={textStyle}>
              {calculateNextWatering()}
            </Typography>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
