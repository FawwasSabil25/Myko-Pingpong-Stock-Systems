import BottomNavBar from "@/components/BottomNavBar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Main content area — leave room for the fixed bottom nav */}
      <main className="flex-1 pb-[66px]">
        {children}
      </main>

      {/* Fixed bottom navigation */}
      <BottomNavBar />
    </div>
  );
}
