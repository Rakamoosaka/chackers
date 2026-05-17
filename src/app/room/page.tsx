import { AppNav } from "@/components/layout/app-nav";
import { RoomScreen } from "@/features/rooms/room-screen";

export default function RoomPage() {
  return (
    <main className="app-shell">
      <AppNav current="Room" />
      <section className="app-main" aria-label="Chackers room screen">
        <div className="top-bar">
          <div>
            <h1>Friend Room</h1>
            <p>Create an invite link and claim seats</p>
          </div>
        </div>
        <RoomScreen />
      </section>
    </main>
  );
}
