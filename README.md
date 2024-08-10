# ToxyScan AI Chatbot

This repository contains the code for the ToxyScan AI Chatbot. The chatbot is designed to assist users in making informed and healthy choices about products like makeup, skincare, food, and household cleaners by providing relevant information and answering questions.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [File Descriptions](#file-descriptions)
- [License](#license)
- [Contributing](#contributing)
- [Contact](#contact)

## Overview

The ToxyScan AI Chatbot is an intelligent assistant aimed at enhancing user interaction with the ToxyScan platform. Built with modern web technologies, the chatbot integrates seamlessly into the ToxyScan ecosystem, offering real-time assistance to users.

## Features

- Real-time interaction with users
- Intelligent responses based on user queries
- Integrated with the ToxyScan platform
- Responsive design for mobile and desktop users

## Installation

To get started with the ToxyScan AI Chatbot, follow these steps:

1. **Clone the Repository**

   ```bash
   git clone https://github.com/your-username/toxyscan-ai-chatbot.git
   cd toxyscan-ai-chatbot
#Install Dependencies

Ensure you have Node.js installed. Then, run the following command to install all necessary packages:

bash
Copy code
npm install
Set Up Firebase

The chatbot uses Firebase for backend services. Make sure to configure firebase.js with your Firebase project details.

#Configure Environment Variables

Ensure your environment variables are correctly set up. Modify next.config.mjs and config.json as needed.

#Usage
To start the development server and test the chatbot locally:

bash
Copy code
npm run dev
Open your browser and navigate to http://localhost:3000 to interact with the chatbot.

#File Descriptions
app/: Contains the core application files.
chat/: Handles chat-specific components.
main/: Main application components.
favicon/: Favicon files for the website.
global.css: Global styles for the app.
layout.js: Layout components for the app.
page.js: The main page for the chatbot interface.
public/: Contains public assets accessible by the app.
firebase.js: Firebase configuration and initialization.
package.json: Lists dependencies and scripts for the project.
package-lock.json: Lock file for Node.js dependencies.
next.config.mjs: Configuration for Next.js.
.gitignore: Specifies files and directories to be ignored by Git.
README.md: This file.

#License
This project is licensed under the MIT License.

#Contributing
Contributions are welcome! Please feel free to submit issues or pull requests to improve the chatbot.

#Contact
For any questions or inquiries, please contact toxiscan4@gmail.com.
