import { Activity } from "lucide-react";

const EmptyState = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-4 animate-in fade-in zoom-in-95 duration-700">
      <div className="text-center">
        <h3 className="text-xl font-bold text-foreground">Ready to Heapi?</h3>
        <p className="text-sm mt-1 max-w-[200px] mx-auto opacity-60">Select a request from the sidebar or create a new one to get started.</p>
      </div>
    </div>
  );
};

export default EmptyState;
