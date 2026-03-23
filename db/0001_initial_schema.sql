PRAGMA foreign_keys = ON;

-- Date/datetime convention: store as TEXT (ISO 8601). Where both date and time
-- are needed use a single datetime field; extract in queries via date(...) and time(...).
-- Date-only fields (e.g. birth_date, joined_at): same TEXT, store date or datetime as needed.

BEGIN;

-- ---------------------------------------------------------------------------
-- Users, profiles, roles (RBAC)
-- ---------------------------------------------------------------------------

CREATE TABLE profiles (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  birth_date TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  profile_id INTEGER NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE RESTRICT
);

CREATE TABLE roles (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE user_roles (
  user_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------------
-- Members (Class Table Inheritance)
-- ---------------------------------------------------------------------------

CREATE TABLE members (
  id INTEGER PRIMARY KEY,
  profile_id INTEGER NOT NULL UNIQUE,
  joined_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE RESTRICT
);

CREATE TABLE aspiring_members (
  member_id INTEGER PRIMARY KEY,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

CREATE TABLE full_members (
  member_id INTEGER PRIMARY KEY,
  full_member_kind TEXT NOT NULL CHECK (full_member_kind IN ('founder', 'honorary', 'regular')),
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

CREATE TABLE membership_fees (
  id INTEGER PRIMARY KEY,
  member_id INTEGER NOT NULL,
  year INTEGER NOT NULL,
  amount NUMERIC,
  status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'overdue')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (member_id, year),
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- CTI guardrails: a member cannot exist in both subtype tables.
CREATE TRIGGER trg_aspiring_members_not_full
BEFORE INSERT ON aspiring_members
FOR EACH ROW
WHEN EXISTS (SELECT 1 FROM full_members fm WHERE fm.member_id = NEW.member_id)
BEGIN
  SELECT RAISE(ABORT, 'member already exists in full_members');
END;

CREATE TRIGGER trg_full_members_not_aspiring
BEFORE INSERT ON full_members
FOR EACH ROW
WHEN EXISTS (SELECT 1 FROM aspiring_members am WHERE am.member_id = NEW.member_id)
BEGIN
  SELECT RAISE(ABORT, 'member already exists in aspiring_members');
END;

-- Membership fees are only valid for regular full members.
CREATE TRIGGER trg_membership_fees_only_regular
BEFORE INSERT ON membership_fees
FOR EACH ROW
WHEN NOT EXISTS (
  SELECT 1
  FROM full_members fm
  WHERE fm.member_id = NEW.member_id
    AND fm.full_member_kind = 'regular'
)
BEGIN
  SELECT RAISE(ABORT, 'membership_fees are allowed only for full_members kind regular');
END;

CREATE TRIGGER trg_membership_fees_only_regular_update
BEFORE UPDATE OF member_id ON membership_fees
FOR EACH ROW
WHEN NOT EXISTS (
  SELECT 1
  FROM full_members fm
  WHERE fm.member_id = NEW.member_id
    AND fm.full_member_kind = 'regular'
)
BEGIN
  SELECT RAISE(ABORT, 'membership_fees are allowed only for full_members kind regular');
END;

-- ---------------------------------------------------------------------------
-- Meetups
-- ---------------------------------------------------------------------------

-- Datetime: single TEXT (ISO 8601); use date(starts_at) / time(starts_at) in queries.
CREATE TABLE meetups (
  id INTEGER PRIMARY KEY,
  starts_at TEXT NOT NULL,
  location TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE meetup_workshops (
  id INTEGER PRIMARY KEY,
  meetup_id INTEGER NOT NULL UNIQUE,
  title TEXT NOT NULL,
  presenter_id INTEGER NOT NULL,
  theme TEXT NOT NULL CHECK (theme IN ('demo_your_stack', 'fup_nights', 'meet_the_business')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (meetup_id) REFERENCES meetups(id) ON DELETE CASCADE,
  FOREIGN KEY (presenter_id) REFERENCES profiles(id) ON DELETE RESTRICT
);

CREATE TABLE meetup_anti_workshops (
  id INTEGER PRIMARY KEY,
  meetup_id INTEGER NOT NULL UNIQUE,
  agenda TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (meetup_id) REFERENCES meetups(id) ON DELETE CASCADE
);

-- A meetup can be either workshop or anti-workshop, never both.
CREATE TRIGGER trg_meetup_workshop_exclusive
BEFORE INSERT ON meetup_workshops
FOR EACH ROW
WHEN EXISTS (
  SELECT 1
  FROM meetup_anti_workshops maw
  WHERE maw.meetup_id = NEW.meetup_id
)
BEGIN
  SELECT RAISE(ABORT, 'meetup already has anti-workshop');
END;

CREATE TRIGGER trg_meetup_anti_workshop_exclusive
BEFORE INSERT ON meetup_anti_workshops
FOR EACH ROW
WHEN EXISTS (
  SELECT 1
  FROM meetup_workshops mw
  WHERE mw.meetup_id = NEW.meetup_id
)
BEGIN
  SELECT RAISE(ABORT, 'meetup already has workshop');
END;

CREATE TRIGGER trg_meetup_workshop_exclusive_update
BEFORE UPDATE OF meetup_id ON meetup_workshops
FOR EACH ROW
WHEN EXISTS (
  SELECT 1
  FROM meetup_anti_workshops maw
  WHERE maw.meetup_id = NEW.meetup_id
)
BEGIN
  SELECT RAISE(ABORT, 'meetup already has anti-workshop');
END;

CREATE TRIGGER trg_meetup_anti_workshop_exclusive_update
BEFORE UPDATE OF meetup_id ON meetup_anti_workshops
FOR EACH ROW
WHEN EXISTS (
  SELECT 1
  FROM meetup_workshops mw
  WHERE mw.meetup_id = NEW.meetup_id
)
BEGIN
  SELECT RAISE(ABORT, 'meetup already has workshop');
END;

-- ---------------------------------------------------------------------------
-- CoderDojo
-- ---------------------------------------------------------------------------

CREATE TABLE dojo_mentors (
  id INTEGER PRIMARY KEY,
  profile_id INTEGER NOT NULL UNIQUE,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE RESTRICT
);

CREATE TABLE dojo_tutors (
  id INTEGER PRIMARY KEY,
  profile_id INTEGER NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE RESTRICT
);

-- Ninjas = children participating in dojo; they do not sign documents (minors). Tutors (responsible adults) sign agreements.
-- Ninja links to profile (no duplicated profile data); only ninja-specific info is useful_info.
CREATE TABLE dojo_ninjas (
  id INTEGER PRIMARY KEY,
  profile_id INTEGER NOT NULL,
  tutor_id INTEGER NOT NULL,
  useful_info TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE RESTRICT,
  FOREIGN KEY (tutor_id) REFERENCES dojo_tutors(id) ON DELETE RESTRICT
);

-- Datetime: single TEXT (ISO 8601); use date(starts_at) / time(starts_at) in queries.
CREATE TABLE dojo_sessions (
  id INTEGER PRIMARY KEY,
  starts_at TEXT NOT NULL,
  location TEXT NOT NULL,
  theme TEXT,
  mentor_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mentor_id) REFERENCES dojo_mentors(id) ON DELETE RESTRICT
);

CREATE TABLE agreement_documents (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  file_path TEXT,
  original_filename TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE mentor_agreement_signatures (
  id INTEGER PRIMARY KEY,
  mentor_id INTEGER NOT NULL,
  document_id INTEGER NOT NULL,
  signed_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (mentor_id, document_id),
  FOREIGN KEY (mentor_id) REFERENCES dojo_mentors(id) ON DELETE CASCADE,
  FOREIGN KEY (document_id) REFERENCES agreement_documents(id) ON DELETE RESTRICT
);

CREATE TABLE tutor_agreement_signatures (
  id INTEGER PRIMARY KEY,
  tutor_id INTEGER NOT NULL,
  document_id INTEGER NOT NULL,
  signed_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (tutor_id, document_id),
  FOREIGN KEY (tutor_id) REFERENCES dojo_tutors(id) ON DELETE CASCADE,
  FOREIGN KEY (document_id) REFERENCES agreement_documents(id) ON DELETE RESTRICT
);

-- ---------------------------------------------------------------------------
-- General Assembly (extension)
-- ---------------------------------------------------------------------------

-- announced_at, held_at: single datetime (TEXT); use date()/time() in queries if needed.
CREATE TABLE general_assemblies (
  id INTEGER PRIMARY KEY,
  year INTEGER NOT NULL,
  announced_at TEXT,
  held_at TEXT,
  location TEXT,
  min_quorum INTEGER,
  activity_report_document_id INTEGER,
  minutes_document_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (activity_report_document_id) REFERENCES agreement_documents(id) ON DELETE SET NULL,
  FOREIGN KEY (minutes_document_id) REFERENCES agreement_documents(id) ON DELETE SET NULL
);

CREATE TABLE general_assembly_attendees (
  assembly_id INTEGER NOT NULL,
  member_id INTEGER NOT NULL,
  attended INTEGER NOT NULL DEFAULT 1 CHECK (attended IN (0, 1)),
  PRIMARY KEY (assembly_id, member_id),
  FOREIGN KEY (assembly_id) REFERENCES general_assemblies(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------------
-- Helpful indexes
-- ---------------------------------------------------------------------------

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_members_profile_id ON members(profile_id);
CREATE INDEX idx_membership_fees_member_id ON membership_fees(member_id);
CREATE INDEX idx_membership_fees_year ON membership_fees(year);
CREATE INDEX idx_meetups_starts_at ON meetups(starts_at);
CREATE INDEX idx_meetup_workshops_presenter_id ON meetup_workshops(presenter_id);
CREATE INDEX idx_dojo_sessions_starts_at ON dojo_sessions(starts_at);
CREATE INDEX idx_dojo_sessions_mentor_id ON dojo_sessions(mentor_id);
CREATE INDEX idx_dojo_ninjas_tutor_id ON dojo_ninjas(tutor_id);
CREATE INDEX idx_dojo_ninjas_profile_id ON dojo_ninjas(profile_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);

COMMIT;
