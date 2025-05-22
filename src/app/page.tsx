'use client'
import { useRouter } from "next/navigation";
import ResponsiveAppBar from "./navbar";
import plant from './../../assets/hello.png';
import Image from 'next/image';
import './globals.css';

// TODO FIX BUTTON 
// TODO IMAGE LOOKS JANK POSSIBLY SWITCH TO SVG
export default function Home() {
  const router = useRouter();

  return (
    <div>
      <ResponsiveAppBar></ResponsiveAppBar>
      <div className="flex flex-col lg:flex-row justify-around items-center min-h-screen px-4 py-8">
        <div className="flex flex-col space-y-4 max-w-md text-center lg:text-left">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">
            Let's start <br /> watering!
          </h1>
          <p className="text-base sm:text-lg md:text-xl">
            Help take care of your plants by tracking <br />
            watering schedules and soil moisture. Add your <br />
            plants and get started on keeping them healthy <br />
            and happy.
          </p>
          <button
            className="ActionButton w-fit mx-auto lg:mx-0"
            onClick={() => router.push("/add")}
            type="button"
          >
            Add a plant
          </button>
        </div>
        <div className="relative bg-custom-gradient rounded-full overflow-hidden w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 shadow-md mt-8 lg:mt-0">
          <Image
            src={plant}
            alt="Plant"
            fill
            className="object-contain"
          />
        </div>
      </div>
    </div>
  );
}
