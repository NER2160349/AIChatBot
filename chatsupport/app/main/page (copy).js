"use client";

import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';

const History = ({ messages }) => {
  return (
    <Box
      width="200px"
      height="100%"
      borderRight="1px solid black"
      p={2}
      overflow="auto"
      position="absolute" 
      top={0}
      left={0}
    >
      <Typography variant="h6" gutterBottom>
        History
      </Typography>
      <Stack spacing={2}>
        {messages.map((message, index) => (
          <Box key={index}>
            <Typography variant="body1" color={message.role === "assistant" ? "primary" : "secondary"}>
              {message.role}: {message.content}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

export default function Home() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! How can I help you today?" }
  ]);
  const [message, setMessage] = useState('');

  const sendMessage = async () => {
    if (!message.trim()) return;

    setMessages(prevMessages => [
      ...prevMessages,
      { role: 'user', content: message },
      { role: 'assistant', content: '' }, // Placeholder for assistant's response
    ]);
    setMessage('');

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'continue', conversationId: 'your-conversation-id', message }), // Update with appropriate payload
    });

    if (!response.body) return;

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let result = '';

    const processText = async ({ done, value }) => {
      if (done) {
        setMessages(prevMessages => {
          const lastMessage = prevMessages[prevMessages.length - 1];
          return [
            ...prevMessages.slice(0, -1),
            { ...lastMessage, content: result },
          ];
        });
        return;
      }

      result += decoder.decode(value, { stream: true });
      setMessages(prevMessages => {
        const lastMessage = prevMessages[prevMessages.length - 1];
        return [
          ...prevMessages.slice(0, -1),
          { ...lastMessage, content: result },
        ];
      });

      return reader.read().then(processText);
    };

    reader.read().then(processText);
  };

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="row"
      position="relative"
    >
      <History messages={messages} /> 

      <Stack
        direction={'column'}
        width="500px"
        maxHeight="700px"
        border="1px solid black"
        p={2}
        spacing={3}
        ml="220px" 
        flexGrow={1}
      >
        <Stack direction={"column"} spacing={2} flexGrow={1} overflow='auto' maxHeight="100%">
          {messages.map((message, index) => (
            <Box
              key={index}
              display="flex"
              justifyContent={message.role === "assistant" ? "flex-start" : "flex-end"}
            >
              <Box
                bgcolor={message.role === "assistant" ? "primary.main" : "secondary.main"}
                color="white"
                borderRadius={16}
                p={3}
              >
                {message.content}
              </Box>
            </Box>
          ))}
        </Stack>
        <Stack direction={"row"} spacing={2}>
          <TextField
            label="Message"
            fullWidth
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button variant="contained" onClick={sendMessage}>
            Send
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
