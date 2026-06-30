import GlassCard from "../ui/GlassCard";

export default function ChatWindow() {
  return (
    <GlassCard className="h-[600px] flex flex-col">
      <div className="flex-1 overflow-y-auto text-white">
        <h2 className="text-lg font-semibold">Active Session</h2>
        <p className="text-sm opacity-60">Neuro-OS Kernel Ready.</p>
      </div>
      <div className="mt-4">
        <input 
          className="w-full bg-white/10 border border-white/20 p-3 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" 
          placeholder="Input command..." 
        />
      </div>
    </GlassCard>
  );
}