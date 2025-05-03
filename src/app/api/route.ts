import { NextResponse } from 'next/server'
import { fetchFirestore, updateLastWatered, fetchPlantByName } from '@/utils/firestore'


// function to get plants from a user
export async function GET(request: Request) {
    // will need more verification for 

    const url: URL = new URL(request.url);          
    const queryParameters: URLSearchParams = url.searchParams; 
    const uid: string | null = queryParameters.get('uid'); 

    if(uid == null) {
        return NextResponse.json({ error: 'uid is invalid' }, { status: 400 });
    }

    
    const plantArr = await fetchFirestore(uid);
    // naive send all plants maybe parse depneding on pipe id
    console.log(plantArr);
    // 500, 400 etc return status code given different requests.
    return NextResponse.json(
        {plants : plantArr}, {status : 200}
    );
    
}

// function to take a request from hardware and update plants with time given
export async function PUT(request: Request) {
    // parse the body into json
    request.json().then(
        // success
        (data) => {
            // data should be in form
            // {
            //     "uid": "<uid string>", 
            //     "time": "<UTC time in ISO format>",
            //     "names": [
            //         "name1", 
            //         "name2",
            //         "name3"
            //     ]
            // }
            const uid = data.uid;
            const time = data.time;
            const names = data.names;
            
            // update the plant for each name in the names list
            names.forEach(async (name) => {
                const plant = await fetchPlantByName(name, uid);
                if (!plant.hasOwnProperty("id")) return NextResponse.json({error: "could not find plant"}, {status: 500});
                await updateLastWatered(uid, plant.id, time);
            });
        },
        // failed to get data
        (reason) => {
            return NextResponse.json({error: "failed to retrieve data: " + reason}, {status: 400});
        }
    );

    return NextResponse.json(
        {status: 200}
    );
}