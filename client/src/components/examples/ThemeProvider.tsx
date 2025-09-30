import { ThemeProvider } from '../ThemeProvider';
import { Button } from '@/components/ui/button';

function ThemeDemo() {
  return (
    <div className="p-4 space-y-4 bg-background text-foreground">
      <h2 className="text-xl font-semibold">Theme Provider Demo</h2>
      <p className="text-muted-foreground">This demonstrates the theme system working</p>
      <div className="flex gap-2">
        <Button>Primary Button</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
      </div>
    </div>
  );
}

export default function ThemeProviderExample() {
  return (
    <ThemeProvider>
      <ThemeDemo />
    </ThemeProvider>
  );
}