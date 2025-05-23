import Image from 'next/image';
import ResponsiveAppBar from "../navbar"
import franklin from "../../../assets/franklin.png";
import vash from "../../../assets/vash.png";
import emily from "../../../assets/emily.png";
import perry from "../../../assets/perry.png";
import kelly from "../../../assets/kelly.png";

// The about page containing information about SproutSynch and a picture of each member.
export default function About() {
  return <div className="text-center">
    <ResponsiveAppBar/>
    <h1 className="mt-12 mb-4">About SproutSynch</h1>
    <p className="mt-4">SproutSynch is a project developed by 5 students at the University of Washington as a part of Husky Coding Project.</p>
    <h1 className="mt-12 mb-4">Our Team</h1>
    <div className="grid grid-cols-3 max-w-screen-xl text-center m-auto">
      <div className="flex items-center flex-col border-r GreenBorder">
        <h2 className="mb-6">Software</h2>
        <Image
          src={franklin}
          alt="Plant"
          className="Portrait object-contain aspect-square"
        />
        <p className="text-xl mb-6">Franklin Thai</p>
        <Image
          src={vash}
          alt="Plant"
          className="Portrait object-contain aspect-square"
        />
        <p className="text-xl mb-6">Vashon Mavrinac</p>
      </div>
      <div className="flex items-center flex-col border-x GreenBorder">
        <h2 className="mb-6">Hardware</h2>
        <Image
          src={perry}
          alt="Plant"
          className="Portrait object-contain aspect-square"
        />
        <p className="text-xl mb-6">Perry Chien</p>
        <Image
          src={emily}
          alt="Plant"
          className="Portrait object-contain aspect-square"
        />
        <p className="text-xl mb-6">Emily Ngo</p>
      </div>
      <div className="flex items-center flex-col border-l GreenBorder">
        <h2 className="mb-6">Design</h2>
        <Image
          src={kelly}
          alt="Plant"
          className="Portrait object-contain aspect-square"
        />
        <p className="text-xl mb-6">Kelly Thai</p>
      </div>
    </div>
  </div>
}