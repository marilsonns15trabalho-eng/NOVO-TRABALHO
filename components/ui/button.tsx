export function Button({ children, ...props }: any) {
  return (
    <button {...props} className="bg-orange-500 text-white px-4 py-2 rounded">
      {children}
    </button>
  );
}