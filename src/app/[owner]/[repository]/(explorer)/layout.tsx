export default function ExplorerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-3 bg-red-500/10">
        This is where the browser goes
      </div>
      <div className="col-span-9">
        actual files?
        {children}
      </div>
    </div>
  );
}
