delete from public.leaderboard_entries
where seeded = true
and display_name in ('Aruzhan', 'Miras', 'Dana', 'Nurlan', 'Aigerim');

insert into public.leaderboard_entries (
  display_name,
  city,
  league,
  rating,
  games_played,
  seeded
) values
  ('Aruzhan', 'Almaty', 'Gold', 1560, 42, true),
  ('Miras', 'Astana', 'Silver', 1390, 27, true),
  ('Dana', 'Shymkent', 'Bronze', 1215, 16, true),
  ('Nurlan', 'Almaty', 'Silver', 1440, 31, true),
  ('Aigerim', 'Almaty', 'Bronze', 1180, 11, true);
