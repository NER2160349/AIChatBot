"use client"

import {
  Box,
  Button,
  Stack,
  TextField,
  createTheme,
  ThemeProvider,
  CssBaseline,
  Switch,
  FormControlLabel,
  Typography
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import {auth} from "@/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

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


export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [name, setName] = useState(""); // State for storing user's name
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [theme, setTheme] = useState("light"); // Manage theme state
  const messagesEndRef = useRef(null); // Ref to scroll to the bottom

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const userName = user.displayName || "User";
        setName(userName); // Set the user's name
        setMessages([
          { role: "assistant", content: `Hello ${userName}! How can I help you today? I'll be happy to assist you with any questions or concerns you may have about Toxiscan.` }
        ]);
        setUser(user); // Set the user in state for future reference
      } else {
        router.push("/"); // Redirect to the login page if not authenticated
      }
    });

    return () => unsubscribe(); // Clean up the listener when the component unmounts
  }, [router]);

  
  const sendMessage = async () => {
    if (!message.trim()) return;// Exit the function if the message is empty
    
    
    setMessages(prevMessages => [
      ...prevMessages,
      { role: 'user', content: message },
      { role: 'assistant', content: "" }, // Placeholder for assistant's response
    ]);
    setMessage("");
    
    // Send a POST request to the API to continue the conversation
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'continue', conversationId: 'your-conversation-id', message }), // Send the action type, conversation ID, and user's message in the request body
    });
    // Check if the response body exists
    if (!response.body) return;

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let result = "";

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
          ...prevMessages.slice(0, -1), // Keep all messages except the last one
          { ...lastMessage, content: result }, // Update the last message with the partially received response content
        ];
      });

      return reader.read().then(processText);
    };

    reader.read().then(processText);
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
  const handleLogout = async () => {
  try {
    await signOut(auth);
    router.push("/");
  } catch (error) {
    console.error("Error signing out: ", error);
    alert(`Error signing out: ${error.message}`);
  }
};


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
     <Box
  sx={{
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    bgcolor: "grey",
    padding: '18px'
  }}
>
       <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
         ToxiGuide
       </Typography>
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <FormControlLabel
      control={
        <Switch
          checked={theme === 'dark'}
          onChange={toggleTheme}
          sx={{
            '& .MuiSwitch-thumb': {
              borderRadius: '8px',
              padding: '4px',
            },
            '& .MuiSwitch-track': {
              borderRadius: '8px',
            },
          }}
        />
      }
      label={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
      sx={{
        '& .MuiFormControlLabel-label': {
          paddingLeft: '8px',
        },
      }}
    />
    <Button variant="standard" onClick={handleLogout}>
      Logout
    </Button>
  </Box>
</Box>

      
     

      <Stack
        direction={'column'}
        width="500px"
        maxHeight="700px"
        //border="1px solid"
        borderColor="grey"
        p={2}
        spacing={3}
        flexGrow={1}
        marginTop={8}
      >
        <Stack 
          direction={"column"} 
          spacing={2} flexGrow={1} 
          overflow='auto'
          maxHeight="100%"
          >
            {messages.map((message, index) => (
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
          ))}
          <div ref={messagesEndRef} />
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
  </ThemeProvider>
  );
}
