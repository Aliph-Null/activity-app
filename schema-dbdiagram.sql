
CREATE TABLE `pages_hero_links` (
	`_order` integer NOT NULL,
	`_parent_id` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`link_type` text DEFAULT 'reference',
	`link_new_tab` integer,
	`link_url` text,
	`link_label` text,
	`link_appearance` text DEFAULT 'default',
	FOREIGN KEY (`_parent_id`) REFERENCES `pages`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `pages_blocks_cta_links` (
	`_order` integer NOT NULL,
	`_parent_id` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`link_type` text DEFAULT 'reference',
	`link_new_tab` integer,
	`link_url` text,
	`link_label` text,
	`link_appearance` text DEFAULT 'default',
	FOREIGN KEY (`_parent_id`) REFERENCES `pages_blocks_cta`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `pages_blocks_cta` (
	`_order` integer NOT NULL,
	`_parent_id` integer NOT NULL,
	`_path` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`rich_text` text,
	`block_name` text,
	FOREIGN KEY (`_parent_id`) REFERENCES `pages`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `pages_blocks_content_columns` (
	`_order` integer NOT NULL,
	`_parent_id` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`size` text DEFAULT 'oneThird',
	`rich_text` text,
	`enable_link` integer,
	`link_type` text DEFAULT 'reference',
	`link_new_tab` integer,
	`link_url` text,
	`link_label` text,
	`link_appearance` text DEFAULT 'default',
	FOREIGN KEY (`_parent_id`) REFERENCES `pages_blocks_content`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `pages_blocks_content` (
	`_order` integer NOT NULL,
	`_parent_id` integer NOT NULL,
	`_path` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`block_name` text,
	FOREIGN KEY (`_parent_id`) REFERENCES `pages`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `pages_blocks_media_block` (
	`_order` integer NOT NULL,
	`_parent_id` integer NOT NULL,
	`_path` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`media_id` integer,
	`block_name` text,
	FOREIGN KEY (`media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`_parent_id`) REFERENCES `pages`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `pages_blocks_archive` (
	`_order` integer NOT NULL,
	`_parent_id` integer NOT NULL,
	`_path` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`intro_content` text,
	`populate_by` text DEFAULT 'collection',
	`relation_to` text DEFAULT 'posts',
	`limit` numeric DEFAULT 10,
	`block_name` text,
	FOREIGN KEY (`_parent_id`) REFERENCES `pages`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `pages_blocks_form_block` (
	`_order` integer NOT NULL,
	`_parent_id` integer NOT NULL,
	`_path` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`form_id` integer,
	`enable_intro` integer,
	`intro_content` text,
	`block_name` text,
	FOREIGN KEY (`form_id`) REFERENCES `forms`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`_parent_id`) REFERENCES `pages`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `pages` (
	`id` integer PRIMARY KEY NOT NULL,
	`title` text,
	`hero_type` text DEFAULT 'lowImpact',
	`hero_rich_text` text,
	`hero_media_id` integer,
	`meta_title` text,
	`meta_image_id` integer,
	`meta_description` text,
	`published_at` text,
	`generate_slug` integer DEFAULT true,
	`slug` text,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`_status` text DEFAULT 'draft',
	FOREIGN KEY (`hero_media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`meta_image_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE TABLE `pages_rels` (
	`id` integer PRIMARY KEY NOT NULL,
	`order` integer,
	`parent_id` integer NOT NULL,
	`path` text NOT NULL,
	`pages_id` integer,
	`posts_id` integer,
	`categories_id` integer,
	FOREIGN KEY (`parent_id`) REFERENCES `pages`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`pages_id`) REFERENCES `pages`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`posts_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`categories_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `_pages_v_version_hero_links` (
	`_order` integer NOT NULL,
	`_parent_id` integer NOT NULL,
	`id` integer PRIMARY KEY NOT NULL,
	`link_type` text DEFAULT 'reference',
	`link_new_tab` integer,
	`link_url` text,
	`link_label` text,
	`link_appearance` text DEFAULT 'default',
	`_uuid` text,
	FOREIGN KEY (`_parent_id`) REFERENCES `_pages_v`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `_pages_v_blocks_cta_links` (
	`_order` integer NOT NULL,
	`_parent_id` integer NOT NULL,
	`id` integer PRIMARY KEY NOT NULL,
	`link_type` text DEFAULT 'reference',
	`link_new_tab` integer,
	`link_url` text,
	`link_label` text,
	`link_appearance` text DEFAULT 'default',
	`_uuid` text,
	FOREIGN KEY (`_parent_id`) REFERENCES `_pages_v_blocks_cta`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `_pages_v_blocks_cta` (
	`_order` integer NOT NULL,
	`_parent_id` integer NOT NULL,
	`_path` text NOT NULL,
	`id` integer PRIMARY KEY NOT NULL,
	`rich_text` text,
	`_uuid` text,
	`block_name` text,
	FOREIGN KEY (`_parent_id`) REFERENCES `_pages_v`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `_pages_v_blocks_content_columns` (
	`_order` integer NOT NULL,
	`_parent_id` integer NOT NULL,
	`id` integer PRIMARY KEY NOT NULL,
	`size` text DEFAULT 'oneThird',
	`rich_text` text,
	`enable_link` integer,
	`link_type` text DEFAULT 'reference',
	`link_new_tab` integer,
	`link_url` text,
	`link_label` text,
	`link_appearance` text DEFAULT 'default',
	`_uuid` text,
	FOREIGN KEY (`_parent_id`) REFERENCES `_pages_v_blocks_content`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `_pages_v_blocks_content` (
	`_order` integer NOT NULL,
	`_parent_id` integer NOT NULL,
	`_path` text NOT NULL,
	`id` integer PRIMARY KEY NOT NULL,
	`_uuid` text,
	`block_name` text,
	FOREIGN KEY (`_parent_id`) REFERENCES `_pages_v`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `_pages_v_blocks_media_block` (
	`_order` integer NOT NULL,
	`_parent_id` integer NOT NULL,
	`_path` text NOT NULL,
	`id` integer PRIMARY KEY NOT NULL,
	`media_id` integer,
	`_uuid` text,
	`block_name` text,
	FOREIGN KEY (`media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`_parent_id`) REFERENCES `_pages_v`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `_pages_v_blocks_archive` (
	`_order` integer NOT NULL,
	`_parent_id` integer NOT NULL,
	`_path` text NOT NULL,
	`id` integer PRIMARY KEY NOT NULL,
	`intro_content` text,
	`populate_by` text DEFAULT 'collection',
	`relation_to` text DEFAULT 'posts',
	`limit` numeric DEFAULT 10,
	`_uuid` text,
	`block_name` text,
	FOREIGN KEY (`_parent_id`) REFERENCES `_pages_v`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `_pages_v_blocks_form_block` (
	`_order` integer NOT NULL,
	`_parent_id` integer NOT NULL,
	`_path` text NOT NULL,
	`id` integer PRIMARY KEY NOT NULL,
	`form_id` integer,
	`enable_intro` integer,
	`intro_content` text,
	`_uuid` text,
	`block_name` text,
	FOREIGN KEY (`form_id`) REFERENCES `forms`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`_parent_id`) REFERENCES `_pages_v`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `_pages_v` (
	`id` integer PRIMARY KEY NOT NULL,
	`parent_id` integer,
	`version_title` text,
	`version_hero_type` text DEFAULT 'lowImpact',
	`version_hero_rich_text` text,
	`version_hero_media_id` integer,
	`version_meta_title` text,
	`version_meta_image_id` integer,
	`version_meta_description` text,
	`version_published_at` text,
	`version_generate_slug` integer DEFAULT true,
	`version_slug` text,
	`version_updated_at` text,
	`version_created_at` text,
	`version__status` text DEFAULT 'draft',
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`latest` integer,
	`autosave` integer,
	FOREIGN KEY (`parent_id`) REFERENCES `pages`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`version_hero_media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`version_meta_image_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE TABLE `_pages_v_rels` (
	`id` integer PRIMARY KEY NOT NULL,
	`order` integer,
	`parent_id` integer NOT NULL,
	`path` text NOT NULL,
	`pages_id` integer,
	`posts_id` integer,
	`categories_id` integer,
	FOREIGN KEY (`parent_id`) REFERENCES `_pages_v`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`pages_id`) REFERENCES `pages`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`posts_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`categories_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `posts_populated_authors` (
	`_order` integer NOT NULL,
	`_parent_id` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	FOREIGN KEY (`_parent_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `posts` (
	`id` integer PRIMARY KEY NOT NULL,
	`title` text,
	`hero_image_id` integer,
	`content` text,
	`meta_title` text,
	`meta_image_id` integer,
	`meta_description` text,
	`published_at` text,
	`generate_slug` integer DEFAULT true,
	`slug` text,
	`initiative_id` integer,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`_status` text DEFAULT 'draft',
	FOREIGN KEY (`hero_image_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`meta_image_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`initiative_id`) REFERENCES `initiatives`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE TABLE `posts_rels` (
	`id` integer PRIMARY KEY NOT NULL,
	`order` integer,
	`parent_id` integer NOT NULL,
	`path` text NOT NULL,
	`posts_id` integer,
	`categories_id` integer,
	`users_id` integer,
	FOREIGN KEY (`parent_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`posts_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`categories_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`users_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `_posts_v_version_populated_authors` (
	`_order` integer NOT NULL,
	`_parent_id` integer NOT NULL,
	`id` integer PRIMARY KEY NOT NULL,
	`_uuid` text,
	`name` text,
	FOREIGN KEY (`_parent_id`) REFERENCES `_posts_v`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `_posts_v` (
	`id` integer PRIMARY KEY NOT NULL,
	`parent_id` integer,
	`version_title` text,
	`version_hero_image_id` integer,
	`version_content` text,
	`version_meta_title` text,
	`version_meta_image_id` integer,
	`version_meta_description` text,
	`version_published_at` text,
	`version_generate_slug` integer DEFAULT true,
	`version_slug` text,
	`version_initiative_id` integer,
	`version_updated_at` text,
	`version_created_at` text,
	`version__status` text DEFAULT 'draft',
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`latest` integer,
	`autosave` integer,
	FOREIGN KEY (`parent_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`version_hero_image_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`version_meta_image_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`version_initiative_id`) REFERENCES `initiatives`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE TABLE `_posts_v_rels` (
	`id` integer PRIMARY KEY NOT NULL,
	`order` integer,
	`parent_id` integer NOT NULL,
	`path` text NOT NULL,
	`posts_id` integer,
	`categories_id` integer,
	`users_id` integer,
	FOREIGN KEY (`parent_id`) REFERENCES `_posts_v`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`posts_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`categories_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`users_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `media` (
	`id` integer PRIMARY KEY NOT NULL,
	`alt` text,
	`caption` text,
	`folder_id` integer,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`url` text,
	`thumbnail_u_r_l` text,
	`filename` text,
	`mime_type` text,
	`filesize` numeric,
	`width` numeric,
	`height` numeric,
	`focal_x` numeric,
	`focal_y` numeric,
	`sizes_thumbnail_url` text,
	`sizes_thumbnail_width` numeric,
	`sizes_thumbnail_height` numeric,
	`sizes_thumbnail_mime_type` text,
	`sizes_thumbnail_filesize` numeric,
	`sizes_thumbnail_filename` text,
	`sizes_square_url` text,
	`sizes_square_width` numeric,
	`sizes_square_height` numeric,
	`sizes_square_mime_type` text,
	`sizes_square_filesize` numeric,
	`sizes_square_filename` text,
	`sizes_small_url` text,
	`sizes_small_width` numeric,
	`sizes_small_height` numeric,
	`sizes_small_mime_type` text,
	`sizes_small_filesize` numeric,
	`sizes_small_filename` text,
	`sizes_medium_url` text,
	`sizes_medium_width` numeric,
	`sizes_medium_height` numeric,
	`sizes_medium_mime_type` text,
	`sizes_medium_filesize` numeric,
	`sizes_medium_filename` text,
	`sizes_large_url` text,
	`sizes_large_width` numeric,
	`sizes_large_height` numeric,
	`sizes_large_mime_type` text,
	`sizes_large_filesize` numeric,
	`sizes_large_filename` text,
	`sizes_xlarge_url` text,
	`sizes_xlarge_width` numeric,
	`sizes_xlarge_height` numeric,
	`sizes_xlarge_mime_type` text,
	`sizes_xlarge_filesize` numeric,
	`sizes_xlarge_filename` text,
	`sizes_og_url` text,
	`sizes_og_width` numeric,
	`sizes_og_height` numeric,
	`sizes_og_mime_type` text,
	`sizes_og_filesize` numeric,
	`sizes_og_filename` text,
	FOREIGN KEY (`folder_id`) REFERENCES `payload_folders`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE TABLE `categories_breadcrumbs` (
	`_order` integer NOT NULL,
	`_parent_id` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`doc_id` integer,
	`url` text,
	`label` text,
	FOREIGN KEY (`doc_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`_parent_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `categories` (
	`id` integer PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`generate_slug` integer DEFAULT true,
	`slug` text NOT NULL,
	`parent_id` integer,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE TABLE `users_sessions` (
	`_order` integer NOT NULL,
	`_parent_id` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text,
	`expires_at` text NOT NULL,
	FOREIGN KEY (`_parent_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `users` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`email` text NOT NULL,
	`reset_password_token` text,
	`reset_password_expiration` text,
	`salt` text,
	`hash` text,
	`login_attempts` numeric DEFAULT 0,
	`lock_until` text
);
CREATE TABLE `users_rels` (
	`id` integer PRIMARY KEY NOT NULL,
	`order` integer,
	`parent_id` integer NOT NULL,
	`path` text NOT NULL,
	`roles_id` integer,
	FOREIGN KEY (`parent_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`roles_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `roles` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
CREATE TABLE `members` (
	`id` integer PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`membership_type` text NOT NULL,
	`voting_status` text,
	`pays_fee` integer DEFAULT true,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE TABLE `initiatives` (
	`id` integer PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`image_id` integer,
	`site_link` text,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`image_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE TABLE `festivaleditions` (
	`id` integer PRIMARY KEY NOT NULL,
	`year` numeric NOT NULL,
	`title` text NOT NULL,
	`theme` text,
	`description` text,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
CREATE TABLE `festivalsections` (
	`id` integer PRIMARY KEY NOT NULL,
	`edition_id` integer NOT NULL,
	`name` text NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`edition_id`) REFERENCES `festivaleditions`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE TABLE `meetings` (
	`id` integer PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`date` text NOT NULL,
	`venue` text NOT NULL,
	`type` text NOT NULL,
	`workshop_topic` text,
	`presenter_id` integer,
	`discussion_agenda` text,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`presenter_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE TABLE `mentors` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`bio` text,
	`photo_id` integer,
	`user_account_id` integer,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`photo_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`user_account_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE TABLE `ninjas` (
	`id` integer PRIMARY KEY NOT NULL,
	`child_name` text NOT NULL,
	`age` numeric NOT NULL,
	`useful_info` text,
	`guardian_name` text NOT NULL,
	`guardian_email` text NOT NULL,
	`guardian_phone` text,
	`safety_agreement` integer DEFAULT false NOT NULL,
	`photo_release_agreement` integer DEFAULT false NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
CREATE TABLE `activities_audience` (
	`_order` integer NOT NULL,
	`_parent_id` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`audience_type` text,
	FOREIGN KEY (`_parent_id`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `activities` (
	`id` integer PRIMARY KEY NOT NULL,
	`edition_id` integer NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`type` text,
	`section_id` integer,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`edition_id`) REFERENCES `festivaleditions`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`section_id`) REFERENCES `festivalsections`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE TABLE `activities_rels` (
	`id` integer PRIMARY KEY NOT NULL,
	`order` integer,
	`parent_id` integer NOT NULL,
	`path` text NOT NULL,
	`guests_id` integer,
	FOREIGN KEY (`parent_id`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`guests_id`) REFERENCES `guests`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `locations_facilities` (
	`_order` integer NOT NULL,
	`_parent_id` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`facility` text,
	FOREIGN KEY (`_parent_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `locations` (
	`id` integer PRIMARY KEY NOT NULL,
	`edition_id` integer NOT NULL,
	`name` text NOT NULL,
	`address` text,
	`coordinates` text,
	`description` text,
	`floor_plan_id` integer,
	`capacity` numeric,
	`coordinator_id` integer,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`edition_id`) REFERENCES `festivaleditions`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`floor_plan_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`coordinator_id`) REFERENCES `volunteers`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE TABLE `locations_rels` (
	`id` integer PRIMARY KEY NOT NULL,
	`order` integer,
	`parent_id` integer NOT NULL,
	`path` text NOT NULL,
	`media_id` integer,
	FOREIGN KEY (`parent_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `schedule` (
	`id` integer PRIMARY KEY NOT NULL,
	`edition_id` integer NOT NULL,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	`activity_id` integer,
	`location_id` integer,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`edition_id`) REFERENCES `festivaleditions`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`location_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE TABLE `volunteers` (
	`id` integer PRIMARY KEY NOT NULL,
	`edition_id` integer NOT NULL,
	`name` text NOT NULL,
	`photo_id` integer,
	`organization` text,
	`birth_date` text,
	`phone` text,
	`agreement_document_id` integer,
	`coordinator_id` integer,
	`user_account_id` integer,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`edition_id`) REFERENCES `festivaleditions`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`photo_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`agreement_document_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`coordinator_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`user_account_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE TABLE `guests_guest_type` (
	`order` integer NOT NULL,
	`parent_id` integer NOT NULL,
	`value` text,
	`id` integer PRIMARY KEY NOT NULL,
	FOREIGN KEY (`parent_id`) REFERENCES `guests`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `guests` (
	`id` integer PRIMARY KEY NOT NULL,
	`edition_id` integer NOT NULL,
	`name` text NOT NULL,
	`organization` text,
	`bio` text,
	`photo_id` integer,
	`website` text,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`edition_id`) REFERENCES `festivaleditions`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`photo_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE TABLE `redirects` (
	`id` integer PRIMARY KEY NOT NULL,
	`from` text NOT NULL,
	`to_type` text DEFAULT 'reference',
	`to_url` text,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
CREATE TABLE `redirects_rels` (
	`id` integer PRIMARY KEY NOT NULL,
	`order` integer,
	`parent_id` integer NOT NULL,
	`path` text NOT NULL,
	`pages_id` integer,
	`posts_id` integer,
	FOREIGN KEY (`parent_id`) REFERENCES `redirects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`pages_id`) REFERENCES `pages`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`posts_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `forms_blocks_checkbox` (
	`_order` integer NOT NULL,
	`_parent_id` integer NOT NULL,
	`_path` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`label` text,
	`width` numeric,
	`required` integer,
	`default_value` integer,
	`block_name` text,
	FOREIGN KEY (`_parent_id`) REFERENCES `forms`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `forms_blocks_country` (
	`_order` integer NOT NULL,
	`_parent_id` integer NOT NULL,
	`_path` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`label` text,
	`width` numeric,
	`required` integer,
	`block_name` text,
	FOREIGN KEY (`_parent_id`) REFERENCES `forms`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `forms_blocks_email` (
	`_order` integer NOT NULL,
	`_parent_id` integer NOT NULL,
	`_path` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`label` text,
	`width` numeric,
	`required` integer,
	`block_name` text,
	FOREIGN KEY (`_parent_id`) REFERENCES `forms`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `forms_blocks_message` (
	`_order` integer NOT NULL,
	`_parent_id` integer NOT NULL,
	`_path` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`message` text,
	`block_name` text,
	FOREIGN KEY (`_parent_id`) REFERENCES `forms`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `forms_blocks_number` (
	`_order` integer NOT NULL,
	`_parent_id` integer NOT NULL,
	`_path` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`label` text,
	`width` numeric,
	`default_value` numeric,
	`required` integer,
	`block_name` text,
	FOREIGN KEY (`_parent_id`) REFERENCES `forms`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `forms_blocks_select_options` (
	`_order` integer NOT NULL,
	`_parent_id` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`value` text NOT NULL,
	FOREIGN KEY (`_parent_id`) REFERENCES `forms_blocks_select`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `forms_blocks_select` (
	`_order` integer NOT NULL,
	`_parent_id` integer NOT NULL,
	`_path` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`label` text,
	`width` numeric,
	`default_value` text,
	`placeholder` text,
	`required` integer,
	`block_name` text,
	FOREIGN KEY (`_parent_id`) REFERENCES `forms`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `forms_blocks_state` (
	`_order` integer NOT NULL,
	`_parent_id` integer NOT NULL,
	`_path` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`label` text,
	`width` numeric,
	`required` integer,
	`block_name` text,
	FOREIGN KEY (`_parent_id`) REFERENCES `forms`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `forms_blocks_text` (
	`_order` integer NOT NULL,
	`_parent_id` integer NOT NULL,
	`_path` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`label` text,
	`width` numeric,
	`default_value` text,
	`required` integer,
	`block_name` text,
	FOREIGN KEY (`_parent_id`) REFERENCES `forms`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `forms_blocks_textarea` (
	`_order` integer NOT NULL,
	`_parent_id` integer NOT NULL,
	`_path` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`label` text,
	`width` numeric,
	`default_value` text,
	`required` integer,
	`block_name` text,
	FOREIGN KEY (`_parent_id`) REFERENCES `forms`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `forms_emails` (
	`_order` integer NOT NULL,
	`_parent_id` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`email_to` text,
	`cc` text,
	`bcc` text,
	`reply_to` text,
	`email_from` text,
	`subject` text DEFAULT 'You''ve received a new message.' NOT NULL,
	`message` text,
	FOREIGN KEY (`_parent_id`) REFERENCES `forms`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `forms` (
	`id` integer PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`submit_button_label` text,
	`confirmation_type` text DEFAULT 'message',
	`confirmation_message` text,
	`redirect_url` text,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
CREATE TABLE `form_submissions_submission_data` (
	`_order` integer NOT NULL,
	`_parent_id` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`field` text NOT NULL,
	`value` text NOT NULL,
	FOREIGN KEY (`_parent_id`) REFERENCES `form_submissions`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `form_submissions` (
	`id` integer PRIMARY KEY NOT NULL,
	`form_id` integer NOT NULL,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`form_id`) REFERENCES `forms`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE TABLE `search_categories` (
	`_order` integer NOT NULL,
	`_parent_id` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`relation_to` text,
	`category_i_d` text,
	`title` text,
	FOREIGN KEY (`_parent_id`) REFERENCES `search`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `search` (
	`id` integer PRIMARY KEY NOT NULL,
	`title` text,
	`priority` numeric,
	`slug` text,
	`meta_title` text,
	`meta_description` text,
	`meta_image_id` integer,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`meta_image_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE TABLE `search_rels` (
	`id` integer PRIMARY KEY NOT NULL,
	`order` integer,
	`parent_id` integer NOT NULL,
	`path` text NOT NULL,
	`posts_id` integer,
	FOREIGN KEY (`parent_id`) REFERENCES `search`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`posts_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `payload_kv` (
	`id` integer PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`data` text NOT NULL
);
CREATE TABLE `payload_jobs_log` (
	`_order` integer NOT NULL,
	`_parent_id` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`executed_at` text NOT NULL,
	`completed_at` text NOT NULL,
	`task_slug` text NOT NULL,
	`task_i_d` text NOT NULL,
	`input` text,
	`output` text,
	`state` text NOT NULL,
	`error` text,
	FOREIGN KEY (`_parent_id`) REFERENCES `payload_jobs`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `payload_jobs` (
	`id` integer PRIMARY KEY NOT NULL,
	`input` text,
	`completed_at` text,
	`total_tried` numeric DEFAULT 0,
	`has_error` integer DEFAULT false,
	`error` text,
	`task_slug` text,
	`queue` text DEFAULT 'default',
	`wait_until` text,
	`processing` integer DEFAULT false,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
CREATE TABLE `payload_folders_folder_type` (
	`order` integer NOT NULL,
	`parent_id` integer NOT NULL,
	`value` text,
	`id` integer PRIMARY KEY NOT NULL,
	FOREIGN KEY (`parent_id`) REFERENCES `payload_folders`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `payload_folders` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`folder_id` integer,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	FOREIGN KEY (`folder_id`) REFERENCES `payload_folders`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE TABLE `payload_locked_documents` (
	`id` integer PRIMARY KEY NOT NULL,
	`global_slug` text,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
CREATE TABLE `payload_locked_documents_rels` (
	`id` integer PRIMARY KEY NOT NULL,
	`order` integer,
	`parent_id` integer NOT NULL,
	`path` text NOT NULL,
	`pages_id` integer,
	`posts_id` integer,
	`media_id` integer,
	`categories_id` integer,
	`users_id` integer,
	`roles_id` integer,
	`members_id` integer,
	`initiatives_id` integer,
	`festivaleditions_id` integer,
	`festivalsections_id` integer,
	`meetings_id` integer,
	`mentors_id` integer,
	`ninjas_id` integer,
	`activities_id` integer,
	`locations_id` integer,
	`schedule_id` integer,
	`volunteers_id` integer,
	`guests_id` integer,
	`redirects_id` integer,
	`forms_id` integer,
	`form_submissions_id` integer,
	`search_id` integer,
	`payload_folders_id` integer,
	FOREIGN KEY (`parent_id`) REFERENCES `payload_locked_documents`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`pages_id`) REFERENCES `pages`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`posts_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`categories_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`users_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`roles_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`members_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`initiatives_id`) REFERENCES `initiatives`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`festivaleditions_id`) REFERENCES `festivaleditions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`festivalsections_id`) REFERENCES `festivalsections`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`meetings_id`) REFERENCES `meetings`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`mentors_id`) REFERENCES `mentors`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`ninjas_id`) REFERENCES `ninjas`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`activities_id`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`locations_id`) REFERENCES `locations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`schedule_id`) REFERENCES `schedule`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`volunteers_id`) REFERENCES `volunteers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`guests_id`) REFERENCES `guests`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`redirects_id`) REFERENCES `redirects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`forms_id`) REFERENCES `forms`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`form_submissions_id`) REFERENCES `form_submissions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`search_id`) REFERENCES `search`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`payload_folders_id`) REFERENCES `payload_folders`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `payload_preferences` (
	`id` integer PRIMARY KEY NOT NULL,
	`key` text,
	`value` text,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
CREATE TABLE `payload_preferences_rels` (
	`id` integer PRIMARY KEY NOT NULL,
	`order` integer,
	`parent_id` integer NOT NULL,
	`path` text NOT NULL,
	`users_id` integer,
	FOREIGN KEY (`parent_id`) REFERENCES `payload_preferences`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`users_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `payload_migrations` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text,
	`batch` numeric,
	`updated_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
);
CREATE TABLE `header_nav_items` (
	`_order` integer NOT NULL,
	`_parent_id` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`link_type` text DEFAULT 'reference',
	`link_new_tab` integer,
	`link_url` text,
	`link_label` text NOT NULL,
	FOREIGN KEY (`_parent_id`) REFERENCES `header`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `header` (
	`id` integer PRIMARY KEY NOT NULL,
	`updated_at` text,
	`created_at` text
);
CREATE TABLE `header_rels` (
	`id` integer PRIMARY KEY NOT NULL,
	`order` integer,
	`parent_id` integer NOT NULL,
	`path` text NOT NULL,
	`pages_id` integer,
	`posts_id` integer,
	FOREIGN KEY (`parent_id`) REFERENCES `header`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`pages_id`) REFERENCES `pages`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`posts_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `footer_nav_items` (
	`_order` integer NOT NULL,
	`_parent_id` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`link_type` text DEFAULT 'reference',
	`link_new_tab` integer,
	`link_url` text,
	`link_label` text NOT NULL,
	FOREIGN KEY (`_parent_id`) REFERENCES `footer`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE TABLE `footer` (
	`id` integer PRIMARY KEY NOT NULL,
	`updated_at` text,
	`created_at` text
);
CREATE TABLE `footer_rels` (
	`id` integer PRIMARY KEY NOT NULL,
	`order` integer,
	`parent_id` integer NOT NULL,
	`path` text NOT NULL,
	`pages_id` integer,
	`posts_id` integer,
	FOREIGN KEY (`parent_id`) REFERENCES `footer`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`pages_id`) REFERENCES `pages`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`posts_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade
);


