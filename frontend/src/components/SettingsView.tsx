import { useState, useEffect, useMemo } from "react";
import { Monitor, Command, Keyboard, TerminalSquare, Sidebar, Focus, FilePlus, X, Settings as SettingsIcon, Palette } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface SettingsViewProps {
  theme: string;
  onThemeChange: (theme: 'light' | 'dark' | 'custom') => void;
  isStatusBarEnabled: boolean;
  onStatusBarToggle: (enabled: boolean) => void;
}

const SHORTCUTS = [
  { label: 'Command Center', icon: <Command size={14} />, keys: ['⌘/Ctrl', 'K'], desc: 'Quickly access all commands and requests' },
  { label: 'Toggle Terminal', icon: <TerminalSquare size={14} />, keys: ['⌘/Ctrl', '`'], desc: 'Open or close the integrated terminal' },
  { label: 'Toggle Sidebar', icon: <Sidebar size={14} />, keys: ['⌘/Ctrl', 'B'], desc: 'Show or hide the left navigation panel' },
  { label: 'New Request', icon: <FilePlus size={14} />, keys: ['⌘/Ctrl', 'T'], desc: 'Create a new untitled API request' },
  { label: 'Close Tab', icon: <X size={14} />, keys: ['⌘/Ctrl', 'W'], desc: 'Close the currently active tab' },
  { label: 'Focus URL', icon: <Focus size={14} />, keys: ['⌘/Ctrl', 'L'], desc: 'Focus the URL bar to type a new address' },
  { label: 'Rename Tab', icon: <Keyboard size={14} />, keys: ['F2'], desc: 'Rename the currently active request or collection' },
];

const DEFAULT_YAML = `# My Custom Heapi Theme
type: "dark"
colors:
  bg: "#0a0a0f"
  bg-secondary: "#0d0d12"
  bg-elevated: "#111118"
  bg-card: "#16161f"
  text-primary: "#f1f1f3"
  text-secondary: "#9999aa"
  text-muted: "#555566"
  primary: "#7c3aed"
  border: "#1f1f29"
typography:
  font-sans: "Inter, sans-serif"
  font-mono: "Fira Code, monospace"
  font-scale-ui: "1.0"
  font-scale-mono: "1.0"
`;

const parseYamlToConfig = (yaml: string) => {
  const config: Record<string, string> = {};
  const lines = yaml.split('\n');
  lines.forEach(line => {
    const match = line.match(/^\s+([a-zA-Z0-9_-]+)\s*:\s*["']?([^"']+)["']?\s*$/);
    if (match) config[match[1]] = match[2];
  });
  return config;
};

const ColorPicker = ({ label, val, onChange }: { label: string, val: string, onChange: (v: string) => void }) => (
  <div className="flex items-center justify-between p-3 border border-border/40 rounded-xl bg-bg/40 hover:border-border/80 transition-colors">
    <span className="text-[11px] font-bold text-text-secondary">{label}</span>
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-mono font-bold text-text-muted uppercase">{val || '#000000'}</span>
      <div className="relative w-7 h-7 rounded-md overflow-hidden border border-border shadow-sm shrink-0 cursor-pointer">
        <input 
          type="color" 
          value={val || '#000000'} 
          onChange={(e) => onChange(e.target.value)} 
          className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer bg-transparent border-0 p-0" 
        />
      </div>
    </div>
  </div>
);

const FontInput = ({ label, val, onChange }: { label: string, val: string, onChange: (v: string) => void }) => (
  <div className="flex items-center justify-between p-3 border border-border/40 rounded-xl bg-bg/40 hover:border-border/80 transition-colors">
    <span className="text-[11px] font-bold text-text-secondary whitespace-nowrap mr-4">{label}</span>
    <input 
      type="text" 
      value={val || ''} 
      onChange={(e) => onChange(e.target.value)} 
      placeholder="e.g. Inter, sans-serif"
      className="w-full max-w-[200px] text-[10px] font-mono font-bold bg-bg border border-border rounded-md px-3 py-1.5 text-text-primary focus:ring-1 focus:ring-primary/50 outline-none shadow-inner" 
    />
  </div>
);

