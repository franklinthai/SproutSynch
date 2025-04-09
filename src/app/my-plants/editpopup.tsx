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
import { doc, updateDoc} from "firebase/firestore";
import { db } from "../../utils/firebaseconfig";
import { fetchPlantByName } from "@/utils/firestore";

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

const gridItemStyle = {
  marginBottom: "16px",
};

interface EditPopupProps {
  plantId: string;
  uid: string;
  handleClose: () => void;
}

export default function EditPopup({ plantId, uid, handleClose }: EditPopupProps) {
  const [plant, setPlant] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [updatedPlant, setUpdatedPlant] = useState(null);

  useEffect(() => {
    async function fetchData() {
      const data = await fetchPlantByName(plantId, uid);
      setPlant(data);
      setUpdatedPlant(data); // Initialize updatedPlant with fetched data
    }

    if (plantId) {
      fetchData();
    }
  }, [plantId]);

  const handleEditToggle = () => {
    if (!isEditing) {
      // Switch to editing mode, initialize fields if not already done
      setUpdatedPlant({ ...plant });
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    if (updatedPlant) {
      const plantDoc = doc(db, "users", uid, "plants", updatedPlant.id);
      await updateDoc(plantDoc, {
        species: updatedPlant.species,
        description: updatedPlant.description,
        duration: updatedPlant.duration,
        interval: updatedPlant.interval
        //soil_moisture: updatedPlant.soil_moisture,
      });
      setPlant(updatedPlant); // Update the displayed data
      setIsEditing(false); // Exit editing mode
    }
  };

  const handleChange = (field, value) => {
    setUpdatedPlant((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

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
              onClick={isEditing ? handleSave : handleEditToggle}
            >
              {isEditing ? <SaveIcon fontSize="small" /> : <EditIcon fontSize="small" />}
            </IconButton>
          </Typography>
        }
      />
      <CardMedia component="img" height="194" image={plantIcon.src} alt="Plant Icon" />
      <CardContent>
        <Typography variant="h6" sx={{ ...titleStyle, fontSize: "20px", marginBottom: 1 }}>
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
          <Typography variant="body1" sx={{ ...textStyle, fontSize: "20px", marginBottom: 3 }}>
            {plant.species || "Unknown"}
          </Typography>
        )}

        <Typography variant="h6" sx={{ ...titleStyle, fontSize: "20px", marginBottom: 1 }}>
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
          <Typography variant="body1" sx={{ ...textStyle, fontSize: "20px", marginBottom: 3 }}>
            {plant.description}
          </Typography>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "16px",
          }}
        >
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
              Soil Moisture
            </Typography>
            {isEditing ? (
              <TextField
                type="number"
                fullWidth
                variant="outlined"
                value={updatedPlant?.soil_moisture || ""}
                onChange={(e) => handleChange("soil_moisture", parseInt(e.target.value))}
              />
            ) : (
              <Typography variant="body1" sx={textStyle}>
                {plant.soil_moisture || 45}%
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
