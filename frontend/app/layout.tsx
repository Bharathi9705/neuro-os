import "../styles/globals.css";

export const metadata = {
  title: 'Neuro-OS',
  description: 'Advanced AI Chatbot Operating System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}