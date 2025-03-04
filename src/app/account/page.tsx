'use client'
import ResponsiveAppBar from "../navbar"
import { onAuthStateChanged, updateProfile, updateEmail, updatePassword } from "firebase/auth";
import { auth } from "../firebaseconfig";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EditIcon from "@mui/icons-material/Edit";
import IconButton from "@mui/material/IconButton";
import SaveIcon from "@mui/icons-material/Save";


// possible features: 
//   - change password
//   - change email
//   - delete account
export default function About() {
    const router = useRouter();
    const [uid, setUid] = useState(undefined);
    const [displayName, setDisplayName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("••••••••••");
    const [displayNameEdit, setDisplayNameEdit] = useState(false);
    const [updatedDisplayName, setUpdatedDisplayName] = useState("");
    const [passwordEdit, setPasswordEdit] = useState(false);
    const [updatedPassword, setUpdatedPassword] = useState("");
    
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

    const handleDisplayNameSave = async () => {
        try {
            if (updatedDisplayName === undefined || updatedDisplayName === null) throw new Error("Display name is null or undefined");
            if (updatedDisplayName.length > 40) throw new Error("Display name must be less than 40 characters");
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
    
    const handleDisplayNameEdit = () => {
        setUpdatedDisplayName(displayName === undefined ? "" : displayName);
        setDisplayNameEdit(true);
    }

    const handlePasswordSave = async () => {
        try {
            if (updatedPassword === "" || updatedPassword === undefined || updatedPassword === null) throw new Error("Password is empty");
            if (updatedPassword.length < 6) throw new Error("Password must be at least 6 characters")
            if (updatedPassword !== password) {
                if (confirm("Are you sure you want to change your password to " + updatedPassword + "?")) {
                    updatePassword(auth.currentUser, updatedPassword).then(() => {
                        alert("Successfully changed password");
                        setPassword(updatedPassword);
                        setPasswordEdit(false);
                    }).catch((error) => {
                        alert(error);
                    });
                    
                }
            } else {
                setPasswordEdit(false);
            }
        } catch(error) {
            alert(error);
        }
    }

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