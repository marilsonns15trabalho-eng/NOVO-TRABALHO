export function Card({ children }: any) {
  return (
    <div className="bg-zinc-900 p-6 rounded-xl shadow">
      {children}
    </div>
  );
}

export function CardHeader({ children }: any) {
  return <div className="mb-4">{children}</div>;
}

export function CardTitle({ children }: any) {
  return <h2 className="text-lg font-bold text-white">{children}</h2>;
}

export function CardDescription({ children }: any) {
  return <p className="text-sm text-gray-400">{children}</p>;
}

export function CardContent({ children }: any) {
  return <div className="text-white">{children}</div>;
}

export function CardFooter({ children }: any) {
  return <div className="mt-4">{children}</div>;
}