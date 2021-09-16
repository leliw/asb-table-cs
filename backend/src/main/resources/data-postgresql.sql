insert into users(username, password, enabled) values ('user', '{bcrypt}$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.0FxO/BTk76klW', true);
insert into authorities(username, authority) values ('user', 'ROLE_USER');
insert into users(username, password, enabled) values ('admin', '{bcrypt}$2a$10$GRLdNijSQMUvl/au9ofL.eDwmoohzzS7.rmNSJZ.0FxO/BTk76klW', true);
insert into authorities(username, authority) values ('admin', 'ROLE_USER');
insert into authorities(username, authority) values ('admin', 'ROLE_ADMIN');