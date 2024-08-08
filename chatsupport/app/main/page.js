"use client";
import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  createTheme,
  ThemeProvider,
  CssBaseline,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";

// Define light and dark themes
const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#90caf9",
    },
    secondary: {
      main: "#f48fb1",
    },
  },
});

// Component to display the list of messages
const History = ({ messages, onSelectMessage }) => {
  return (
    <Box
      width="200px"
      height="100%"
      borderRight="1px solid"
      borderColor="text.primary"
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
          <Box
            key={index}
            onClick={() => onSelectMessage(message)} // onSelectMessage when a message is clicked
            sx={{
              cursor: "pointer",
              padding: 1,
              borderRadius: 1,
              "&:hover": { bgcolor: "grey.200" },
            }}
          >
            <Typography
              variant="body1"
              color={message.role === "assistant" ? "primary" : "secondary"}
            >
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
    { role: "assistant", content: "Hello! How can I help you today?" },
  ]);
  const [message, setMessage] = useState("");
  const [selectedMessage, setSelectedMessage] = useState(null); // Track selected message
  const [theme, setTheme] = useState("light"); // Manage theme state
  const messagesEndRef = useRef(null); // Ref to scroll to the bottom

  const sendMessage = async () => {
    setMessage("");
    setSelectedMessage(null);
    setMessages((messages) => [
      ...messages,
      { role: "user", content: message },
      { role: "assistant", content: "" },
    ]);

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify([...messages, { role: "user", content: message }]),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let result = "";

    return reader.read().then(function processText({ done, value }) {
      if (done) {
        return result;
      }
      const text = decoder.decode(value || new Uint8Array(), { stream: true });
      setMessages((messages) => {
        let lastMessage = messages[messages.length - 1];
        let otherMessages = messages.slice(0, messages.length - 1);
        return [
          ...otherMessages,
          { ...lastMessage, content: lastMessage.content + text },
        ];
      });
      return reader.read().then(processText);
    });
  };

  const handleSelectMessage = (message) => {
    setSelectedMessage(message); // Set selected message
  };

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    // Scroll to the bottom of the messages container
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <ThemeProvider theme={theme === "light" ? lightTheme : darkTheme}>
      <CssBaseline />
      <Box
        width="100vw"
        height="100vh"
        display="flex"
        flexDirection="row"
        position="relative"
      >
        <Button
          onClick={toggleTheme}
          variant="contained"
          sx={{
            position: "absolute",
            top: 16,
            right: 16,
            borderRadius: "8px",
            padding: "4px 12px" 
            
          }}
        >
          {theme === "light" ? "Dark Mode" : "Light Mode"}
        </Button>
        <History messages={messages} onSelectMessage={handleSelectMessage} />
        <Stack
          direction="column"
          width="500px"
          maxHeight="700px"
          border="1px solid"
          borderColor="text.primary"
          p={2}
          spacing={3}
          ml="220px"
          flexGrow={1}
        >
          <Stack
            direction="column"
            spacing={2}
            flexGrow={1}
            overflow="auto"
            maxHeight="100%"
          >
            {(selectedMessage ? [selectedMessage] : messages).map(
              (message, index) => (
                <Box
                  key={index}
                  display="flex"
                  justifyContent={
                    message.role === "assistant" ? "flex-start" : "flex-end"
                  }
                >
                  <Box
                    bgcolor={
                      message.role === "assistant"
                        ? "primary.main"
                        : "secondary.main"
                    }
                    color="white"
                    borderRadius={16}
                    p={3}
                  >
                    {message.content}
                  </Box>
                </Box>
              )
            )}
            <div ref={messagesEndRef} />
          </Stack>
          <Stack direction="row" spacing={2}>
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
    </ThemeProvider>
  );
}

