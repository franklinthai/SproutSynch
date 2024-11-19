"use client"
import { useRouter } from "next/navigation";
import { db } from "../firebaseconfig";
import React, { useEffect, useState } from "react";
import { getDocs, collection, addDoc, deleteDoc, doc } from "firebase/firestore";
const { DateTime } = require("luxon");

async function editFirestore(species, interval, time, ampm) {
    try {

    } catch(error) {

    }

    
}

export default function Edit() {
    return <div><p>Hello World!</p></div>        
}