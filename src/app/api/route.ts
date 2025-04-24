import { NextResponse } from 'next/server'
import { fetchFirestore } from '@/utils/firestore'


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
    const data = await request.json;
    // might have to do authroization with headers

    // verify information and type stuff so given plant names and a time update them accordingly

    // 500, 400, 200 etc return status code given different requests.
    
    // create function that updates specific plants with time given in firestore.ts

    return NextResponse.json({
        hello : "World",
    });
 
}