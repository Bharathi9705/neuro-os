# NEURO-OS: Advanced AI Chatbot Platform

**NEURO-OS** is a sophisticated AI chatbot platform designed to provide a rich, interactive experience similar to ChatGPT, but powered by the ultra-fast Groq API. This project features a Python FastAPI backend for AI processing and a Next.js TypeScript frontend for a modern, responsive user interface.

## ✨ Features

*   **Multi-Chat Sidebar**: Create, manage, and switch between multiple chat sessions seamlessly.
*   **Intelligent Chat Naming**: Chats are automatically named based on your first message for better organization.
*   **Markdown Rendering**: AI responses are beautifully formatted with full Markdown support (bold, italics, lists, links, tables).
*   **Syntax Highlighting**: Code blocks are automatically syntax-highlighted using the Dracula theme for enhanced readability.
*   **Copy-to-Clipboard**: One-click copy functionality for all AI-generated code snippets.
*   **Responsive UI**: A sleek, modern dark theme with Glassmorphism effects, optimized for various screen sizes.
*   **Real-time Feedback**: Typing indicators show when the AI is generating a response.
*   **Groq Integration**: Leverages the powerful and incredibly fast Llama 3.3-70B model via Groq for near-instant AI responses.
*   **Agent Switching**: Easily switch between different AI agents (General, Coding, Research) to tailor responses.

## 🚀 Technologies Used

**Backend:**
*   **Python 3.10+**
*   **FastAPI**: For building robust and high-performance APIs.
*   **Groq**: For ultra-fast AI inference with Llama 3.3-70B.
*   **python-dotenv**: For managing environment variables.
*   **uvicorn**: ASGI server for running FastAPI.

**Frontend:**
*   **Next.js 14+**: React framework for building server-rendered and static web applications.
*   **TypeScript**: For type-safe JavaScript development.
*   **Tailwind CSS**: For rapid and utility-first CSS styling.
*   **React Markdown**: For rendering Markdown content.
*   **React Syntax Highlighter**: For beautiful code block highlighting.

## ⚙️ Setup and Installation

Follow these steps to get your NEURO-OS project up and running locally.

### 1. Clone the Repository

First, clone this repository to your local machine:

```bash
git clone <your-repository-url>
cd NEURO-OS
```

### 2. Backend Setup

Navigate to the `backend` directory, install dependencies, and set up your Groq API key.

```bash
cd backend

# Create a Python virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Create a .env file and add your Groq API Key
# Get your free Groq API key from: https://console.groq.com/keys
echo GROQ_API_KEY=gsk_YOUR_GROQ_API_KEY_HERE > .env

# Run the backend server
python main.py
```

The backend will run on `http://127.0.0.1:8001`.

### 3. Frontend Setup

Open a **new terminal** (keep the backend running!), navigate to the `frontend` directory, and install Node.js dependencies.

```bash
# Open a NEW terminal in VS Code
cd frontend

# Install Node.js dependencies
npm install

# Run the frontend development server
npm run dev
```

The frontend will run on `http://localhost:3000`.

## 🌐 Usage

1.  Open your web browser and go to `http://localhost:3000`.
2.  Click "Start New Chat" to begin a conversation.
3.  Type your message in the input box and press Enter.
4.  Use the dropdown to switch between "General AI", "Coding Agent", and "Research Agent".
5.  Explore the sidebar to manage multiple chat sessions.

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
