import pg from "pg";

const { Client } = pg;

const client = new Client({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT ?? 5432),
  database: process.env.PGDATABASE ?? "postgres",
  user: process.env.PGUSER ?? "postgres",
  password: process.env.PGPASSWORD,
  ssl: { rejectUnauthorized: false },
});

const sql = `
drop policy if exists "room players update rooms" on public.rooms;

create policy "room players update rooms" on public.rooms
  for update using (
    exists (
      select 1 from public.room_players
      where room_players.room_id = rooms.id
      and room_players.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.room_players
      where room_players.room_id = rooms.id
      and room_players.user_id = auth.uid()
    )
  );
`;

await client.connect();
await client.query(sql);
await client.end();

console.log("room players update rooms policy applied");
