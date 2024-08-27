import {OpenAIApi, Configuration} from 'openai-edge'


const config = new Configuration({
    apiKey: process.env.OPENAI_API_KEY
})

const openai = new OpenAIApi(config)

export async function getEmbeddings(text:string){
    try {
        const response = await openai.createEmbedding({
            model: 'text-embedding-ada-002', 
            input: text.replace(/\n/g,' ')
        })

        // Check if the response status is not okay (not 200)
        if (!response.ok) {
            const errorDetails = await response.json();
            console.error('OpenAI API error:', errorDetails);
            throw new Error(`OpenAI API request failed with status ${response.status}`);
        }

        const result = await response.json();

        if (!result?.data?.[0]?.embedding) {
            throw new Error('Embeddings not found in OpenAI response');
        }

        // const result = await response.json()
        return result.data[0].embedding as number[]
    } catch (error) {
        console.log('error calling openai embeddings api', error)
        throw error
    }
}