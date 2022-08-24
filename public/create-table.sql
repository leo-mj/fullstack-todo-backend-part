CREATE TABLE todos (
    id serial primary key,
    title text not null,
    description text not null,
    completed boolean
);

INSERT INTO todos (title, description, completed) 
VALUES 
    ('birthday-planning', 'plan birthday', false),
    ('bird-watching', 'watch birds', false)