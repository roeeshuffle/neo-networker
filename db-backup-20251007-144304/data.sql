--
-- PostgreSQL database dump
--

\restrict wVd66HzvsqriqzBfX37YubPHEUtK6LeMhmU6LpldOffUMXWaacnNHpSHfrTfMFv

-- Dumped from database version 15.14 (Debian 15.14-1.pgdg13+1)
-- Dumped by pg_dump version 15.14 (Debian 15.14-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.profiles (id, full_name, email, password_hash, is_approved, telegram_id, approved_by, approved_at, avatar_url, provider, preferred_messaging_platform, state_data, user_preferences, google_id, google_refresh_token, google_access_token, google_token_expires_at, google_contacts_synced_at, google_calendar_synced_at, created_at, updated_at, is_admin) FROM stdin;
6a0c4394-530e-444a-a23e-23b48fd4cab4	roee shuffle	roee@wershuffle.com	pbkdf2:sha256:1000000$7mmsKn81Dn94lRb7$1e32dbe21a97e4bd22dec707d619f1b969d5594bf55cb39ea775e448b480e0d5	t	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 17:56:10.019908	\N	\N	telegram	\N	{"group_members": [{"id": "6a0c4394-530e-444a-a23e-23b48fd4cab4_roee2912@gmail.com_0", "email": "roee2912@gmail.com", "full_name": "Roee Feingold", "added_at": "2025-10-06T18:24:59.944145", "status": "approved"}], "contact_columns": [{"key": "group", "label": "Group", "enabled": true, "order": 1}, {"key": "first_name", "label": "First Name", "enabled": true, "order": 2}, {"key": "last_name", "label": "Last Name", "enabled": true, "order": 3}, {"key": "organization", "label": "Organization", "enabled": true, "order": 4}, {"key": "job_title", "label": "Job Title", "enabled": true, "order": 5}, {"key": "status", "label": "Status", "enabled": true, "order": 6}, {"key": "email", "label": "Email", "enabled": true, "order": 7}, {"key": "phone", "label": "Phone", "enabled": false, "order": 8}, {"key": "mobile", "label": "Mobile", "enabled": false, "order": 9}, {"key": "priority", "label": "Priority", "enabled": false, "order": 10}, {"key": "source", "label": "Source", "enabled": false, "order": 11}, {"key": "linkedin_url", "label": "LinkedIn", "enabled": false, "order": 12}, {"key": "github_url", "label": "GitHub", "enabled": false, "order": 13}, {"key": "website_url", "label": "Website", "enabled": false, "order": 14}, {"key": "address", "label": "Address", "enabled": false, "order": 15}, {"key": "notes", "label": "Notes", "enabled": true, "order": 16}, {"key": "last_contact_date", "label": "Last Contact", "enabled": false, "order": 17}, {"key": "next_follow_up_date", "label": "Next Follow-up", "enabled": false, "order": 18}, {"key": "created_at", "label": "Created At", "enabled": false, "order": 19}, {"key": "custom_undefined", "enabled": false, "order": 20}]}	\N	\N	\N	\N	\N	\N	2025-10-06 17:55:56.499566	2025-10-06 22:29:30.890668	f
b8e91e36-e921-4417-9005-892efcd17329	Roee Feingold	roee2912@gmail.com	scrypt:32768:8:1$EbSXonJRleDwtndg$6e8ea39f945230687d90411dfc2cce5da61726fab0510e7bf1d0141280b2870e60b35da7e45c886d610123735c8b0259df0d7f2c73b686b13717e9eb8d994fb6	t	1001816902	\N	\N	\N	\N	telegram	{"thread_id": "thread_LCpO0dMGLwBfYAtQ82nyuI0u"}	{"custom_fields": ["agenda", "more info"], "calendar_settings": {"defaultView": "monthly", "startWeekday": "sunday"}, "contact_columns": [{"key": "first_name", "label": "First Name", "enabled": true, "order": 1}, {"key": "last_name", "label": "Last Name", "enabled": true, "order": 2}, {"key": "organization", "label": "Organization", "enabled": true, "order": 3}, {"key": "job_title", "label": "Job Title", "enabled": true, "order": 4}, {"key": "status", "label": "Status", "enabled": true, "order": 5}, {"key": "email", "label": "Email", "enabled": true, "order": 6}, {"key": "phone", "label": "Phone", "enabled": false, "order": 7}, {"key": "mobile", "label": "Mobile", "enabled": false, "order": 8}, {"key": "priority", "label": "Priority", "enabled": false, "order": 9}, {"key": "group", "label": "Group", "enabled": false, "order": 10}, {"key": "source", "label": "Source", "enabled": false, "order": 11}, {"key": "linkedin_url", "label": "LinkedIn", "enabled": false, "order": 12}, {"key": "github_url", "label": "GitHub", "enabled": false, "order": 13}, {"key": "website_url", "label": "Website", "enabled": false, "order": 14}, {"key": "address", "label": "Address", "enabled": false, "order": 15}, {"key": "notes", "label": "Notes", "enabled": true, "order": 16}, {"key": "last_contact_date", "label": "Last Contact", "enabled": false, "order": 17}, {"key": "next_follow_up_date", "label": "Next Follow-up", "enabled": false, "order": 18}, {"key": "created_at", "label": "Created At", "enabled": false, "order": 19}, {"key": "custom_undefined", "enabled": false, "order": 20}], "group_members": [{"id": "b8e91e36-e921-4417-9005-892efcd17329_guy@wershuffle.com_0", "email": "guy@wershuffle.com", "full_name": "guy", "added_at": "2025-10-06T14:55:37.007476", "status": "approved"}, {"id": "b8e91e36-e921-4417-9005-892efcd17329_roee@wershuffle.com_1", "email": "roee@wershuffle.com", "full_name": "Roee Shuffle", "added_at": "2025-10-06T18:24:59.942391", "status": "approved"}], "waiting_for_group_approve": []}	\N	\N	\N	\N	\N	\N	2025-10-05 22:22:19.075062	2025-10-07 09:02:32.269578	t
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.events (id, title, description, start_datetime, end_datetime, location, event_type, participants, alert_minutes, repeat_pattern, repeat_interval, repeat_days, repeat_end_date, notes, is_active, created_at, updated_at, user_id, owner_id) FROM stdin;
5	test6		2025-10-13 06:00:00	2025-10-13 07:00:00		event	[]	15	none	1	[]	\N		f	2025-10-06 23:21:51.285738	2025-10-06 23:24:11.351138	6a0c4394-530e-444a-a23e-23b48fd4cab4	6a0c4394-530e-444a-a23e-23b48fd4cab4
7	wwwttt		2025-10-13 06:00:00	2025-10-13 07:00:00		event	[]	15	none	1	[]	\N		f	2025-10-06 23:21:59.097142	2025-10-06 23:24:14.448393	6a0c4394-530e-444a-a23e-23b48fd4cab4	6a0c4394-530e-444a-a23e-23b48fd4cab4
6	wwww		2025-10-13 06:00:00	2025-10-13 07:00:00		event	[]	15	none	1	[]	\N		f	2025-10-06 23:21:55.280985	2025-10-06 23:24:16.79599	6a0c4394-530e-444a-a23e-23b48fd4cab4	6a0c4394-530e-444a-a23e-23b48fd4cab4
8	test56		2025-10-08 06:00:00	2025-10-08 07:00:00		event	[]	15	none	1	[]	\N		f	2025-10-06 23:38:35.656302	2025-10-06 23:40:48.600422	6a0c4394-530e-444a-a23e-23b48fd4cab4	6a0c4394-530e-444a-a23e-23b48fd4cab4
4	test5		2025-10-08 06:00:00	2025-10-08 07:00:00		event	[]	15	none	1	[]	\N		f	2025-10-06 23:21:45.618553	2025-10-06 23:46:17.947214	6a0c4394-530e-444a-a23e-23b48fd4cab4	6a0c4394-530e-444a-a23e-23b48fd4cab4
10	test8		2025-10-21 06:00:00	2025-10-21 07:00:00		event	[{"id": "6a0c4394-530e-444a-a23e-23b48fd4cab4_roee2912@gmail.com_0", "name": "Roee Feingold", "email": "roee2912@gmail.com"}]	15	none	1	[]	\N		t	2025-10-06 23:46:28.498774	2025-10-06 23:46:28.49878	6a0c4394-530e-444a-a23e-23b48fd4cab4	6a0c4394-530e-444a-a23e-23b48fd4cab4
11	test888		2025-10-09 06:00:00	2025-10-09 07:00:00		event	[{"id": "6a0c4394-530e-444a-a23e-23b48fd4cab4_roee2912@gmail.com_0", "name": "Roee Feingold", "email": "roee2912@gmail.com"}]	15	none	1	[]	\N		f	2025-10-07 00:08:50.78797	2025-10-07 00:20:08.383566	6a0c4394-530e-444a-a23e-23b48fd4cab4	6a0c4394-530e-444a-a23e-23b48fd4cab4
13	testevcent		2025-10-08 06:00:00	2025-10-08 07:00:00		event	[{"id": "6a0c4394-530e-444a-a23e-23b48fd4cab4_roee2912@gmail.com_0", "name": "Roee Feingold", "email": "roee2912@gmail.com"}]	15	none	1	[]	\N		t	2025-10-07 07:08:14.595779	2025-10-07 07:08:14.595785	6a0c4394-530e-444a-a23e-23b48fd4cab4	6a0c4394-530e-444a-a23e-23b48fd4cab4
16	dentist appointment	\N	2023-10-13 09:00:00	2023-10-13 10:00:00	Smile Clinic	event	[]	15	\N	1	null	\N	\N	t	2025-10-07 09:21:41.843492	2025-10-07 09:21:41.843498	b8e91e36-e921-4417-9005-892efcd17329	b8e91e36-e921-4417-9005-892efcd17329
17	yoga class	\N	2023-10-09 18:00:00	2023-10-09 19:00:00	\N	event	[]	15	weekly	1	[1, 3]	\N	\N	t	2025-10-07 09:22:04.490363	2025-10-07 09:22:04.490369	b8e91e36-e921-4417-9005-892efcd17329	b8e91e36-e921-4417-9005-892efcd17329
18	lunch with Maya	\N	2023-10-07 12:30:00	2023-10-07 13:30:00	Aroma	event	[]	15	\N	1	null	\N	\N	t	2025-10-07 09:22:31.427562	2025-10-07 09:22:31.427565	b8e91e36-e921-4417-9005-892efcd17329	b8e91e36-e921-4417-9005-892efcd17329
19	birthday party for Tom	\N	2023-10-20 20:00:00	2023-10-20 21:00:00	\N	event	[]	15	\N	1	null	\N	\N	t	2025-10-07 09:22:39.214983	2025-10-07 09:22:39.214985	b8e91e36-e921-4417-9005-892efcd17329	b8e91e36-e921-4417-9005-892efcd17329
1	aaa		2025-10-09 06:00:00	2025-10-09 07:00:00		event	[]	15	none	1	[]	\N		t	2025-10-06 09:03:40.893805	2025-10-06 09:03:43.831113	b8e91e36-e921-4417-9005-892efcd17329	b8e91e36-e921-4417-9005-892efcd17329
3	bbb		2025-10-09 06:00:00	2025-10-09 07:00:00		event	[]	15	none	1	[]	\N		t	2025-10-06 09:03:52.699916	2025-10-06 09:03:54.68714	b8e91e36-e921-4417-9005-892efcd17329	b8e91e36-e921-4417-9005-892efcd17329
2	aaa		2025-10-09 06:00:00	2025-10-09 07:00:00		event	[]	15	none	1	[]	\N		t	2025-10-06 09:03:49.321576	2025-10-06 09:03:56.39189	b8e91e36-e921-4417-9005-892efcd17329	b8e91e36-e921-4417-9005-892efcd17329
9	test45		2025-10-08 06:00:00	2025-10-08 07:00:00		event	[{"id": "b8e91e36-e921-4417-9005-892efcd17329_roee@wershuffle.com_1", "name": "Roee Shuffle", "email": "roee@wershuffle.com"}]	15	none	1	[]	\N		t	2025-10-06 23:45:47.586017	2025-10-07 00:18:36.167	b8e91e36-e921-4417-9005-892efcd17329	b8e91e36-e921-4417-9005-892efcd17329
12	testest		2025-10-08 06:00:00	2025-10-08 07:00:00		event	[{"id": "b8e91e36-e921-4417-9005-892efcd17329_guy@wershuffle.com_0", "name": "guy", "email": "guy@wershuffle.com"}]	15	none	1	[]	\N		t	2025-10-07 00:18:07.055167	2025-10-07 00:18:38.294836	b8e91e36-e921-4417-9005-892efcd17329	b8e91e36-e921-4417-9005-892efcd17329
21	Team Meeting	\N	2025-10-08 14:00:00	2025-10-08 15:00:00	\N	meeting	[{"name": "Roee Feingold", "email": "roee2912@gmail.com"}]	\N	\N	\N	\N	\N	\N	t	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	b8e91e36-e921-4417-9005-892efcd17329
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, user_email, notification, notification_type, is_read, seen, created_at) FROM stdin;
1	roee2912@gmail.com	John Doe assigned task "Complete project proposal" to you	task_assigned	t	f	2025-10-07 06:51:18.182903
2	roee2912@gmail.com	Jane Smith shared contact "Alice Johnson" with you	contact_shared	t	f	2025-10-07 06:51:18.182903
3	roee2912@gmail.com	Mike Wilson created event "Team Meeting" and added you as a participant	event_assigned	t	f	2025-10-07 06:51:18.182903
4	roee2912@gmail.com	Sarah Brown updated task "Review documents"	task_assigned	t	f	2025-10-07 06:51:18.182903
5	roee2912@gmail.com	Tom Davis shared contact "Bob Wilson, Carol Smith, and 2 more" with you	contact_shared	t	f	2025-10-07 06:51:18.182903
6	roee2912@gmail.com	Lisa Green added you to their group and is waiting for your approval	group_invitation	t	f	2025-10-07 06:51:18.182903
7	roee2912@gmail.com	Alex Johnson updated event "Client Presentation"	event_assigned	t	f	2025-10-07 06:51:18.182903
8	roee2912@gmail.com	Welcome to Alist CRM! You can now manage your contacts, tasks, and events.	general	t	f	2025-10-07 06:51:18.182903
9	rrrrrr	roee2912@gmail.com assigned task 'roee@wershuffle.com' to you	task_assigned	f	f	2025-10-07 07:00:43.980729
10	roee2912@gmail.com	Test notification for red dot indicator	task_assigned	t	f	2025-10-07 07:04:00.459241
11	roee@wershuffle.com	roee2912@gmail.com updated task 'testimportant'	task_assigned	t	f	2025-10-07 07:06:08.005796
12	roee@wershuffle.com	roee2912@gmail.com updated task 'test7'	task_assigned	t	f	2025-10-07 07:07:37.985248
13	roee2912@gmail.com	roee@wershuffle.com created event 'testevcent' and added you as a participant	event_assigned	f	f	2025-10-07 07:08:14.6064
\.


