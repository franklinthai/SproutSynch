"use client"
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import IconButton, { IconButtonProps } from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import plantIcon from './../../../assets/plantIcon.png';
import CloseIcon from '@mui/icons-material/Close';
import React, { useEffect, useState } from "react";
import EditIcon from '@mui/icons-material/Edit';
import { getDocs, collection, doc, updateDoc, orderBy, query, where } from "firebase/firestore";
const { DateTime } = require("luxon");
import { db } from "../firebaseconfig";

const titleStyle = {
  color: 'text.primary',
  fontFamily: 'Open Sans, sans-serif',
  fontWeight: 700,
  fontSize: '18px',
  lineHeight: '30px',
};

const textStyle = {
  color: 'text.secondary',
  fontFamily: 'Open Sans, sans-serif',
  fontWeight: 400,
  fontSize: '18px',
  lineHeight: '30px',
  marginTop: '4px', // Space between title and text
};

const gridItemStyle = {
  marginBottom: '16px',
};

interface RecipeReviewCardProps {
  plantId: string;
}

export async function fetchPlantByName(name) {
  
  const plantQuery = query(collection(db, "plants"), where("name", "==", name));
  const querySnapshot = await getDocs(plantQuery);
  const plant = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return plant[0]; // Return the first matching plant
  
}

export default function RecipeReviewCard({ plantId }: RecipeReviewCardProps) {
  const [plant, setPlant] = useState(null);
  useEffect(() => {
    async function fetchData() {
        const data = await fetchPlantByName(plantId); // Fetch plant data by ID or name
        setPlant(data);
    }

    if (plantId) {
      fetchData();
    }
  }, [plantId]);

  if (!plant) {
    // Render a loading or fallback message if plant data is not yet available
    return <p>Loading plant details...</p>;
  }

  return (
    <Card sx={{ maxWidth: 600 }}>
      <CardHeader
        action={
          <IconButton aria-label="close">
            <CloseIcon />
          </IconButton>
        }
        title={
          <Typography variant="h6" component="div" sx={{ display: 'flex', alignItems: 'center' }}>
            {plant.name}
            <IconButton
              aria-label="edit"
              size="small"
              sx={{ ml: 1 }} // Add spacing between the title and the icon
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Typography>
        }
      />
      <CardMedia
        component="img"
        height="194"
        image={plantIcon.src}
        alt="Plant Icon"
      />

      <CardContent>
        <Typography variant="h6" sx={{ ...titleStyle, fontSize: '20px', marginBottom: 1 }}>
          Species
        </Typography>
        <Typography variant="body1" sx={{ ...textStyle, fontSize: '20px', marginBottom: 3 }}>
          {plant?.species || 'Unknown'}
        </Typography>

        <Typography variant="h6" sx={{ ...titleStyle, fontSize: '20px', marginBottom: 1 }}>
          Description
        </Typography>
        <Typography variant="body1" sx={{ ...textStyle, fontSize: '20px', marginBottom: 3 }}>
          A beautiful tropical plant known for its distinctive split leaves.
        </Typography>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)', // Two equal columns
            gap: '16px', // Space between items
          }}
        >
          <div style={gridItemStyle}>
            <Typography variant="body2" sx={titleStyle}>
              Duration
            </Typography>
            <Typography variant="body1" sx={textStyle}>
              10 seconds
            </Typography>
          </div>

          <div style={gridItemStyle}>
            <Typography variant="body2" sx={titleStyle}>
              Soil Moisture
            </Typography>
            <Typography variant="body1" sx={textStyle}>
              45%
            </Typography>
          </div>

          <div style={gridItemStyle}>
            <Typography variant="body2" sx={titleStyle}>
              Last Watered
            </Typography>
            <Typography variant="body1" sx={textStyle}>
              {plant?.last_watered
                ? new Date(plant.last_watered).toLocaleDateString()
                : 'Unknown'}
            </Typography>
          </div>

          <div>
            <Typography variant="body2" sx={titleStyle}>
              Next Watering
            </Typography>
            <Typography variant="body1" sx={textStyle}>
              {plant?.interval && plant?.last_watered
                ? new Date(
                    new Date(plant.last_watered).getTime() +
                      plant.interval * 24 * 60 * 60 * 1000
                  ).toLocaleDateString()
                : 'Unknown'}
            </Typography>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}