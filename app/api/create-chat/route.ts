// // /api/create-chat
// import { NextResponse } from "next/server"


// export async function POST(req: Request, res: Response) {
//     try{
//         const body = await req.json()
//         const {file_key, file_name} = body

//     } catch (error) {
//         console.error(error)
//         return NextResponse.json(
//             {error: "Internal server error"}, {
//                 status: 500}
//         )
//     }
// }

// /api/create-chat
import { loadS3IntoPinecone } from "@/lib/pinecone";
import { NextResponse } from "next/server";

export async function POST(req: Request, res: Response) {
    try {
        const body = await req.json();
        const { file_key, file_name } = body;

        // Validate or process data here if needed
        console.log(file_key, file_name);

        const pages = await loadS3IntoPinecone(file_key);

        return NextResponse.json({pages});
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
