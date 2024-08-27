import { Pinecone, Vector, utils as PineconeUtils } from '@pinecone-database/pinecone';
import { downloadFromS3 } from './db/s3-server';
import {PDFLoader} from '@langchain/community/document_loaders/fs/pdf'
import {Document, RecursiveCharacterTextSplitter} from '@pinecone-database/doc-splitter'
import { getEmbeddings } from './embeddings';
import md5 from "md5";
import { convertToAscii } from "./utils";

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

type PDFPage = {
    pageContent: string; 
    metadata: {
        loc: {pageNumber: number}
    }
}

export async function loadS3IntoPinecone(fileKey: string){
    
    //obtain pdf -> download and read from the pdf
    console.log('downloading s3 into file system')

    const file_name = await downloadFromS3(fileKey); 
    
    if(!file_name){
        throw new Error('Could not download from s3');
    }

    // 1. obtain the pdf
    const loader = new PDFLoader(file_name);
    const pages = (await loader.load()) as PDFPage[];
    console.log('1. loaded PDF') 

    // 2. split and segment the pdf into individual documents
    const documents = await Promise.all(pages.map(prepareDocument));
    console.log('2. split and segmented the pdf into individual documents')

    // 3. vectorise and embed individual documents
    const vectors = await Promise.all(documents.flat().map(embedDocument))
    console.log('3. vectorized and embedded individual documents')

    console.log('about to upload vectors to pinecone...')
    //4. upload thesse vectors to pinecone
    const client = await getPineconeClient()
    const pineconeIndex = client.Index('chatpdf-kd')

    console.log('4. inserting vectors into pinecone')
    const namespace = convertToAscii(fileKey);
    PineconeUtils.chunkedUpsert(pineconeIndex, vectors, namespace, 10)

    return documents[0];
}

async function embedDocument(doc: Document){
    try {
        const embeddings = await getEmbeddings(doc.pageContent)
        const hash = md5(doc.pageContent)

        return{
            id: hash,
            values: embeddings,
            metadata: {
                text: doc.metadata.text,
                pageNumber: doc.metadata.pageNumber,
            }
        } as Vector
    } catch (error) {
        console.log('error embedding document', error)
        throw error
    }
}

export const truncateStringByBytes = (str: string, bytes: number) =>{

    const enc = new TextEncoder()
    return new TextDecoder('utf-8').decode(enc.encode(str).slice(0, bytes))
}

// takes in one single page and splits it up into multiple different docs
async function prepareDocument(page: PDFPage){
    let {pageContent, metadata} = page
    pageContent = pageContent.replace(/n/g,'')

    //split the docs
    const splitter = new RecursiveCharacterTextSplitter()
    const docs = await splitter.splitDocuments([
        new Document({
            pageContent, 
            metadata: {
                pageNumber: metadata.loc.pageNumber,
                text: truncateStringByBytes(pageContent, 36000)
            }
        })
    ])

    return docs
}
