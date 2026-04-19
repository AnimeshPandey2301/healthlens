import EmergencyBar from '@/components/EmergencyBar';

export default function EmergencyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">{children}</main>
      <EmergencyBar />
    </div>
  );
}
