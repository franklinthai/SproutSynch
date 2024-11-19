'use client'
import { useRouter } from "next/navigation";
import { db } from "./firebaseconfig"
import React, { useEffect, useState } from "react";
import { getDocs, collection, addDoc, deleteDoc, doc } from "firebase/firestore";

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center">
      <h1 className="font-bold text-2xl pb-4 text-center m-8">SproutSynch</h1>
      <button onClick={() => router.push("/add")} className="border-2 mt-4 p-1 rounded-2xl w-32 hover:bg-green-600 text-white" type="button">Add a plant</button>
      <button onClick={() => router.push("/edit/Howie")} className="border-2 mt-4 p-1 rounded-2xl w-32 hover:bg-green-600 text-white" type="button">Edit a plant</button>
    </div>
  );
}
