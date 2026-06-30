const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const sendMessage = async (message: string) => {
  const response = await fetch(`${API_URL}/api/v1/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  return response.json();
};