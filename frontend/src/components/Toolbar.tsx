import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import EnvironmentSelector from './EnvironmentSelector';
import type { Environment } from '../types';

interface ToolbarProps {
  environments: Environment[];
  selectedEnvId: string | null;
  onSelectEnv: (id: string | null) => void;
  onOpenEnvManager: () => void;
  onOpenSettings: () => void;
  isActiveSettings: boolean;
}

const Toolbar = ({
  environments,
  selectedEnvId,
  onSelectEnv,
  onOpenEnvManager,
  onOpenSettings,
  isActiveSettings,
}: ToolbarProps) => {
  return (
    <header className="h-12 border-b border-border px-6 flex items-center justify-end glass z-30 shrink-0">
      <div className="flex items-center gap-4">
        <EnvironmentSelector
          environments={environments}
          selectedId={selectedEnvId}
          onSelect={onSelectEnv}
          onOpenManager={onOpenEnvManager}
        />

        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenSettings}
          className={isActiveSettings ? 'text-primary bg-muted' : 'text-muted-foreground'}
          title="Settings"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};

export default Toolbar;
