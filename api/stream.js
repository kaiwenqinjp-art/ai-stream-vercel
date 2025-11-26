// api/stream.js - Vercel Edge Function
// This file goes in /api/stream.js in your repo

export const config = {
  runtime: 'edge', // Use Edge Runtime for better streaming
};

const mockResponses = {
  'hello': 'Hello! 👋 I\'m an AI assistant. How can I help you today?',
  'hi': 'Hi there! 👋 Welcome! What would you like to know?',
  'python': 'Python 🐍 is a versatile programming language known for its simplicity and readability. It\'s widely used in web development, data science, AI, and automation.',
  'javascript': 'JavaScript 🚀 is the primary programming language for web browsers. It enables interactive web pages and is an essential part of web applications.',
  'stream': 'Streaming 📡 is a technique where data is transmitted in chunks rather than all at once. This provides better user experience with progressive loading.',
  'ai': 'Artificial Intelligence 🤖 refers to the simulation of human intelligence in machines.',
  'render': 'Render is a cloud platform. Vercel is even better for streaming! 🚀',
  'vercel': 'Vercel is amazing for deploying web apps with full streaming support! ⚡',
  'default': 'This is a simulated AI response. On Vercel Edge Functions, streaming works perfectly!'
};

export default async function handler(req) {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('📝 Prompt:', prompt);

    // Get response based on keywords
    const lowerPrompt = prompt.toLowerCase();
    let responseText = mockResponses.default;
    
    for (const [key, value] of Object.entries(mockResponses)) {
      if (key !== 'default' && lowerPrompt.includes(key)) {
        responseText = value;
        break;
      }
    }

    const fullResponse = `📝 You asked: "${prompt}"\n\n${responseText}\n\n⏰ ${new Date().toLocaleTimeString()}`;

    // Create a TransformStream for streaming
    const encoder = new TextEncoder();
    let index = 0;

    const stream = new ReadableStream({
      async start(controller) {
        // Send characters one by one
        const sendChunk = () => {
          if (index < fullResponse.length) {
            const char = fullResponse[index];
            const data = JSON.stringify({ chunk: char, done: false });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            index++;
            
            // Use setTimeout for async delay
            setTimeout(sendChunk, 30);
          } else {
            // Send completion
            const doneData = JSON.stringify({ 
              done: true, 
              totalChars: fullResponse.length 
            });
            controller.enqueue(encoder.encode(`data: ${doneData}\n\n`));
            controller.close();
          }
        };

        sendChunk();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