const RangeInput = ({ label, val, onChange }: { label: string, val: string, onChange: (v: string) => void }) => (
  <div className="flex items-center justify-between p-3 border border-border/40 rounded-xl bg-bg/40 hover:border-border/80 transition-colors">
    <span className="text-[11px] font-bold text-text-secondary whitespace-nowrap mr-4">{label}</span>
    <div className="flex items-center gap-3 w-full max-w-[200px]">
      <input 
        type="range" 
        min="0.8" max="1.5" step="0.05"
        value={val || '1.0'} 
        onChange={(e) => onChange(e.target.value)} 
        className="w-full accent-primary" 
      />
      <span className="text-[10px] font-mono font-bold text-text-muted w-8 text-right">{val || '1.0'}x</span>
    </div>
  </div>
);

const SettingsView = ({ theme, onThemeChange, isStatusBarEnabled, onStatusBarToggle }: SettingsViewProps) => {
  const [yamlContent, setYamlContent] = useState(() => localStorage.getItem('customThemeYaml') || DEFAULT_YAML);
  const [editorMode, setEditorMode] = useState<'visual' | 'code'>('visual');
  const [parseError, setParseError] = useState<string | null>(null);

  const parsedConfig = useMemo(() => parseYamlToConfig(yamlContent), [yamlContent]);

  useEffect(() => {
    if (theme === 'custom') {
      try {
        const lines = yamlContent.split('\n');
        const newVars: Record<string, string> = {};
        for (const line of lines) {
          const match = line.match(/^\s+([a-zA-Z0-9_-]+)\s*:\s*["']?([^"']+)["']?\s*$/);
          if (match) newVars[match[1]] = match[2];
        }
        
        if (Object.keys(newVars).length > 0) {
          const root = document.documentElement;
          Object.entries(newVars).forEach(([k, v]) => root.style.setProperty(`--${k}`, v));
          localStorage.setItem('customThemeYaml', yamlContent);
          setParseError(null);
        }
      } catch (e) {
        setParseError("Invalid YAML syntax.");
      }
    }
  }, [yamlContent, theme]);

  const updateField = (key: string, value: string) => {
    const regex = new RegExp(`^(\\s+${key}\\s*:\\s*)["']?([^"'\n]*)["']?$`, 'm');
    if (regex.test(yamlContent)) {
      setYamlContent(prev => prev.replace(regex, `$1"${value}"`));
    } else {
      setYamlContent(prev => prev + `\n  ${key}: "${value}"`);
    }
  };

  return (
    <div className="flex-1 h-full bg-bg overflow-y-auto custom-scrollbar">
      <div className="p-8 md:p-12 max-w-4xl mx-auto w-full space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="space-y-3 pb-6 border-b border-border/40">
          <h1 className="text-3xl font-black tracking-tight text-text-primary flex items-center gap-3">
            <SettingsIcon className="text-accent-purple-light" size={26} />
            Preferences
          </h1>
          <p className="text-text-secondary text-sm font-medium max-w-lg leading-relaxed">
            Customize your workspace, adjust appearance, and master keyboard shortcuts for a lightning-fast workflow.
          </p>
        </div>

        <div className="grid gap-12">
          
          {/* Appearance Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">
              <Monitor size={14} className="text-accent-blue" />
              <span>Appearance</span>
            </div>
            
            <div className="bg-bg-card border border-border rounded-2xl overflow-hidden shadow-sm transition-all hover:border-border/80">
              <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-border/40">
                <div className="space-y-1.5">
                  <h3 className="text-[13px] font-bold text-text-primary">Interface Theme</h3>
                  <p className="text-[11px] text-text-muted max-w-sm leading-relaxed">
                    Select your preferred color scheme. The dark theme is optimized for low-light environments, while light theme provides maximum contrast.
                  </p>
                </div>
                
                <div className="flex bg-bg-secondary p-1.5 rounded-xl border border-border shadow-inner shrink-0">
                  <button
                    onClick={() => onThemeChange('light')}
                    className={`flex items-center justify-center px-5 py-2 rounded-lg text-[11px] font-bold transition-all duration-200 ${
                      theme === 'light' 
                        ? 'bg-bg shadow-md text-text-primary border border-border/50 scale-100' 
                        : 'text-text-muted hover:text-text-primary scale-95 hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    Light
                  </button>
                  <button
                    onClick={() => onThemeChange('dark')}
                    className={`flex items-center justify-center px-5 py-2 rounded-lg text-[11px] font-bold transition-all duration-200 ${
                      theme === 'dark' 
                        ? 'bg-bg shadow-md text-text-primary border border-border/50 scale-100' 
                        : 'text-text-muted hover:text-text-primary scale-95 hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    Dark
                  </button>
                  <button
                    onClick={() => onThemeChange('custom')}
                    className={`flex items-center justify-center px-5 py-2 rounded-lg text-[11px] font-bold transition-all duration-200 ${
                      theme === 'custom' 
                        ? 'bg-bg shadow-md text-text-primary border border-border/50 scale-100' 
                        : 'text-text-muted hover:text-text-primary scale-95 hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    Custom
                  </button>
                </div>
              </div>

              {/* Status Bar Toggle */}
              <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-border/40">
                <div className="space-y-1.5">
                  <h3 className="text-[13px] font-bold text-text-primary flex items-center gap-2">
                    Show Status Bar
                    {isStatusBarEnabled && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_5px_rgba(124,58,237,0.5)]" />}
                  </h3>
                  <p className="text-[11px] text-text-muted max-w-sm leading-relaxed">
                    Display a persistent bottom bar with system status, active environment, and history count.
                  </p>
                </div>
                
                <div 
                  onClick={() => onStatusBarToggle(!isStatusBarEnabled)}
                  className={`relative w-12 h-6 rounded-full cursor-pointer transition-all duration-300 p-1 ${isStatusBarEnabled ? 'bg-primary shadow-[0_0_12px_rgba(124,58,237,0.2)]' : 'bg-bg-secondary border border-border'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${isStatusBarEnabled ? 'translate-x-6' : 'translate-x-0 opacity-50'}`} />
                </div>
              </div>

              {/* Custom Theme Editor */}
              {theme === 'custom' && (
                <div className="p-6 sm:p-8 bg-bg-secondary/20 flex flex-col gap-6 animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-text-primary font-bold text-xs">
                      <Palette size={16} className="text-accent-purple" />
                      Theme Builder
                    </div>
                    
                    <div className="flex bg-bg p-1 rounded-lg border border-border shadow-inner">
                      <button 
                        onClick={() => setEditorMode('visual')} 
                        className={`px-4 py-1.5 rounded-md text-[10px] font-bold transition-all ${editorMode === 'visual' ? 'bg-bg-secondary text-text-primary shadow-sm border border-border/50' : 'text-text-muted hover:text-text-primary border border-transparent'}`}
                      >
                        Visual
                      </button>
                      <button 
                        onClick={() => setEditorMode('code')} 
                        className={`px-4 py-1.5 rounded-md text-[10px] font-bold transition-all ${editorMode === 'code' ? 'bg-bg-secondary text-text-primary shadow-sm border border-border/50' : 'text-text-muted hover:text-text-primary border border-transparent'}`}
                      >
                        YAML
                      </button>
                    </div>
                  </div>

                  {editorMode === 'visual' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                      <div className="space-y-3">
                         <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.15em] mb-4">Structural Colors</h4>
                         <ColorPicker label="Background" onChange={(v) => updateField('bg', v)} val={parsedConfig['bg']} />
                         <ColorPicker label="Sidebar & Header" onChange={(v) => updateField('bg-secondary', v)} val={parsedConfig['bg-secondary']} />
                         <ColorPicker label="Elevated Surfaces" onChange={(v) => updateField('bg-elevated', v)} val={parsedConfig['bg-elevated']} />
                         <ColorPicker label="Cards" onChange={(v) => updateField('bg-card', v)} val={parsedConfig['bg-card']} />
                         <ColorPicker label="Borders" onChange={(v) => updateField('border', v)} val={parsedConfig['border']} />
                      </div>
                      <div className="space-y-3">
                         <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.15em] mb-4">Typography & Accents</h4>
                         <FontInput label="UI Font (Sans)" onChange={(v) => updateField('font-sans', v)} val={parsedConfig['font-sans']} />
                         <FontInput label="Code Font (Mono)" onChange={(v) => updateField('font-mono', v)} val={parsedConfig['font-mono']} />
                         <RangeInput label="UI Font Scale" onChange={(v) => updateField('font-scale-ui', v)} val={parsedConfig['font-scale-ui']} />
                         <RangeInput label="Code Font Scale" onChange={(v) => updateField('font-scale-mono', v)} val={parsedConfig['font-scale-mono']} />
                         <div className="pt-2" />
                         <ColorPicker label="Text Primary" onChange={(v) => updateField('text-primary', v)} val={parsedConfig['text-primary']} />
                         <ColorPicker label="Text Secondary" onChange={(v) => updateField('text-secondary', v)} val={parsedConfig['text-secondary']} />
                         <ColorPicker label="Primary Brand Color" onChange={(v) => updateField('primary', v)} val={parsedConfig['primary']} />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Textarea
                        value={yamlContent}
                        onChange={(e) => setYamlContent(e.target.value)}
                        className="font-mono text-xs h-[320px] bg-[#0d0d12] border-border focus-visible:ring-1 focus-visible:ring-primary/50 text-[#a6e3a1] leading-relaxed p-5 rounded-xl shadow-inner"
                        placeholder="Enter your YAML configuration..."
                        spellCheck={false}
                      />
                    </div>
                  )}

                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-border/40">
                     <div className="flex items-center gap-2">
                        {parseError ? (
                          <span className="text-[11px] font-bold text-destructive flex items-center gap-1.5"><X size={12} /> {parseError}</span>
                        ) : (
                          <span className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">Changes saved automatically</span>
                        )}
                     </div>
                     <button
                       onClick={() => setYamlContent(DEFAULT_YAML)}
                       className="text-[10px] font-bold tracking-wider uppercase text-text-muted hover:text-text-primary transition-colors underline underline-offset-4"
                     >
                       Restore Defaults
                     </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Keyboard Shortcuts Section */}
          <section className="space-y-6 pb-12">
            <div className="flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">
              <Keyboard size={14} className="text-accent-purple" />
              <span>Hotkeys & Shortcuts</span>
            </div>
            
            <div className="bg-bg-card border border-border rounded-2xl overflow-hidden shadow-sm transition-all hover:border-border/80">
              <div className="grid grid-cols-1 divide-y divide-border/40">
                {SHORTCUTS.map((shortcut) => (
                  <div key={shortcut.label} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-bg-secondary/40 transition-colors gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-bg-elevated border border-border text-text-muted shadow-sm">
                        {shortcut.icon}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[12px] font-bold text-text-primary">{shortcut.label}</span>
                        <span className="text-[10px] text-text-muted font-medium mt-0.5">{shortcut.desc}</span>
                      </div>
                    </div>
                    <div className="flex gap-1.5 sm:justify-end shrink-0 pl-12 sm:pl-0">
                      {shortcut.keys.map((k, i) => (
                        <kbd key={i} className="px-2.5 py-1 min-w-[24px] text-center bg-bg-elevated border border-border rounded-md shadow-sm text-[10px] font-mono font-bold text-text-primary uppercase tracking-wider">
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-bg-secondary/30 border-t border-border/40 flex items-center justify-center">
                <span className="text-[10px] text-text-muted font-medium tracking-wide">
                  <span className="font-bold text-text-secondary">OS Modifier:</span> Use <kbd className="font-mono mx-1">Ctrl</kbd> on Windows/Linux and <kbd className="font-mono mx-1">⌘</kbd> on macOS.
                </span>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default SettingsView;