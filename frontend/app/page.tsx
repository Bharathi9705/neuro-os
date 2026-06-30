import ChatWindow from "@/components/features/ChatWindow";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <h1 className="text-3xl font-bold mb-8">Neuro-OS Kernel</h1>
      <div className="max-w-4xl mx-auto">
        <ChatWindow />
      </div>
    </main>
  );
}