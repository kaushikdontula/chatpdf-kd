import { Pinecone } from '@pinecone-database/pinecone';
import { downloadFromS3 } from './db/s3-server';
import {PDFLoader} from 'langchain/document_loaders/fs/pdf'

let pc: Pinecone | null = null;

export const getPineconeClient = async() => {
    // Initialize Pinecone client with your API key
    pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,  // It's better to use environment variables for security
    });

    // Access an index
    const index = pc.index('chatpdf-kd');  // Replace 'your-index-name' with the name of your Pinecone index

    return pc
}

// type PDFPage = {
//     pageContent: string; 
//     metadata: {
//         loc: {pageNumber: number}
//     }
// }

export async function loadS3IntoPinecone(fileKey: string){
    
    //obtain pdf -> download and read from the pdf
    console.log('downloading s3 into file system')

    const file_name = await downloadFromS3(fileKey); 
    
    if(!file_name){
        throw new Error('Could not download from s3');
    }

    const loader = new PDFLoader(file_name);
    const pages = await loader.load(); 

    return pages;


}

