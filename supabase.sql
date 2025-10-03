-- -- Supabase schema for Synapse core entities

-- Profiles table
create table if not exists profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    email text unique,
    full_name text,
    avatar_url text,
    is_guest boolean default false,
    created_at timestamptz default now()
);

-- ENUMs
create type problem_status as enum ('open','in_progress','resolved','urgent');
create type priority as enum ('low','medium','high');
create type message_type as enum ('new_problem','chat','conjecture','criticism','artifact');

-- Problems
create table if not exists problems (
    id serial primary key,
    title text not null,
    description text,
    status problem_status not null default 'open',
    priority priority not null default 'medium',
    owner_id uuid references profiles(id) on delete set null,
    created_by uuid references profiles(id) on delete cascade,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Chat conversations (groups of messages)
create table if not exists chat_conversations (
    id serial primary key,
    problem_id int references problems(id) on delete set null,
    title text,
    created_by uuid references profiles(id) on delete cascade,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Individual messages within conversations
create table if not exists chat_messages (
    id serial primary key,
    conversation_id int not null references chat_conversations(id) on delete cascade,
    role text not null check (role in ('user','ai')),
    content text not null,
    message_type message_type default 'chat',
    created_at timestamptz default now()
);

-- Conjectures
create table if not exists conjectures (
    id serial primary key,
    problem_id int not null references problems(id) on delete cascade,
    content text not null,
    created_by uuid references profiles(id),
    created_at timestamptz default now()
);

-- Criticisms
create table if not exists criticisms (
    id serial primary key,
    problem_id int not null references problems(id) on delete cascade,
    conjecture_id int references conjectures(id) on delete cascade,
    content text not null,
    created_by uuid references profiles(id),
    created_at timestamptz default now()
);

-- Artifacts
create table if not exists artifacts (
    id serial primary key,
    problem_id int not null references problems(id) on delete cascade,
    name text not null,
    url text not null,
    mime_type text,
    created_by uuid references profiles(id),
    created_at timestamptz default now()
);

-- Friends (socials)
create table if not exists friends (
    id serial primary key,
    user_id uuid not null references profiles(id) on delete cascade,
    friend_id uuid not null references profiles(id) on delete cascade,
    status text not null default 'pending' check (status in ('pending','accepted','blocked')),
    created_at timestamptz default now(),
    unique(user_id, friend_id)
);

-- Problem collaborators
create table if not exists problem_collaborators (
    id serial primary key,
    problem_id int not null references problems(id) on delete cascade,
    user_id uuid not null references profiles(id) on delete cascade,
    role text not null default 'collaborator' check (role in ('owner','collaborator','viewer')),
    created_at timestamptz default now(),
    unique(problem_id, user_id)
);

-- Enable RLS
alter table profiles enable row level security;
alter table problems enable row level security;
alter table chat_conversations enable row level security;
alter table chat_messages enable row level security;
alter table conjectures enable row level security;
alter table criticisms enable row level security;
alter table artifacts enable row level security;
alter table friends enable row level security;
alter table problem_collaborators enable row level security;

-- RLS Policies for profiles
create policy "Users can view their own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update their own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert their own profile" on profiles for insert with check (auth.uid() = id);

-- RLS Policies for problems
create policy "Users can view accessible problems" on problems for select using (
    auth.uid() = created_by or 
    auth.uid() = owner_id or 
    exists (select 1 from problem_collaborators where problem_id = problems.id and user_id = auth.uid())
);

create policy "Users can create problems" on problems for insert with check (auth.uid() = created_by);
create policy "Users can update problems they own" on problems for update using (auth.uid() = created_by or auth.uid() = owner_id);
create policy "Users can delete problems they own" on problems for delete using (auth.uid() = created_by or auth.uid() = owner_id);

-- RLS Policies for chat_conversations
create policy "Users can view accessible chat conversations" on chat_conversations for select using (
    auth.uid() = created_by or
    exists (select 1 from problems where id = chat_conversations.problem_id and (
        auth.uid() = problems.created_by or 
        auth.uid() = problems.owner_id or 
        exists (select 1 from problem_collaborators where problem_id = problems.id and user_id = auth.uid())
    ))
);

create policy "Users can create chat conversations" on chat_conversations for insert with check (auth.uid() = created_by);
create policy "Users can update their own chat conversations" on chat_conversations for update using (auth.uid() = created_by);
create policy "Users can delete their own chat conversations" on chat_conversations for delete using (auth.uid() = created_by);

-- RLS Policies for chat_messages
create policy "Users can view accessible chat messages" on chat_messages for select using (
    exists (select 1 from chat_conversations where id = chat_messages.conversation_id and (
        auth.uid() = chat_conversations.created_by or
        exists (select 1 from problems where id = chat_conversations.problem_id and (
            auth.uid() = problems.created_by or 
            auth.uid() = problems.owner_id or 
            exists (select 1 from problem_collaborators where problem_id = problems.id and user_id = auth.uid())
        ))
    ))
);

create policy "Users can create chat messages" on chat_messages for insert with check (
    exists (select 1 from chat_conversations where id = chat_messages.conversation_id and auth.uid() = chat_conversations.created_by)
);

create policy "Users can update their own chat messages" on chat_messages for update using (
    exists (select 1 from chat_conversations where id = chat_messages.conversation_id and auth.uid() = chat_conversations.created_by)
);

create policy "Users can delete their own chat messages" on chat_messages for delete using (
    exists (select 1 from chat_conversations where id = chat_messages.conversation_id and auth.uid() = chat_conversations.created_by)
);

-- RLS Policies for conjectures
create policy "Users can view conjectures for accessible problems" on conjectures for select using (
    exists (select 1 from problems where id = conjectures.problem_id and (
        auth.uid() = problems.created_by or 
        auth.uid() = problems.owner_id or 
        exists (select 1 from problem_collaborators where problem_id = problems.id and user_id = auth.uid())
    ))
);

create policy "Users can create conjectures for accessible problems" on conjectures for insert with check (
    auth.uid() = created_by and
    exists (select 1 from problems where id = conjectures.problem_id and (
        auth.uid() = problems.created_by or 
        auth.uid() = problems.owner_id or 
        exists (select 1 from problem_collaborators where problem_id = problems.id and user_id = auth.uid())
    ))
);

create policy "Users can update their own conjectures" on conjectures for update using (auth.uid() = created_by);
create policy "Users can delete their own conjectures" on conjectures for delete using (auth.uid() = created_by);

-- RLS Policies for criticisms
create policy "Users can view criticisms for accessible problems" on criticisms for select using (
    exists (select 1 from problems where id = criticisms.problem_id and (
        auth.uid() = problems.created_by or 
        auth.uid() = problems.owner_id or 
        exists (select 1 from problem_collaborators where problem_id = problems.id and user_id = auth.uid())
    ))
);

create policy "Users can create criticisms for accessible problems" on criticisms for insert with check (
    auth.uid() = created_by and
    exists (select 1 from problems where id = criticisms.problem_id and (
        auth.uid() = problems.created_by or 
        auth.uid() = problems.owner_id or 
        exists (select 1 from problem_collaborators where problem_id = problems.id and user_id = auth.uid())
    ))
);

create policy "Users can update their own criticisms" on criticisms for update using (auth.uid() = created_by);
create policy "Users can delete their own criticisms" on criticisms for delete using (auth.uid() = created_by);

-- RLS Policies for artifacts
create policy "Users can view artifacts for accessible problems" on artifacts for select using (
    exists (select 1 from problems where id = artifacts.problem_id and (
        auth.uid() = problems.created_by or 
        auth.uid() = problems.owner_id or 
        exists (select 1 from problem_collaborators where problem_id = problems.id and user_id = auth.uid())
    ))
);

create policy "Users can create artifacts for accessible problems" on artifacts for insert with check (
    auth.uid() = created_by and
    exists (select 1 from problems where id = artifacts.problem_id and (
        auth.uid() = problems.created_by or 
        auth.uid() = problems.owner_id or 
        exists (select 1 from problem_collaborators where problem_id = problems.id and user_id = auth.uid())
    ))
);

create policy "Users can update their own artifacts" on artifacts for update using (auth.uid() = created_by);
create policy "Users can delete their own artifacts" on artifacts for delete using (auth.uid() = created_by);

-- RLS Policies for friends
create policy "Users can view their own friends" on friends for select using (auth.uid() = user_id or auth.uid() = friend_id);
create policy "Users can create friend requests" on friends for insert with check (auth.uid() = user_id);
create policy "Users can update their own friend requests" on friends for update using (auth.uid() = user_id or auth.uid() = friend_id);
create policy "Users can delete their own friend requests" on friends for delete using (auth.uid() = user_id or auth.uid() = friend_id);

-- RLS Policies for problem_collaborators
create policy "Users can view collaborators for accessible problems" on problem_collaborators for select using (
    auth.uid() = user_id or
    exists (select 1 from problems where id = problem_collaborators.problem_id and (
        auth.uid() = problems.created_by or 
        auth.uid() = problems.owner_id
    ))
);

create policy "Problem owners can manage collaborators" on problem_collaborators for all using (
    exists (select 1 from problems where id = problem_collaborators.problem_id and (
        auth.uid() = problems.created_by or 
        auth.uid() = problems.owner_id
    ))
);

-- Function to create guest profile
create or replace function public.create_guest_profile()
returns uuid as $$
declare
    guest_id uuid;
begin
    -- Generate a random UUID for the guest
    guest_id := gen_random_uuid();
    
    -- Insert the guest profile
    insert into public.profiles (id, email, full_name, is_guest)
    values (guest_id, null, 'Guest User', true);
    
    return guest_id;
end;
$$ language plpgsql security definer;

-- Function to handle guest chat
create or replace function public.handle_guest_chat(
    guest_id uuid,
    message_content text,
    problem_id_param int default null
)
returns json as $$
declare
    conversation_id int;
    user_message_id int;
    ai_message_id int;
    result json;
begin
    -- Create a new conversation if problem_id is null (unlinked chat)
    if problem_id_param is null then
        insert into public.chat_conversations (problem_id, title, created_by)
        values (null, substring(message_content from 1 for 50), guest_id)
        returning id into conversation_id;
    else
        -- Check if there's an existing conversation for this problem
        select id into conversation_id
        from public.chat_conversations
        where problem_id = problem_id_param and created_by = guest_id
        order by created_at desc
        limit 1;
        
        -- If no existing conversation, create a new one
        if conversation_id is null then
            insert into public.chat_conversations (problem_id, title, created_by)
            values (problem_id_param, substring(message_content from 1 for 50), guest_id)
            returning id into conversation_id;
        end if;
    end if;
    
    -- Insert user message
    insert into public.chat_messages (conversation_id, role, content)
    values (conversation_id, 'user', message_content)
    returning id into user_message_id;
    
    -- Insert AI response (placeholder)
    insert into public.chat_messages (conversation_id, role, content)
    values (conversation_id, 'ai', 'AI response will be generated here')
    returning id into ai_message_id;
    
    -- Return the conversation and message IDs
    result := json_build_object(
        'conversation_id', conversation_id,
        'user_message_id', user_message_id,
        'ai_message_id', ai_message_id
    );
    
    return result;
end;
$$ language plpgsql security definer;

-- Function to convert guest profile to registered user
create or replace function public.convert_guest_to_user(
    guest_id uuid,
    user_email text,
    user_full_name text default null
)
returns boolean as $$
begin
    -- Update the guest profile to become a registered user
    update public.profiles
    set 
        email = user_email,
        full_name = coalesce(user_full_name, full_name),
        is_guest = false
    where id = guest_id and is_guest = true;
    
    -- Return true if the update was successful
    return found;
end;
$$ language plpgsql security definer;

-- Remove generated_by_chat_id column from problems table (if it exists)
alter table problems drop column if exists generated_by_chat_id;
