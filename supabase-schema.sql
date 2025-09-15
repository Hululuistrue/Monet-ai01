-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create users table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create generated_images table
create table public.generated_images (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  prompt text not null,
  image_url text not null,
  thumbnail_url text,
  size text not null default '1024x1024',
  style text default 'natural',
  quality text default 'standard',
  tokens_used integer default 1290,
  cost decimal(10,6) default 0.039,
  is_favorited boolean default false,
  is_public boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create user_credits table for tracking usage
create table public.user_credits (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade unique,
  daily_count integer default 0,
  daily_reset_at timestamp with time zone default timezone('utc'::text, now()) not null,
  total_generated integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create reports table for content moderation
create table public.reports (
  id uuid default uuid_generate_v4() primary key,
  image_id uuid references public.generated_images(id) on delete cascade,
  reporter_id uuid references public.profiles(id) on delete set null,
  reason text not null,
  status text default 'pending',
  resolved_at timestamp with time zone,
  resolved_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.generated_images enable row level security;
alter table public.user_credits enable row level security;
alter table public.reports enable row level security;

-- Create RLS policies
-- Profiles: Users can view and update their own profile
create policy "Public profiles are viewable by everyone" on public.profiles
  for select using (true);

create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Generated images: Users can view their own and public images
create policy "Users can view own images" on public.generated_images
  for select using (auth.uid() = user_id or is_public = true);

create policy "Users can insert their own images" on public.generated_images
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own images" on public.generated_images
  for update using (auth.uid() = user_id);

create policy "Users can delete their own images" on public.generated_images
  for delete using (auth.uid() = user_id);

-- User credits: Users can view their own credits
create policy "Users can view own credits" on public.user_credits
  for select using (auth.uid() = user_id);

create policy "Users can insert their own credits" on public.user_credits
  for insert with check (auth.uid() = user_id);

create policy "Users can update own credits" on public.user_credits
  for update using (auth.uid() = user_id);

-- Reports: Anyone can create reports, only admins can view all
create policy "Anyone can create reports" on public.reports
  for insert with check (true);

create policy "Users can view their own reports" on public.reports
  for select using (auth.uid() = reporter_id);

-- Functions
-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  
  insert into public.user_credits (user_id)
  values (new.id);
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to reset daily credits
create or replace function public.reset_daily_credits()
returns void as $$
begin
  update public.user_credits 
  set daily_count = 0, 
      daily_reset_at = timezone('utc'::text, now()) + interval '1 day'
  where daily_reset_at <= timezone('utc'::text, now());
end;
$$ language plpgsql security definer;

-- Create indexes for better performance
create index idx_generated_images_user_id on public.generated_images(user_id);
create index idx_generated_images_created_at on public.generated_images(created_at desc);
create index idx_generated_images_is_public on public.generated_images(is_public);
create index idx_user_credits_user_id on public.user_credits(user_id);
create index idx_reports_image_id on public.reports(image_id);
create index idx_reports_status on public.reports(status);