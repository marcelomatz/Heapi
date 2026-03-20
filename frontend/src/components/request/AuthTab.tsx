import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AuthConfig } from '../../types';

interface AuthTabProps {
  auth: AuthConfig;
  onChange: (auth: AuthConfig) => void;
}

const AuthTab = ({ auth, onChange }: AuthTabProps) => {
  const update = (partial: Partial<AuthConfig>) => onChange({ ...auth, ...partial });

  return (
    <div className="innovator-card p-6 space-y-6 max-w-lg">
      <div className="flex items-center justify-between gap-8">
        <div className="space-y-1">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Authentication Type</h4>
          <p className="text-[10px] text-muted-foreground">Select how to authenticate this request</p>
        </div>
        <Select value={auth.type} onValueChange={(v) => update({ type: v as AuthConfig['type'] })}>
          <SelectTrigger className="w-[160px] h-9 text-xs bg-background border-border font-bold">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Auth</SelectItem>
            <SelectItem value="bearer">Bearer Token</SelectItem>
            <SelectItem value="basic">Basic Auth</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(auth.type === 'bearer' || auth.type === 'basic') && (
        <div className="pt-4 border-t border-border/50 space-y-4 animate-in slide-in-from-top-2 duration-300">
          {auth.type === 'bearer' && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Token</label>
              <Input value={auth.token ?? ''} onChange={(e) => update({ token: e.target.value })} placeholder="ey..." className="w-full bg-background border border-border text-xs h-10 shadow-inner" />
            </div>
          )}
          {auth.type === 'basic' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Username</label>
                <Input value={auth.username ?? ''} onChange={(e) => update({ username: e.target.value })} placeholder="admin" className="w-full bg-background border border-border text-xs h-10 shadow-inner" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">Password</label>
                <Input type="password" value={auth.password ?? ''} onChange={(e) => update({ password: e.target.value })} placeholder="••••••••" className="w-full bg-background border border-border text-xs h-10 shadow-inner" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AuthTab;
