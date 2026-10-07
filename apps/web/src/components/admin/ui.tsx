export function ErrorBox({ message }: { message: string }) {
  return <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{message}</p>;
}

export function Loading({ text = 'Loading…' }: { text?: string }) {
  return <p className="py-10 text-center text-sm text-stone-500">{text}</p>;
}