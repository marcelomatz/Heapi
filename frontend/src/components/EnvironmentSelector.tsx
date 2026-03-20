import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Settings } from "lucide-react";
import type { Environment } from '../types';

interface EnvironmentSelectorProps {
  environments: Environment[];
  onSelect: (id: string | null) => void;
  selectedId: string | null;
  onOpenManager: () => void;
}

const EnvironmentSelector = ({ environments, onSelect, selectedId, onOpenManager }: EnvironmentSelectorProps) => {
  const activeEnv = environments.find(e => e.ID === selectedId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={
        <Button variant="ghost" size="sm" className="gap-2 h-7 px-2 font-normal">
          <div className="flex items-center gap-2 truncate">
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${activeEnv ? 'bg-primary animate-pulse' : 'bg-muted-foreground/30'}`}></div>
            <span className="truncate">{activeEnv ? activeEnv.name : 'No Environment'}</span>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
        </Button>
      }>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 z-[100]">
        <DropdownMenuItem
          onClick={() => onSelect(null)}
          className={`text-xs ${!selectedId ? 'bg-primary/10 text-primary focus:bg-primary/10 focus:text-primary' : ''}`}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-transparent mr-2"></div>
          No Environment
        </DropdownMenuItem>

        {environments.length > 0 && (
          <DropdownMenuGroup className="max-h-48 overflow-y-auto">
            {environments.map(env => (
              <DropdownMenuItem
                key={env.ID}
                onClick={() => onSelect(env.ID)}
                className={`text-xs ${selectedId === env.ID ? 'bg-primary/10 text-primary focus:bg-primary/10 focus:text-primary' : ''}`}
              >
                <div className={`w-1.5 h-1.5 rounded-full mr-2 ${selectedId === env.ID ? 'bg-primary' : 'bg-transparent'}`}></div>
                <span className="truncate">{env.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={onOpenManager} className="text-xs text-muted-foreground focus:text-foreground">
          <Settings className="mr-2 h-4 w-4" />
          Manage Environments
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default EnvironmentSelector;
