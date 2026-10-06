export function Footer() {
  return (
    <footer className="mt-16 border-t border-stone-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 text-center text-sm text-stone-500">
        <p className="font-semibold text-stone-700">
          Meal<span className="text-orange-600">Rush</span>
        </p>
        <p className="mt-1">Fresh food, delivered fast.</p>
        <p className="mt-4">© {new Date().getFullYear()} MealRush. Built as a technical assessment project.</p>
      </div>
    </footer>
  );
}