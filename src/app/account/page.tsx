'use client'
import ResponsiveAppBar from "../navbar"
import { onAuthStateChanged, updateProfile, updatePassword } from "firebase/auth";
import { auth } from "../../utils/firebaseconfig";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EditIcon from "@mui/icons-material/Edit";
import IconButton from "@mui/material/IconButton";
import SaveIcon from "@mui/icons-material/Save";


// The account page, which allows users to edit their display name and password.
export default function Account() {
  const router = useRouter();
  const [uid, setUid] = useState(undefined);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("••••••••••");
  const [displayNameEdit, setDisplayNameEdit] = useState(false);
  const [updatedDisplayName, setUpdatedDisplayName] = useState("");
  const [passwordEdit, setPasswordEdit] = useState(false);
  const [updatedPassword, setUpdatedPassword] = useState("");
  
  // Runs when the page is loaded, and ensures that the user is logged in.
  useEffect(()=>{
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
        setDisplayName(user.displayName);
        setEmail(user.email);
      } else {
        router.push("/");
      }
    });
  }, []);

  // Called when the user clicks save on the display name. Updates the profile of the user
  // through Firestore and sets the display name field back to view only.
  const handleDisplayNameSave = async () => {
    try {
      if (updatedDisplayName === undefined || updatedDisplayName === null) {
        throw new Error("Display name is null or undefined");
      }
      if (updatedDisplayName.length > 40) {
        throw new Error("Display name must be less than 40 characters");
      }
      // only push to Firestore if a change was made
      if (updatedDisplayName !== displayName) {
        updateProfile(auth.currentUser, {
        displayName: updatedDisplayName
        }).then(() => {
          alert("Successfully changed display name");
        }).catch((error) => {
          alert(error);
        });
        setDisplayName(updatedDisplayName);
      }
      setDisplayNameEdit(false);
    } catch(error) {
      alert(error);
    }
  }
  
  // Called when the user clicks the edit button on their display name and sets it to edit mode. 
  const handleDisplayNameEdit = () => {
    setUpdatedDisplayName(displayName === undefined ? "" : displayName);
    setDisplayNameEdit(true);
  }

  // Called when the user clicks the save button on their password. Prompts the user to confirm
  // their choice and updates their password in Firestore before setting the field back to view
  // only.
  const handlePasswordSave = async () => {
    try {
      if (updatedPassword === "" || updatedPassword === undefined || updatedPassword === null) {
        throw new Error("Password is empty");
      }
      if (updatedPassword.length < 6) {
        throw new Error("Password must be at least 6 characters")
      }
      // only push to Firestore if a change was made
      if (updatedPassword !== password && confirm("Are you sure you want to change your password to " + updatedPassword + "?")) {
        updatePassword(auth.currentUser, updatedPassword).then(() => {
          alert("Successfully changed password");
          setPassword(updatedPassword);
          setPasswordEdit(false);
        }).catch((error) => {
          alert(error);
        }); 
      } else {
        setPasswordEdit(false);
      }
    } catch(error) {
      alert(error);
    }
  }

  // Called when the user clicks the edit button on their password and sets it to edit mode.
  const handlePasswordEdit = () => {
    setUpdatedPassword("");
    setPasswordEdit(true);
  }
  
  return <div className="flex flex-col items-center">
    <ResponsiveAppBar/>
    <h1 className="mt-12 mb-4">Account</h1>
    <div className="w-1/3">
      <div className="Label">Display Name:  
        <IconButton
          aria-label={displayNameEdit ? "save" : "edit"}
          size="small"
          sx={{ ml: 1 }}
          onClick={displayNameEdit ? handleDisplayNameSave : handleDisplayNameEdit}
        >
        {displayNameEdit ? <SaveIcon fontSize="small"/> : <EditIcon fontSize="small" />}
        </IconButton>
      </div>
      {displayNameEdit ? 
        <input value={updatedDisplayName} className="w-full" onChange={(e) => setUpdatedDisplayName(e.target.value)} autoFocus></input> 
        : 
        <div className="EmptyInput w-full">{displayName}</div>
      }  
      <div className="Label">Email:</div>
      <div className="EmptyInput w-full">{email}</div>
      <div className="Label">Password:  
        <IconButton
          aria-label={displayNameEdit ? "save" : "edit"}
          size="small"
          sx={{ ml: 1 }}
          onClick={passwordEdit ? handlePasswordSave : handlePasswordEdit}
        >
        {passwordEdit ? <SaveIcon fontSize="small"/> : <EditIcon fontSize="small" />}
        </IconButton>
      </div>
      {passwordEdit ? 
        <input value={updatedPassword} className="w-full" onChange={(e) => setUpdatedPassword(e.target.value)} autoFocus></input> 
        : 
        <div className="EmptyInput w-full">{password}</div>
      } 
    </div>
  </div>
}