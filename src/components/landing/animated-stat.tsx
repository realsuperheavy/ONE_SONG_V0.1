interface AnimatedStatProps {
  value: string;
  label: string;
}

export function AnimatedStat({ value, label }: AnimatedStatProps) {
  return (
    <div className="space-y-2">
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-muted-foreground">{label}</div>
    </div>
  );
} 