'use client'
import ResponsiveAppBar from "../navbar"

// possible features: 
//   - change password
//   - change email
//   - delete account
export default function About() {
    return <div className="text-center">
        <ResponsiveAppBar/>
        <h1 className="mt-12 mb-4">Profile</h1>
        <p className="mt-4">Coming soon</p>
    </div>
}