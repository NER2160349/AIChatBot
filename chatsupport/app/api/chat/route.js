import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { collection,setDoc, getDoc,doc,serverTimestamp,arrayUnion,updateDoc } from 'firebase/firestore';
import { ReadableStream } from 'web-streams-polyfill';
import { firestore } from '@/firebase'; // Ensure your Firebase is initialized

const systemPrompt = ' Key Information about ToxiScan:Purpose:ToxiScan is an app that allows users to scan food items, personal care products, and household cleaners to check if they contain toxic chemicals and assess their safety for both users and the environment.Data Source: All safety and toxicity data in ToxiScan is derived from the Environmental Working Group (EWG), a reputable and reliable organization known for its research on toxic substances in consumer products.Features: Scanning: Users can scan product barcodes to receive instant toxicity and safety information.Search: Users can search for specific products within the app to check their safety ratings.Cool Interface: The app features a modern, user-friendly interface designed to make it easy and enjoyable to use.Education: The app provides educational content about toxic chemicals and their effects.Promotion:ToxiScan is actively promoted on TikTok, YouTube, and Instagram, where users can find tutorials, user experiences, and other engaging content related to the app.Guidelines for Interaction:Welcome and Onboarding:Greet users warmly and offer assistance with any aspect of the ToxiScan app.Provide guidance on how to download, install, and set up the app if needed.Navigation and Usage:Explain how to use the scanning feature to check products.Assist users in understanding the search functionality and how to interpret the safety ratings.Issue Resolution:Address any technical issues or bugs users might encounter.Offer solutions or escalate problems to human support if necessary.Information and Education:Provide information about the EWG and how ToxiScan uses their data.Share educational content on toxic chemicals and their impact on health and the environment.Engagement:Inform users about ToxiScan\'s presence on TikTok, YouTube, and Instagram.Encourage users to follow and engage with ToxiScan on these platforms for additional content and updates.Feedback and Improvement:Collect user feedback on their experience with the app.Thank users for their input and ensure their suggestions are forwarded to the development team.Tone and Style:Friendly, supportive, and professional.Use clear and simple language to ensure users of all levels can understand and follow instructions.Be empathetic and patient, especially when users are facing difficulties.Example Interactions:Welcome:"Hello! Welcome to ToxiScan. How can I assist you today?"Guidance:"To scan a product, simply open the app and tap on the scan button. Point your camera at the barcode, and you\'ll receive the safety information instantly."Issue Resolution:"I\'m sorry you\'re experiencing this issue. Let me help you resolve it. Can you please describe the problem in more detail?"Information:"ToxiScan uses data from the Environmental Working Group (EWG), which is known for its extensive research on toxic chemicals in consumer products."Engagement:"Follow us on TikTok, YouTube, and Instagram for more tips and updates about ToxiScan!"'// Use your own system prompt here
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }); // Use environment variable for OpenAI API key

export async function POST(req) {
  const data = await req.json(); // Parse the JSON body of the incoming request
  const { action, conversationId, message } = data;

  try {
    if (action === 'start') {
      const { conversationId, title } = await startNewConversation(message);
      return NextResponse.json({ conversationId, title });
    } else if (action === 'continue') {
      const stream = await getStreamedResponse(conversationId, message);
      return new NextResponse(stream);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

const generateTitleWithOpenAI = async (initialMessage) => {
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'Generate a concise title for the following message:' },
      { role: 'user', content: initialMessage }
    ],
    max_tokens: 10
  });

  return response.choices[0].message.content.trim();
};


const startNewConversation = async (initialMessage) => {
  const conversationRef = doc(collection(firestore, 'conversations'));
  const conversationId = conversationRef.id;

  const title = await generateTitleWithOpenAI(initialMessage);

  // Create the main conversation document
  await setDoc(conversationRef, {
    createdAt: serverTimestamp(),
    title: title,
    status: 'active',
  });

  // Add the first message
  await addMessageToConversation(conversationId, { sender: 'user', text: initialMessage });

  return { conversationId, title };
};

const getStreamedResponse = async (conversationId, newMessage) => {
  let messages;
  try {
    messages = await getConversationHistory(conversationId);
  } catch (error) {
    const { conversationId: newConversationId, title } = await startNewConversation(newMessage);
    messages = [{ sender: 'user', text: newMessage }];
    conversationId = newConversationId;
  }

  let prompt = `${systemPrompt}\n`;
  messages.forEach(msg => {
    prompt += `${msg.sender}: ${msg.text}\n`;
  });
  prompt += `user: ${newMessage}\n`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map(msg => ({ role: msg.sender === 'user' ? 'user' : 'assistant', content: msg.text })),
      { role: 'user', content: newMessage }
    ],
    stream: true
  });

  let assistantReply = '';

  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            assistantReply += content;
            const text = encoder.encode(content);
            controller.enqueue(text);
          }
        }
      } catch (err) {
        controller.error(err);
      } finally {
        await addMessageToConversation(conversationId, { sender: 'assistant', text: assistantReply });
        controller.close();
      }
    }
  });
};


const getConversationHistory = async (conversationId) => {
  const conversationRef = doc(firestore, 'conversations', conversationId);
  const messagesCollectionRef = collection(conversationRef, 'messages');
  const messagesSnapshot = await getDocs(messagesCollectionRef);

  const messages = messagesSnapshot.docs.map(doc => doc.data());
  return messages;
};

const addMessageToConversation = async (conversationId, message) => {
  const conversationRef = doc(firestore, 'conversations', conversationId);
  const messagesCollectionRef = collection(conversationRef, 'messages');

  // Add the message to the subcollection with serverTimestamp()
  const messageRef = doc(messagesCollectionRef);
  await setDoc(messageRef, {
    sender: message.sender,
    text: message.text,
    timestamp: serverTimestamp()
  });
};
