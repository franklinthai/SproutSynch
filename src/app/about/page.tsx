'use client'
import ResponsiveAppBar from "../navbar"

export default function About() {
    return <div className="text-center">
        <ResponsiveAppBar/>
        <h1 className="mt-12 mb-4">About SproutSynch</h1>
        <p className="mt-4">SproutSynch is a project developed by 8 students at the University of Washington as a part of Husky Coding Project.</p>
    </div>
}