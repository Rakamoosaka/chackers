import { AppNav } from "@/components/layout/app-nav";
import { RoomScreen } from "@/features/rooms/room-screen";

export default function RoomPage() {
  return (
    <main className="app-shell">
      <AppNav current="Room" />
      <section className="app-main" aria-label="Chackers room screen">
        <RoomScreen />
      </section>
    </main>
  );
}
