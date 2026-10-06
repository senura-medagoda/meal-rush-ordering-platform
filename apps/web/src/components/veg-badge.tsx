export function VegBadge({ isVeg }: { isVeg: boolean }) {
  const border = isVeg ? 'border-green-600' : 'border-red-600';
  const dot = isVeg ? 'bg-green-600' : 'bg-red-600';
  return (
    <span
      title={isVeg ? 'Vegetarian' : 'Non-vegetarian'}
      className={`inline-flex h-4 w-4 items-center justify-center rounded-sm border-2 ${border}`}
    >
      <span className={`h-2 w-2 rounded-full ${dot}`} />
    </span>
  );
}