--
-- Data for Name: people; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.people (id, first_name, last_name, gender, birthday, organization, job_title, job_status, email, phone, mobile, address, linkedin_url, github_url, facebook_url, twitter_url, website_url, notes, source, tags, last_contact_date, next_follow_up_date, status, priority, "group", custom_fields, owner_id, created_at, updated_at) FROM stdin;
998	Adi	Zichter	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	Work	{"more info": "Talpiot"}	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.331405	2025-10-06 23:05:47.764558
1149	John	Smith	\N	\N	Puzzlesoft	CEO	\N	john@puzzlesoft.com	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	null	b8e91e36-e921-4417-9005-892efcd17329	2025-10-07 09:24:52.902851	2025-10-07 09:24:52.902855
1150	Sarah	Cohen	\N	\N	Intel	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	null	b8e91e36-e921-4417-9005-892efcd17329	2025-10-07 09:25:01.531705	2025-10-07 09:25:01.531707
1151	Michael	Levi	\N	\N	Google	Product Manager	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	null	b8e91e36-e921-4417-9005-892efcd17329	2025-10-07 09:25:14.104381	2025-10-07 09:25:14.104392
850	Aya	Sano	\N	\N	Sano	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Sponsor/Donor	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.752349	2025-10-06 22:38:03.196002
887	Gal	Chechic	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	AI Advisory member, Architect Instructor	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.785673	2025-10-06 22:38:03.298231
891	Gil	Elbaz	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Architect Instructor	\N	\N	Nvidia	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.789435	2025-10-06 22:38:03.300967
895	Hofman		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Sponsor/Donor	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.792259	2025-10-06 22:38:03.303266
898	Ido	Bronstein	\N	\N	\N	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/ido-bronstein-0722ab1b8/	\N	\N	\N	\N	\N	roee shuffle Sharing	\N	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.795554	2025-10-06 22:38:03.30492
901	Isaac	Ben-Israel	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	AI Mentor /Helper /builder, Mega Connector	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.799104	2025-10-06 22:38:03.307054
904	Joanna	Landau	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Sponsor/Donor	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.802167	2025-10-06 22:38:03.309598
908	Lior	Wolf	\N	\N	Mentee	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/liorwolf/	\N	\N	\N	\N	\N	roee shuffle Sharing	Architect Track Instructor	\N	\N	CEO	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.805619	2025-10-06 22:38:03.312414
912	Maor	Ezer	\N	\N	Ai work	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Office Hours	\N	\N	Ceo founder	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.808488	2025-10-06 22:38:03.315156
916	Michal	Gonen	\N	\N	Axonius	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/michal-gonen/	\N	\N	\N	\N	\N	roee shuffle Sharing	Mega Connector	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.81138	2025-10-06 22:38:03.322117
920	Moshe	Shalev	\N	\N	Decart	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Sponsor/Donor	\N	\N	COO	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.814716	2025-10-06 22:38:03.324298
924	Nitzan	Tur (49/SSI)	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Elite Unit Champions	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.817414	2025-10-06 22:38:03.32684
927	Ofer	Yanay	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Sponsor/Donor	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.82163	2025-10-06 22:38:03.328744
931	Omri		\N	\N	Clay	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/omrimendellevich?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app	\N	\N	\N	\N	\N	roee shuffle Sharing	Architect Track Instructor, Post Exit Founder	\N	\N	Ai	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.825236	2025-10-06 22:38:03.330832
935	Omri	Odem	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Sponsor/Donor	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.828705	2025-10-06 22:38:03.333908
942	Ori	Goshen	\N	\N	a21	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/ori-goshen/	\N	\N	\N	\N	\N	roee shuffle Sharing	\N	\N	\N	ceo	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.836284	2025-10-06 22:38:03.336164
947	Ron		\N	\N	\N	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/ron-taushtein-shachar-32159516b/?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app	\N	\N	\N	\N	\N	roee shuffle Sharing	\N	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.843636	2025-10-06 22:38:03.337966
950	Saron	Seeman	\N	\N	\N	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/sharon-seemann-b84a354/	\N	\N	\N	\N	\N	roee shuffle Sharing	\N	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.846722	2025-10-06 22:38:03.34007
954	Shahak	Shalev	\N	\N	Cyrus Security acquired by Malwarebytes	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/shahak-shalev-ba2a49135/	\N	\N	\N	\N	\N	roee shuffle Sharing	Post Exit Founder, Potential Architect Student, Sponsor/Donor	\N	\N	CTO & Co-Founder	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.849651	2025-10-06 22:38:03.342296
958	Shawn	Macguire	\N	\N	Seoqia	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Mega Connector, Sponsor/Donor	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.853558	2025-10-06 22:38:03.344823
965	Todd	Kesselman	\N	\N	Precision	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Sponsor/Donor	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.859802	2025-10-06 22:38:03.348869
1068	Yuval	Belfer	\N	\N	a21	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	Generative AI	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.453712	2025-10-06 22:48:39.226684
1069	Imported Contact 164	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.456085	2025-10-06 22:48:39.228859
888	Gal	Perezt	\N	\N	Torq	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/gal-peretz/	\N	\N	\N	\N	\N	roee shuffle Sharing	Architect Track Instructor	\N	\N	Head of Ai	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.786722	2025-10-06 22:38:03.363813
892	Hamutal	Meridor	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Sponsor/Donor	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.790125	2025-10-06 22:38:03.366079
896	Idan	Gazit	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Architect Instructor	\N	\N	Head of GiyHub	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.792897	2025-10-06 22:38:03.36819
899	Ilan	Kedar	\N	\N	Plurai	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/ilan-kadar-b57ba511b/	\N	\N	\N	\N	\N	roee shuffle Sharing	Architect Track Instructor	\N	\N	CEO	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.796467	2025-10-06 22:38:03.370609
905	Jonathan	Gefiman	\N	\N	Deci	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Architect Track Instructor	\N	\N	CEO	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.803019	2025-10-06 22:38:03.372678
909	Liran	Hason	\N	\N	Coralogix	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/hasuni/	\N	\N	\N	\N	\N	roee shuffle Sharing	Architect Track Instructor	\N	\N	Head of Ai	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.806293	2025-10-06 22:38:03.376017
913	Matan		\N	\N	Apex cyber	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/mderman?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app	\N	\N	\N	\N	\N	roee shuffle Sharing	Office Hours	\N	\N	Ceo founder	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.809136	2025-10-06 22:38:03.378195
917	Miryam	Edelson	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Sponsor/Donor	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.812684	2025-10-06 22:38:03.380331
921	Naama	Dayan	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	\N	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.815366	2025-10-06 22:38:03.382539
925	Noa	Zilberstein	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	\N	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.818029	2025-10-06 22:38:03.384544
928	Ohad	Gliksman	\N	\N	Angel	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Post Exit Founder, Sponsor/Donor	\N	\N	5 eyes	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.822672	2025-10-06 22:38:03.387119
932	Imported Contact 101	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	\N	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.826131	2025-10-06 22:38:03.389435
936	Omri	Vinshtein	\N	\N	Duplex	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Architect Track Instructor	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.829523	2025-10-06 22:38:03.391807
939	Ori	Avraham	\N	\N	OZ	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Elite Unit Champions	\N	\N	CEO	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.833708	2025-10-06 22:38:03.394284
943	Ori	Striechman	\N	\N	Head of Matzov entrepreneurship forum	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/ori-striechman/	\N	\N	\N	\N	\N	roee shuffle Sharing	\N	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.837287	2025-10-06 22:38:03.396292
945	Recanati		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Sponsor/Donor	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.840922	2025-10-06 22:38:03.399584
951	Seffi	Cohen	\N	\N	\N	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/seffi-cohen-11182046?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app	\N	\N	\N	\N	\N	roee shuffle Sharing	Architect Track Instructor	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.847494	2025-10-06 22:38:03.401972
962	Tel	Aviv Jude Yovel Recanati	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Sponsor/Donor	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.857715	2025-10-06 22:38:03.408687
889	Gideon	stein	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Sponsor/Donor	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.787676	2025-10-06 22:38:03.424629
893	harel	rom	\N	\N	stealth	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/harel-rom/	\N	\N	\N	\N	\N	roee shuffle Sharing	\N	\N	\N	CTO Founder	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.790834	2025-10-06 22:38:03.426976
897	Idan	Megidish	\N	\N	\N	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/idan-megidish?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app	\N	\N	\N	\N	\N	roee shuffle Sharing	Sponsor/Donor	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.793623	2025-10-06 22:38:03.428849
902	Itzik	Ben Shaul	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Founders Track Instructor, Sponsor/Donor	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.800633	2025-10-06 22:38:03.430732
906	Kfir	Shoar	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Elite Unit Champions, Potential Architect Student	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.803992	2025-10-06 22:38:03.432428
910	Lotem	Peled	\N	\N	Datagen, Technion, phd	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/lotempeled/	\N	\N	\N	\N	\N	roee shuffle Sharing	Architect Track Instructor	\N	\N	Tech- NLP, LLM	\N	\N	{"more info": "I wrote her."}	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.80699	2025-10-06 22:38:03.434857
914	Michael	Kagen	\N	\N	Invidia [Ex Mellanox]	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/mikagan/	\N	\N	\N	\N	\N	roee shuffle Sharing	AI Advisory member	\N	\N	CTO	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.809896	2025-10-06 22:38:03.436625
918	Misha	Feinstein	\N	\N	Bria.ai	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/michael-feinstein/	\N	\N	\N	\N	\N	roee shuffle Sharing	\N	\N	\N	CTO	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.813378	2025-10-06 22:38:03.438809
922	Nir	Hutnik	\N	\N	Deepkeepp	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/nir-hutnik/	\N	\N	\N	\N	\N	roee shuffle Sharing	\N	\N	\N	LLM	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.816039	2025-10-06 22:38:03.440573
926	Ofek	Censor	\N	\N	Building	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Elite Unit Champions	\N	\N	Founder	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.819248	2025-10-06 22:38:03.442542
929	Omer	ben hurin	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Elite Unit Champions	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.823698	2025-10-06 22:38:03.444777
933	Omri	Geller	\N	\N	Run ai	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/omri-geller-47407a155/	\N	\N	\N	\N	\N	roee shuffle Sharing	Post Exit Founder, Sponsor/Donor	\N	\N	CEO	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.827077	2025-10-06 22:38:03.447698
937	Or	Lenchner	\N	\N	Bright Data	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Architect Track Instructor	\N	\N	CEO	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.830811	2025-10-06 22:38:03.449786
940	Ori	Elbyev	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Office Hours	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.834636	2025-10-06 22:38:03.451813
944	Orr	Danon	\N	\N	Hailo Technologies	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/orr-danon-329944106/	\N	\N	\N	\N	\N	roee shuffle Sharing	Elite Unit Champions	\N	\N	CEO	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.838194	2025-10-06 22:38:03.453377
948	Roni		\N	\N	Ex wework [#3]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Sponsor/Donor	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.845208	2025-10-06 22:38:03.454969
952	Shachar	Cohen	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Elite Unit Champions	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.848305	2025-10-06 22:38:03.456893
956	Shalev	Hulio	\N	\N	Ex NSO, Dream Security	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Mega Connector, Sponsor/Donor	\N	\N	CEO	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.851859	2025-10-06 22:38:03.458646
963	The	Edmond de Rothschild Foundation (Israel)	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Sponsor/Donor	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.858421	2025-10-06 22:38:03.460518
971	Yair	Adato	\N	\N	\N	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/yair-adato-4936b236/	\N	\N	\N	\N	\N	roee shuffle Sharing	\N	\N	\N	CEO Bria	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.863921	2025-10-06 22:38:03.463902
1098	Tomer	Simon	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.51006	2025-10-06 22:48:39.247976
1022	David	siegal	\N	\N	Tech Mission	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	Tech mission manager	\N	\N	{"agenda": "ask about who is relevant"}	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.381025	2025-10-06 22:48:39.327212
1023	David	Zalik	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.382497	2025-10-06 22:48:39.328889
1024	Dean	Leitersdorf	\N	\N	Decart	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.384697	2025-10-06 22:48:39.33074
1025	Dean	Sysman	\N	\N	Axonius	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	CEO and Founder	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.386358	2025-10-06 22:48:39.332114
1026	Dell	Foundation	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.388022	2025-10-06 22:48:39.333587
1027	Dolev		\N	\N	Gong	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	senior Director	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.38953	2025-10-06 22:48:39.334913
1028	Dorit	Dor	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.391139	2025-10-06 22:48:39.336127
843	Amichai	Shulman	\N	\N	Ex	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Sponsor/Donor	\N	\N	active	medium	work	{"agenda": null, "more info": null}	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.743078	2025-10-06 22:42:38.767083
1044	Gal	Chechic	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.416871	2025-10-06 22:48:39.086742
1045	Gil	Elbaz	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	Nvidia	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.41826	2025-10-06 22:48:39.091228
1046	Hofman		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.419692	2025-10-06 22:48:39.094279
1047	Ido	Bronstein	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.421285	2025-10-06 22:48:39.096858
1048	Isaac	Ben-Israel	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.422782	2025-10-06 22:48:39.098811
1049	Joanna	Landau	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.424199	2025-10-06 22:48:39.101084
1050	Lior	Wolf	\N	\N	Mentee	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	CEO	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.425683	2025-10-06 22:48:39.103375
1051	Maor	Ezer	\N	\N	Ai work	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	Ceo founder	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.427419	2025-10-06 22:48:39.105434
1053	Moshe	Shalev	\N	\N	Decart	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	COO	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.430907	2025-10-06 22:48:39.11104
1054	Nitzan	Tur (49/SSI)	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.432322	2025-10-06 22:48:39.114359
1055	Ofer	Yanay	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.433724	2025-10-06 22:48:39.117063
1056	Omri		\N	\N	Clay	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	Ai	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.435129	2025-10-06 22:48:39.119502
1057	Omri	Odem	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.436699	2025-10-06 22:48:39.122124
1058	Ori	Goshen	\N	\N	a21	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	ceo	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.438303	2025-10-06 22:48:39.124479
1059	Ron		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.439803	2025-10-06 22:48:39.127154
1060	Saron	Seeman	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.44118	2025-10-06 22:48:39.130272
1061	Shahak	Shalev	\N	\N	Cyrus Security acquired by Malwarebytes	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	CTO & Co-Founder	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.442847	2025-10-06 22:48:39.132153
1062	Shawn	Macguire	\N	\N	Seoqia	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.444793	2025-10-06 22:48:39.134007
1064	Todd	Kesselman	\N	\N	Precision	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.447939	2025-10-06 22:48:39.136043
1071	Gal	Perezt	\N	\N	Torq	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	Head of Ai	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.459035	2025-10-06 22:48:39.139605
1072	Hamutal	Meridor	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.460811	2025-10-06 22:48:39.141838
1073	Idan	Gazit	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	Head of GiyHub	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.462554	2025-10-06 22:48:39.144116
1074	Ilan	Kedar	\N	\N	Plurai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	CEO	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.464055	2025-10-06 22:48:39.146949
1075	Jonathan	Gefiman	\N	\N	Deci	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	CEO	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.46555	2025-10-06 22:48:39.150979
884	Etti	Fakiri	\N	\N	Microsoft	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Architect Track Instructor, Office Hours	\N	\N	Director	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.78338	2025-10-06 22:38:03.291603
885	Eyal	Waldman	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	AI Advisory member, Sponsor/Donor	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.784104	2025-10-06 22:38:03.294026
886	Gadi	Lifshitz	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Elite Unit Champions, Office Hours	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.784822	2025-10-06 22:38:03.296064
845	Ammnon	Shashua	\N	\N	serial founer	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	AI Advisory member	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.746193	2025-10-06 22:38:03.319694
961	Stav	Levi	\N	\N	Alta	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/stav-levy?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app	\N	\N	\N	\N	\N	roee shuffle Sharing	Architect Track Instructor	\N	\N	Founder ceo	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.856968	2025-10-06 22:38:03.346766
969	Uriel	Reichman	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Mega Connector, Sponsor/Donor	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.862544	2025-10-06 22:38:03.350993
973	Yaron		\N	\N	a16z	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Mega Connector	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.865367	2025-10-06 22:38:03.352875
976	Yoav	Gelberg	\N	\N	\N	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/yoav-gelberg/	\N	\N	\N	\N	\N	roee shuffle Sharing	Elite Unit Champions	\N	\N	Oxford AI PhD	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.869	2025-10-06 22:38:03.354667
979	Yuval	Belfer	\N	\N	a21	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/yuval-belfer/	\N	\N	\N	\N	\N	roee shuffle Sharing	Architect Track Instructor	\N	\N	Generative AI	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.872615	2025-10-06 22:38:03.356741
986	Imported Contact 164	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Sponsor/Donor	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.878719	2025-10-06 22:38:03.359766
990	Imported Contact 168	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Sponsor/Donor	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.881416	2025-10-06 22:38:03.3619
955	Shahar		\N	\N	\N	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/shahar-cohen-b686b019a?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app	\N	\N	\N	\N	\N	roee shuffle Sharing	Ops - Volunteer	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.850321	2025-10-06 22:38:03.404496
959	Shlomi	Boutnaru	\N	\N	\N	\N	\N	\N	\N	\N	\N	https://il.linkedin.com/in/shlomi-boutnaru-ph-d-ba781811a	\N	\N	\N	\N	\N	roee shuffle Sharing	Architect Track Instructor, Elite Unit Champions, Mega Connector, Post Exit Founder	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.854402	2025-10-06 22:38:03.406732
966	Tomer	Nussbaum	\N	\N	AA-I	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/tussbaum	\N	\N	\N	\N	\N	roee shuffle Sharing	\N	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.860461	2025-10-06 22:38:03.410751
970	Victor	Shafran	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Office Hours, Post Exit Founder	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.863258	2025-10-06 22:38:03.412262
974	Yaron	Ismah Moshe	\N	\N	Exceed.ai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	\N	\N	\N	Ai post exit founder	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.866001	2025-10-06 22:38:03.414497
977	Yogev		\N	\N	WAND	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/yogevshifman/	\N	\N	\N	\N	\N	roee shuffle Sharing	Architect Track Instructor, Office Hours	\N	\N	CTO	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.86986	2025-10-06 22:38:03.41644
980	Zeev		\N	\N	Werhimer trust	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Sponsor/Donor	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.873569	2025-10-06 22:38:03.418659
983	Tomm		\N	\N	\N	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/tom-hoffen-8722b88a?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app	\N	\N	\N	\N	\N	roee shuffle Sharing	AI Advisory member, AI Mentor /Helper /builder, Architect Track Instructor	\N	\N	Cto Alta	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.876562	2025-10-06 22:38:03.420572
890	Gidi	Argov	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Sponsor/Donor	\N	\N	\N	\N	\N	{"more info": "sent an email spe 2"}	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.788579	2025-10-06 22:38:03.473698
1076	Liran	Hason	\N	\N	Coralogix	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	Head of Ai	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.467485	2025-10-06 22:48:39.152704
1077	Matan		\N	\N	Apex cyber	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	Ceo founder	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.470009	2025-10-06 22:48:39.155263
1078	Miryam	Edelson	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.472081	2025-10-06 22:48:39.157181
1079	Naama	Dayan	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.474043	2025-10-06 22:48:39.158765
987	Imported Contact 165	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Sponsor/Donor	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.879409	2025-10-06 22:38:03.422523
991	Tomer	Simon	\N	\N	\N	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/tomer-simon-phd/	\N	\N	\N	\N	\N	roee shuffle Sharing	Office Hours	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.882055	2025-10-06 22:38:03.46225
978	Yoram	Titz	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Mega Connector, Sponsor/Donor	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.87078	2025-10-06 22:38:03.465972
981	Singer	Foundation	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Sponsor/Donor	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.874331	2025-10-06 22:38:03.467997
984	Rotem	Lapid	\N	\N	\N	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/rotem-lapid-98b42370?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app	\N	\N	\N	\N	\N	roee shuffle Sharing	AI Advisory member, AI Mentor /Helper /builder, Architect Instructor, Elite Unit Champions, Office Hours	\N	\N	Head of AI Ort	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.877326	2025-10-06 22:38:03.469715
988	Imported Contact 166	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Sponsor/Donor	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.880075	2025-10-06 22:38:03.471346
894	Harlap		\N	\N	Colmobil	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Sponsor/Donor	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.791592	2025-10-06 22:38:03.475592
900	Inbar	Shulman	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Elite Unit Champions	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.798229	2025-10-06 22:38:03.477724
903	Jariv	Ashkenazy	\N	\N	Wiz	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/jariv-ashkenazy-ab9962210/	\N	\N	\N	\N	\N	roee shuffle Sharing	Potential Architect Student, Sponsor/Donor	\N	\N	Product Manager	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.801413	2025-10-06 22:38:03.480619
907	Lior	Susan	\N	\N	Eclipse	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Mega Connector, Sponsor/Donor	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.804868	2025-10-06 22:38:03.482879
911	Maimonides	Foundation	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Sponsor/Donor	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.807756	2025-10-06 22:38:03.485176
915	Michal	Cohn	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Sponsor/Donor	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.810671	2025-10-06 22:38:03.48732
919	Moris	Kahan	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Sponsor/Donor	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.81406	2025-10-06 22:38:03.489432
923	Nitzan	Sapir	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Mega Connector	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.816721	2025-10-06 22:38:03.491695
930	Omer	Kafri	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Elite Unit Champions	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.824538	2025-10-06 22:38:03.493794
934	Imported Contact 103	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	\N	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.827959	2025-10-06 22:38:03.4957
938	Oren	Netzer	\N	\N	Angel	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Architect Track Instructor, Post Exit Founder, Sponsor/Donor	\N	\N	Founder and Angel	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.831801	2025-10-06 22:38:03.497699
941	Roni	abmovitch	\N	\N	Magic Leap	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	\N	\N	\N	\N	\N	\N	{"agenda": "Ai Advisory"}	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.835387	2025-10-06 22:38:03.499596
946	Rom	Ashkenazi	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Post Exit Founder, Sponsor/Donor	\N	\N	Angel	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.84278	2025-10-06 22:38:03.50188
949	Roni	Duak	\N	\N	Philantorpic	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Sponsor/Donor	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.845975	2025-10-06 22:38:03.503656
953	Shachar	Lutati	\N	\N	\N	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/shahar-lutati-4b4863118/	\N	\N	\N	\N	\N	roee shuffle Sharing	Architect Track Instructor, Office Hours	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.848981	2025-10-06 22:38:03.506681
957	Shani		\N	\N	\N	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/shanni-gurkevitch/?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app	\N	\N	\N	\N	\N	roee shuffle Sharing	Architect Instructor	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.852661	2025-10-06 22:38:03.508725
960	Shusterman	Fund	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Sponsor/Donor	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.856169	2025-10-06 22:38:03.510683
964	The	Ted Arison Family Foundation	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Sponsor/Donor	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.859048	2025-10-06 22:38:03.512365
968	https://www.linkedin.com/in/urigafni/overlay/about-this-profile/		\N	\N	\N	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/urigafni/?originalSubdomain=il	\N	\N	\N	\N	\N	roee shuffle Sharing	Founders Track Exploration	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.861817	2025-10-06 22:38:03.51415
972	Yaniv	Rivlin	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Mega Connector, Sponsor/Donor	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.864594	2025-10-06 22:38:03.516325
975	Yiftach	Shoolman	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Sponsor/Donor	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.868099	2025-10-06 22:38:03.518473
982	Yael	assaraf	\N	\N	\N	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/posts/activity-7365352752559878144-ilVB?utm_source=share&utm_medium=member_android&rcm=ACoAAAEe4W0BJ_uDJh5nkrIr75JNDoVR7IePyvk	\N	\N	\N	\N	\N	roee shuffle Sharing	AI Advisory member	\N	\N	Nvidia	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.875007	2025-10-06 22:38:03.520198
985	Imported Contact 163	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Sponsor/Donor	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.877994	2025-10-06 22:38:03.522153
989	Imported Contact 167	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Sponsor/Donor	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.880749	2025-10-06 22:38:03.524156
1148	Adam2		\N	\N	Student	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	\N	\N	\N	active	medium	\N	{}	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 22:38:03.526269	2025-10-06 22:38:03.526271
1080	Noa	Zilberstein	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.475798	2025-10-06 22:48:39.160134
1081	Ohad	Gliksman	\N	\N	Angel	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	5 eyes	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.477567	2025-10-06 22:48:39.161863
1082	Imported Contact 101	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.479585	2025-10-06 22:48:39.164784
1083	Omri	Vinshtein	\N	\N	Duplex	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.481508	2025-10-06 22:48:39.166625
1084	Ori	Avraham	\N	\N	OZ	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	CEO	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.483632	2025-10-06 22:48:39.16795
1085	Ori	Striechman	\N	\N	Head of Matzov entrepreneurship forum	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.485867	2025-10-06 22:48:39.169368
1086	Recanati		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.488206	2025-10-06 22:48:39.171299
1087	Seffi	Cohen	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.490032	2025-10-06 22:48:39.173464
1090	Tel	Aviv Jude Yovel Recanati	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.496494	2025-10-06 22:48:39.175182
1099	Gideon	stein	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.511975	2025-10-06 22:48:39.176904
1100	harel	rom	\N	\N	stealth	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	CTO Founder	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.513501	2025-10-06 22:48:39.17875
1101	Idan	Megidish	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.515085	2025-10-06 22:48:39.180585
1102	Itzik	Ben Shaul	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.516655	2025-10-06 22:48:39.182405
1103	Kfir	Shoar	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.51843	2025-10-06 22:48:39.184206
1104	Lotem	Peled	\N	\N	Datagen, Technion, phd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	Tech- NLP, LLM	\N	\N	{"more info": "I wrote her."}	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.520347	2025-10-06 22:48:39.185885
1105	Michael	Kagen	\N	\N	Invidia [Ex Mellanox]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	CTO	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.522188	2025-10-06 22:48:39.188232
1106	Misha	Feinstein	\N	\N	Bria.ai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	CTO	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.52384	2025-10-06 22:48:39.190182
1000	Amichai	Shulman	\N	\N	Ex	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	active	medium	Work	{}	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.338191	2025-10-06 22:48:39.212507
1041	Etti	Fakiri	\N	\N	Microsoft	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	Director	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.412534	2025-10-06 22:48:39.214425
1042	Eyal	Waldman	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.413971	2025-10-06 22:48:39.21579
1043	Gadi	Lifshitz	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.415436	2025-10-06 22:48:39.217355
1002	Ammnon	Shashua	\N	\N	serial founer	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	active	medium	Personal	{}	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.343219	2025-10-06 22:48:39.218741
1063	Stav	Levi	\N	\N	Alta	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	Founder ceo	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.44645	2025-10-06 22:48:39.220436
1065	Uriel	Reichman	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.449402	2025-10-06 22:48:39.222338
1066	Yaron		\N	\N	a16z	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.450763	2025-10-06 22:48:39.223875
1067	Yoav	Gelberg	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	Oxford AI PhD	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.452133	2025-10-06 22:48:39.225283
1070	Imported Contact 168	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.457481	2025-10-06 22:48:39.230942
1088	Shahar		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.492627	2025-10-06 22:48:39.232386
1089	Shlomi	Boutnaru	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.494649	2025-10-06 22:48:39.233838
1091	Tomer	Nussbaum	\N	\N	AA-I	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.498072	2025-10-06 22:48:39.235164
1092	Victor	Shafran	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.49972	2025-10-06 22:48:39.236498
1093	Yaron	Ismah Moshe	\N	\N	Exceed.ai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	Ai post exit founder	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.501496	2025-10-06 22:48:39.238236
1094	Yogev		\N	\N	WAND	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	CTO	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.503433	2025-10-06 22:48:39.239971
1095	Zeev		\N	\N	Werhimer trust	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.505386	2025-10-06 22:48:39.241744
1096	Tomm		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	Cto Alta	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.507007	2025-10-06 22:48:39.242993
1097	Imported Contact 165	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.508488	2025-10-06 22:48:39.2464
1119	Yoram	Titz	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.548837	2025-10-06 22:48:39.249414
1120	Singer	Foundation	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.550316	2025-10-06 22:48:39.250735
1121	Rotem	Lapid	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	Head of AI Ort	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.551778	2025-10-06 22:48:39.252421
1122	Imported Contact 166	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.553188	2025-10-06 22:48:39.253927
1124	Harlap		\N	\N	Colmobil	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.556925	2025-10-06 22:48:39.2557
1125	Inbar	Shulman	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.558767	2025-10-06 22:48:39.257474
1126	Jariv	Ashkenazy	\N	\N	Wiz	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	Product Manager	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.560587	2025-10-06 22:48:39.258945
1127	Lior	Susan	\N	\N	Eclipse	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.562398	2025-10-06 22:48:39.260446
1128	Maimonides	Foundation	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.564035	2025-10-06 22:48:39.262236
1129	Michal	Cohn	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.565947	2025-10-06 22:48:39.264237
1130	Moris	Kahan	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.567539	2025-10-06 22:48:39.265957
1131	Nitzan	Sapir	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.56905	2025-10-06 22:48:39.267388
1132	Omer	Kafri	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.571064	2025-10-06 22:48:39.268858
1133	Imported Contact 103	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.572979	2025-10-06 22:48:39.270625
1134	Oren	Netzer	\N	\N	Angel	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	Founder and Angel	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.574527	2025-10-06 22:48:39.272424
1135	Roni	abmovitch	\N	\N	Magic Leap	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	{"agenda": "Ai Advisory"}	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.576213	2025-10-06 22:48:39.273944
1136	Rom	Ashkenazi	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	Angel	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.578159	2025-10-06 22:48:39.275238
1137	Roni	Duak	\N	\N	Philantorpic	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.579815	2025-10-06 22:48:39.276495
1138	Shachar	Lutati	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.581324	2025-10-06 22:48:39.277939
1139	Shani		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.582751	2025-10-06 22:48:39.280211
1140	Shusterman	Fund	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.584343	2025-10-06 22:48:39.282126
1141	The	Ted Arison Family Foundation	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.585938	2025-10-06 22:48:39.283598
1142	https://www.linkedin.com/in/urigafni/overlay/about-this-profile/		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.587658	2025-10-06 22:48:39.284959
1143	Yaniv	Rivlin	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.589677	2025-10-06 22:48:39.286536
1144	Yiftach	Shoolman	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.591186	2025-10-06 22:48:39.288308
1145	Yael	assaraf	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	Nvidia	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.592549	2025-10-06 22:48:39.289955
1146	Imported Contact 163	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.594156	2025-10-06 22:48:39.291269
1147	Imported Contact 167	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.596052	2025-10-06 22:48:39.292517
1004	Assaf	Tzur	\N	\N	Demo Capital	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	Investor , GTM guy	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.348328	2025-10-06 22:48:39.302279
1005	Avinatan	Hassidim	\N	\N	Google	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	VP Research	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.350267	2025-10-06 22:48:39.304114
999	Almog	Baku	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	CEO	\N	Work	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.334891	2025-10-06 23:06:50.282485
1001	Amit	Goldfarb	\N	\N	Founder	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	Personal	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.340635	2025-10-06 23:09:10.52893
1003	Assaf	Bar	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	Travel	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.34607	2025-10-06 23:20:50.071528
1006	Avital	Hulio	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.352531	2025-10-06 22:48:39.305668
1008	Ayal	Baron	\N	\N	Aimass	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	Founder	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.356415	2025-10-06 22:48:39.306969
1009	Azrieli	Foundation	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.35814	2025-10-06 22:48:39.308426
1010	Ben	Lang	\N	\N	Ben Lang	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.360109	2025-10-06 22:48:39.309916
1011	Beni	Meir	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.362079	2025-10-06 22:48:39.311525
1012	Boaz	Ganor	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.363889	2025-10-06 22:48:39.313218
1013	Brandon	Korff	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.365472	2025-10-06 22:48:39.314486
1014	carly	hayden	\N	\N	Anthropic	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	GTM @ Anthropic	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.367043	2025-10-06 22:48:39.315783
1015	Chemi	Peres	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.369006	2025-10-06 22:48:39.317128
1016	Chen	Shmilo	\N	\N	8200 org	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.370838	2025-10-06 22:48:39.318978
1017	Chen	tzvi	\N	\N	Building..	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	Matzov ngo	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.372495	2025-10-06 22:48:39.320832
1018	Dan	Arieli	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.373963	2025-10-06 22:48:39.32218
1019	Dan	Padnos	\N	\N	AI 21	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	VP aligment	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.375453	2025-10-06 22:48:39.323437
1020	Daniel	Brin	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.377224	2025-10-06 22:48:39.32471
1021	Daniel	Goldberg (ARAM)	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.379185	2025-10-06 22:48:39.325958
1029	Dr. Alan		\N	\N	x Voca	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.392807	2025-10-06 22:48:39.337754
1030	Dr. Elad		\N	\N	Plurai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.394848	2025-10-06 22:48:39.339154
1031	Dr. Eli	David	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.396486	2025-10-06 22:48:39.340448
1032	Dr. Kira	Radinsky	\N	\N	Diagnostic Robotics	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.398121	2025-10-06 22:48:39.341765
1033	Efrat	Rappaport	\N	\N	Bonobo, Salesforce	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	Post exit founder	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.399575	2025-10-06 22:48:39.342993
1034	Efrat	Yudovich	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.401361	2025-10-06 22:48:39.344443
1035	Elad	Levi	\N	\N	Plurai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	CTO	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.402986	2025-10-06 22:48:39.346496
1036	Elad	Raz	\N	\N	Next Silicon	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	CEO	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.40449	2025-10-06 22:48:39.347902
1037	Eli	Brosh	\N	\N	wix	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	head of ai	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.405929	2025-10-06 22:48:39.349279
1038	Eran	Gorev	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.407364	2025-10-06 22:48:39.35057
1039	https://www.linkedin.com/in/eran-rosenberg/overlay/about-this-profile/		\N	\N	NVIDIA Inception	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.408847	2025-10-06 22:48:39.35178
1040	Eric	Shmidt family	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.410742	2025-10-06 22:48:39.353204
1007	Aya	Sano	\N	\N	Sano	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.3546	2025-10-06 22:48:39.074594
1052	Michal	Gonen	\N	\N	Axonius	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.429313	2025-10-06 22:48:39.108096
1107	Nir	Hutnik	\N	\N	Deepkeepp	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	LLM	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.525371	2025-10-06 22:48:39.192406
1108	Ofek	Censor	\N	\N	Building	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	Founder	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.527122	2025-10-06 22:48:39.194068
1109	Omer	ben hurin	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.529041	2025-10-06 22:48:39.19594
1110	Omri	Geller	\N	\N	Run ai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	CEO	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.530849	2025-10-06 22:48:39.198109
1111	Or	Lenchner	\N	\N	Bright Data	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	CEO	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.532349	2025-10-06 22:48:39.199735
1112	Ori	Elbyev	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.53384	2025-10-06 22:48:39.201103
1113	Orr	Danon	\N	\N	Hailo Technologies	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	CEO	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.535421	2025-10-06 22:48:39.20251
1114	Roni		\N	\N	Ex wework [#3]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.537285	2025-10-06 22:48:39.204209
1115	Shachar	Cohen	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.538851	2025-10-06 22:48:39.206208
1116	Shalev	Hulio	\N	\N	Ex NSO, Dream Security	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	CEO	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.540545	2025-10-06 22:48:39.20772
1117	The	Edmond de Rothschild Foundation (Israel)	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.542145	2025-10-06 22:48:39.209143
1118	Yair	Adato	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	CEO Bria	\N	\N	null	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.546936	2025-10-06 22:48:39.21056
1123	Gidi	Argov	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	\N	\N	\N	{"more info": "sent an email spe 2"}	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.554972	2025-10-06 22:48:39.244262
997	Adam2		\N	\N	Student	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	Roee Feingold Sharing	\N	\N	\N	active	medium	Work	{}	6a0c4394-530e-444a-a23e-23b48fd4cab4	2025-10-06 20:02:24.31865	2025-10-06 22:48:39.293959
841	Adi	Zichter	\N	\N	\N	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/adi-zicher-62bb13127/	\N	\N	\N	\N	\N	roee shuffle Sharing	Architect Track Instructor	\N	\N	active	medium	work	{"agenda": null, "more info": "Talpiot"}	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.735916	2025-10-06 22:42:27.307347
842	Almog	Baku	\N	\N	\N	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/almogbaku/	\N	\N	\N	\N	\N	roee shuffle Sharing	Architect Track Instructor, Office Hours	\N	\N	CEO	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.740301	2025-10-06 22:38:03.173286
844	Amit	Goldfarb	\N	\N	Founder	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Elite Unit Champions	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.744142	2025-10-06 22:38:03.178728
846	Assaf	Bar	\N	\N	\N	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/asafbarzilay/?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app	\N	\N	\N	\N	\N	roee shuffle Sharing	Elite Unit Champions	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.747263	2025-10-06 22:38:03.181563
847	Assaf	Tzur	\N	\N	Demo Capital	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Elite Unit Champions	\N	\N	Investor , GTM guy	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.749311	2025-10-06 22:38:03.185232
848	Avinatan	Hassidim	\N	\N	Google	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/avinatan-hassidim-4a89646/?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app	\N	\N	\N	\N	\N	roee shuffle Sharing	Architect Track Instructor	\N	\N	VP Research	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.75058	2025-10-06 22:38:03.188588
849	Avital	Hulio	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Mega Connector, Sponsor/Donor	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.751464	2025-10-06 22:38:03.193397
851	Ayal	Baron	\N	\N	Aimass	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Architect Track Instructor	\N	\N	Founder	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.753512	2025-10-06 22:38:03.198401
852	Azrieli	Foundation	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Sponsor/Donor	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.754543	2025-10-06 22:38:03.200554
853	Ben	Lang	\N	\N	Ben Lang	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/benmlang/	\N	\N	\N	\N	\N	roee shuffle Sharing	Mega Connector	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.755377	2025-10-06 22:38:03.206023
854	Beni	Meir	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Elite Unit Champions	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.756173	2025-10-06 22:38:03.210245
855	Boaz	Ganor	\N	\N	\N	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/amir-broyde-744b57163/	\N	\N	\N	\N	\N	roee shuffle Sharing	Mega Connector	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.757926	2025-10-06 22:38:03.214882
856	Brandon	Korff	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Sponsor/Donor	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.758824	2025-10-06 22:38:03.217409
857	carly	hayden	\N	\N	Anthropic	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/carly-hayden/	\N	\N	\N	\N	\N	roee shuffle Sharing	Architect Track Instructor, Office Hours	\N	\N	GTM @ Anthropic	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.759603	2025-10-06 22:38:03.220768
858	Chemi	Peres	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Sponsor/Donor	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.760376	2025-10-06 22:38:03.223814
859	Chen	Shmilo	\N	\N	8200 org	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Mega Connector	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.761803	2025-10-06 22:38:03.227424
860	Chen	tzvi	\N	\N	Building..	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/chen-zvi-8a64a854?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app	\N	\N	\N	\N	\N	roee shuffle Sharing	Elite Unit Champions	\N	\N	Matzov ngo	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.762761	2025-10-06 22:38:03.230903
861	Dan	Arieli	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	\N	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.763596	2025-10-06 22:38:03.233545
862	Dan	Padnos	\N	\N	AI 21	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/dan-padnos/	\N	\N	\N	\N	\N	roee shuffle Sharing	Architect Track Instructor	\N	\N	VP aligment	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.764383	2025-10-06 22:38:03.236881
863	Daniel	Brin	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	\N	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.765169	2025-10-06 22:38:03.239026
864	Daniel	Goldberg (ARAM)	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	\N	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.765925	2025-10-06 22:38:03.243024
865	David	siegal	\N	\N	Tech Mission	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/davidmsiegel?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app	\N	\N	\N	\N	\N	roee shuffle Sharing	Sponsor/Donor	\N	\N	Tech mission manager	\N	\N	{"agenda": "ask about who is relevant"}	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.766671	2025-10-06 22:38:03.24578
866	David	Zalik	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Sponsor/Donor	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.767488	2025-10-06 22:38:03.247828
867	Dean	Leitersdorf	\N	\N	Decart	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/dean-leitersdorf/	\N	\N	\N	\N	\N	roee shuffle Sharing	Architect Track Instructor	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.768191	2025-10-06 22:38:03.250139
868	Dean	Sysman	\N	\N	Axonius	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/deansysman/	\N	\N	\N	\N	\N	roee shuffle Sharing	Architect Track Instructor, Elite Unit Champions	\N	\N	CEO and Founder	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.769037	2025-10-06 22:38:03.252993
869	Dell	Foundation	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Sponsor/Donor	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.769968	2025-10-06 22:38:03.256447
870	Dolev		\N	\N	Gong	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/dolev-pomeranz-b3b56b3/	\N	\N	\N	\N	\N	roee shuffle Sharing	Architect Track Instructor	\N	\N	senior Director	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.771052	2025-10-06 22:38:03.258831
871	Dorit	Dor	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	AI Advisory member, Mega Connector	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.771893	2025-10-06 22:38:03.261844
872	Dr. Alan		\N	\N	x Voca	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Architect Track Instructor	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.773782	2025-10-06 22:38:03.26392
873	Dr. Elad		\N	\N	Plurai	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Architect Track Instructor	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.774592	2025-10-06 22:38:03.266609
874	Dr. Eli	David	\N	\N	\N	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/drelidavid/	\N	\N	\N	\N	\N	roee shuffle Sharing	Architect Track Instructor, Mega Connector	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.775277	2025-10-06 22:38:03.269339
875	Dr. Kira	Radinsky	\N	\N	Diagnostic Robotics	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/kira-radinsky/	\N	\N	\N	\N	\N	roee shuffle Sharing	Architect Track Instructor, Office Hours, Post Exit Founder	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.775999	2025-10-06 22:38:03.271495
876	Efrat	Rappaport	\N	\N	Bonobo, Salesforce	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	Architect Track Instructor, Founders Track Instructor	\N	\N	Post exit founder	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.776801	2025-10-06 22:38:03.27359
877	Efrat	Yudovich	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	\N	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.777572	2025-10-06 22:38:03.275895
878	Elad	Levi	\N	\N	Plurai	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/elad-levi-a938a3121/	\N	\N	\N	\N	\N	roee shuffle Sharing	Architect Track Instructor	\N	\N	CTO	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.778941	2025-10-06 22:38:03.27817
879	Elad	Raz	\N	\N	Next Silicon	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/eladraz/	\N	\N	\N	\N	\N	roee shuffle Sharing	Office Hours	\N	\N	CEO	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.779756	2025-10-06 22:38:03.280781
880	Eli	Brosh	\N	\N	wix	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/eli-brosh-058989/	\N	\N	\N	\N	\N	roee shuffle Sharing	Architect Track Instructor	\N	\N	head of ai	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.780452	2025-10-06 22:38:03.283271
881	Eran	Gorev	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	\N	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.781175	2025-10-06 22:38:03.285768
882	https://www.linkedin.com/in/eran-rosenberg/overlay/about-this-profile/		\N	\N	NVIDIA Inception	\N	\N	\N	\N	\N	\N	https://www.linkedin.com/in/eran-rosenberg/	\N	\N	\N	\N	\N	roee shuffle Sharing	Founders Track Exploration	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.781816	2025-10-06 22:38:03.287643
883	Eric	Shmidt family	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	roee shuffle Sharing	AI Advisory member, Mega Connector, Sponsor/Donor	\N	\N	\N	\N	\N	\N	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 18:27:17.782703	2025-10-06 22:38:03.28971
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tasks (id, title, description, project, scheduled_date, is_scheduled, is_active, status, priority, due_date, owner_id, created_by, created_at, updated_at, text, assign_to, label, notes, alert_time, task_id, participants) FROM stdin;
f55d5ef5-14ef-440e-8193-73946dc72316	testimportant	\N	Personal	\N	f	t	todo	medium	\N	b8e91e36-e921-4417-9005-892efcd17329	b8e91e36-e921-4417-9005-892efcd17329	2025-10-07 06:29:31.751959	2025-10-07 07:06:07.995099	testimportant	roee@wershuffle.com	\N	\N	\N	\N	[]
d82a9484-7ab2-4252-ab76-f7705eeed1fc	test2	\N	Personal	\N	f	t	done	medium	\N	b8e91e36-e921-4417-9005-892efcd17329	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 14:15:15.122934	2025-10-07 08:52:48.531755	test2	roee@wershuffle.com	\N	\N	\N	\N	["guy@wershuffle.com", "roee@wershuffle.com"]
cfadd281-e2e3-4568-aa8e-f705139a32f8	\N	\N	\N	\N	f	t	todo	medium	2023-10-09 09:00:00	b8e91e36-e921-4417-9005-892efcd17329	b8e91e36-e921-4417-9005-892efcd17329	2025-10-07 09:02:37.172334	2025-10-07 09:02:37.172339		\N	\N	\N	\N	1	[]
8e0a0430-b8a5-4617-8e0d-ebc281ecf0db	\N	\N	\N	\N	f	t	todo	medium	2023-10-09 09:00:00	b8e91e36-e921-4417-9005-892efcd17329	b8e91e36-e921-4417-9005-892efcd17329	2025-10-07 09:16:28.892975	2025-10-07 09:16:28.892986		\N	\N	\N	\N	2	[]
e40f6545-359f-4a3d-80a0-931410bb6cf9	\N	\N	\N	\N	f	t	todo	medium	2023-10-13 14:00:00	b8e91e36-e921-4417-9005-892efcd17329	b8e91e36-e921-4417-9005-892efcd17329	2025-10-07 09:16:39.712178	2025-10-07 09:16:39.712181		Alice	\N	\N	\N	3	[]
b7daa8eb-20f6-48b1-a60b-8f36c20ed9b2	\N	\N	\N	\N	f	t	todo	high	2023-10-07 16:00:00	b8e91e36-e921-4417-9005-892efcd17329	b8e91e36-e921-4417-9005-892efcd17329	2025-10-07 09:16:50.602535	2025-10-07 09:16:50.602537		\N	\N	\N	\N	4	[]
38fa2b36-76b0-4a17-b51c-7a4dddc40345	\N	\N	\N	\N	f	t	todo	medium	2023-10-14 09:00:00	b8e91e36-e921-4417-9005-892efcd17329	b8e91e36-e921-4417-9005-892efcd17329	2025-10-07 09:17:00.120457	2025-10-07 09:17:00.120462		\N	\N	\N	\N	5	[]
8cf925df-493d-4618-b435-3da36adb2dbd	\N	\N	\N	\N	f	t	todo	medium	2023-10-07 18:00:00	b8e91e36-e921-4417-9005-892efcd17329	b8e91e36-e921-4417-9005-892efcd17329	2025-10-07 09:18:32.281768	2025-10-07 09:18:32.281772		\N	\N	\N	\N	6	[]
617b42c2-1d71-404d-8bdd-f072052371ab	\N	\N	\N	\N	f	t	todo	medium	\N	b8e91e36-e921-4417-9005-892efcd17329	b8e91e36-e921-4417-9005-892efcd17329	2025-10-07 09:18:42.274539	2025-10-07 09:18:42.274542		\N	\N	\N	\N	7	[]
2418b7df-ebee-4a06-a607-33ce0a781c5c	\N	\N	\N	\N	f	t	todo	medium	\N	b8e91e36-e921-4417-9005-892efcd17329	b8e91e36-e921-4417-9005-892efcd17329	2025-10-07 09:18:52.81841	2025-10-07 09:18:52.818415		\N	\N	\N	\N	8	[]
11a5fe39-ab6d-46f5-983b-ed374abd9822	rrrrrr	Updated description	Personal	\N	f	t	todo	medium	\N	b8e91e36-e921-4417-9005-892efcd17329	b8e91e36-e921-4417-9005-892efcd17329	2025-10-07 07:00:43.97214	2025-10-07 07:00:43.972143	rrrrrr	roee@wershuffle.com	\N	\N	\N	\N	[]
9f81ca50-478d-43a1-8c3f-a3eba7965d7c	Updated Task Title	Updated description	Alist	\N	f	t	todo	medium	\N	b8e91e36-e921-4417-9005-892efcd17329	b8e91e36-e921-4417-9005-892efcd17329	2025-10-06 14:14:49.392309	2025-10-07 07:01:00.803138	test	guy@wershuffle.com	\N	\N	\N	\N	["roee@wershuffle.com"]
\.


--
-- Name: events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.events_id_seq', 21, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notifications_id_seq', 13, true);


--
-- Name: people_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.people_id_seq', 1151, true);


--
-- PostgreSQL database dump complete
--

\unrestrict wVd66HzvsqriqzBfX37YubPHEUtK6LeMhmU6LpldOffUMXWaacnNHpSHfrTfMFv

