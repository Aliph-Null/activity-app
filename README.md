# 🎓 Temă de Laborator: Baze de Date
## Proiect: Generarea Migrației Inițiale pentru Baza de Date a Asociației AI3

### 1. Contextul Proiectului
Bun venit la o provocare reală! Scopul acestui laborator este să modelăm și să implementăm structura bazei de date pentru o aplicație funcțională. "Clientul" este Asociația AI3 (Clusterul de IT&C Alba), care are nevoie de o platformă pentru a-și gestiona activitățile principale:

- Activitățile Curente (întâlniri săptămânale, Coder Dojo, festivalul #difffusion).
- Membrii și Voluntarii asociației.
- Conținutul Public (articole de blog, pagini).

Baza de date pe care o veți crea va sta la baza site-urilor web ale asociației, Dojo-ului și festivalului.

### 2. Tehnologia: Payload CMS
Pentru acest proiect, vom folosi Payload CMS.

Ce este? Payload este un Headless CMS (Content Management System) scris în TypeScript. În loc să scriem SQL direct, definim structura datelor sub formă de "Colecții" (Collections) în codul TypeScript.

Cum funcționează? Pe baza acestor definiții (pe care le veți scrie local), Payload generează automat un fișier de migrație pentru baza de date.

Scopul Vostru: Să scrieți definițiile colecțiilor necesare și să folosiți uneltele Payload pentru a genera fișierul de migrație inițială. Acest fișier generat este livrabilul principal.

➡️ Documentație Oficială Payload: https://payloadcms.com/docs/getting-started/installation

### 3. Cerințe de Modelare (Specificații)
Pentru a genera migrația corectă, trebuie să modelați următoarele entități. Toate denumirile (colecții și câmpuri) trebuie să fie în limba engleză.

Acestea sunt specificațiile pe baza cărora veți lucra. Nu trebuie să predați fișierele de colecții, ci doar migrația pe care o produc acestea.

**Atenție!!** Câmpurile marcate drept condiționale pot însemna, sub normalizare, relaâii diferite.

#### A. Colecții de Bază și Inițiative

**Roles (Roluri)**

Câmpuri: name (text, unic, required).

(Colecția Users, deja existentă, va avea o relație many-to-many cu Roles).

**Members (Membri AI3)**

Un utilizator poate să fie membru, dar există și utilizatori administrativi, care nu sunt membri, dar au acces. Membrii pot să fie cu drep de vot sau aspiranți. Dintre membrii cu drept de vot putem avea și membri fondatori și membri de onoare. Este relevant deoarece membrii de onoare nu plătesc cotizație, dar pot vota.

**Initiatives (Inițiative AI3)**

Câmpuri: title (text), description (richText), image (relație cu Media), siteLink (url).

(Colecția Posts, deja existentă, ar trebui modificată pentru a avea o relație many-to-one cu Initiatives).

#### B. Modulul 1: Întâlniri Săptămânale

**Meetings**

Câmpuri: title (text, required), date (date, required), venue (text, required), type (select: 'workshop', 'anti-workshop'), workshopTopic (select: 'Demo your stack', 'F*ck-up nights', 'Meet the business' - condițional), presenter (relație 1-la-1 cu Members - condițional), discussionAgenda (richText - condițional).

#### C. Modulul 2: Coder Dojo Alba Iulia

**Ninjas (Copii înscriși)**

Câmpuri: childName (text), age (number), usefulInfo (textarea), guardianName (text), guardianEmail (email), guardianPhone (text), safetyAgreement (checkbox, required), photoReleaseAgreement (checkbox, required).

**Mentors**

Câmpuri: name (text), bio (richText), photo (relație cu Media), userAccount (relație 1-la-1, opțională, cu Users).

#### D. Modulul 3: Festivalul #difffusion

**FestivalEditions**

Câmpuri: year (number, required), title (text, required), theme (text), description (richText).

**FestivalSections**

Câmpuri: edition (relație many-to-one cu FestivalEditions), name (text).

**Locations**

Câmpuri: edition (relație many-to-one cu FestivalEditions), name (text), address (text), coordinates (point), description (richText), floorPlan (relație cu Media), capacity (number), facilities (array de tag-uri), photos (relație one-to-many cu Media), coordinator (relație 1-la-1 cu Volunteers).

**Guests (Invitați Festival)**

Câmpuri: edition (relație many-to-one cu FestivalEditions), name (text), organization (text), guestType (array de checkbox-uri: 'speaker', 'workshop_holder', 'exhibitor'), bio (richText), photo (relație cu Media), website (url).

**Volunteers**

Câmpuri: edition (relație many-to-one cu FestivalEditions), name (text), photo (relație cu Media), organization (text), birthDate (date), phone (text), agreementDocument (relație cu Media), coordinator (relație many-to-one cu Members), userAccount (relație 1-la-1, opțională, cu Users).

**Activities (Activități Festival)**

Câmpuri: edition (relație many-to-one cu FestivalEditions), title (text), description (richText), type (select: 'expo', 'talk', 'workshop', 'social', 'entertainment'), audience (array de checkbox-uri), guests (relație many-to-many cu Guests), section (relație many-to-one, opțională, cu FestivalSections).

**Schedule (Programul Festivalului)**

Câmpuri: edition (relație many-to-one cu FestivalEditions), startTime (date), endTime (date), activity (relație many-to-one cu Activities), location (relație many-to-one cu Locations).

### 4. 🎯 Livrabile Obligatorii
Pentru a finaliza tema, trebuie să pregătiți și să trimiteți un Pull Request (PR) care să conțină exact două lucruri:

**_Fișierul de Migrație Inițială (Generat)_**

Acesta este elementul central al temei.

După ce ați definit toate colecțiile (local, în proiectul vostru), trebuie să rulați comanda de generare a migrației (ex: npm run payload migrate).

Această comandă va crea un singur fișier în src/migrations/, cu un nume de forma 0001_initial.ts.

Acest fișier, care conține funcțiile async function up() și async function down(), este singurul cod care trebuie inclus în PR.

Pentru extra points se poate face și o migrare ce adaugă/modifică un câmp.

**_Diagrama ERD (Entity-Relationship Diagram)_**

O singură diagramă (imagine PNG/SVG sau PDF) care ilustrează vizual colecțiile pe care le-ați modelat și relațiile dintre ele (1-la-1, 1-la-M, M-la-M).

Fișierul (ex: ERD.pdf) trebuie plasat în directorul rădăcină (root) al repository-ului.

**Notă**: _Deși pentru a crea migrația trebuie să scrieți fișierele de definiție a colecțiilor (src/collections/...), includerea acestor fișiere-sursă în PR este opțională. Singurul livrabil de cod evaluat va fi fișierul de migrație generat. Câmpurile sunt orientative și subiect al modificărilor ulterioare dacă acestea sunt necesare pentru funcționalitate._

**Trimiterea Temei:**

- Faceți un "fork" la repository-ul asociației.
- Creați un "branch" nou (ex. feature/db-migration-numele_vostru).
- Adăugați fișierul de migrație generat în src/migrations/ și diagrama ERD în directorul rădăcină.
- Trimiteți un Pull Request către repository-ul oficial: https://github.com/Asociatia-AI3/activity-app

### 5. 💡 Sfaturi și Evaluare
**Citiți documentația Payload!** Este esențial să înțelegeți cum se definesc colecțiile pentru a putea genera migrația.

**Atenție la proces**: Sarcina voastră este să definiți colecțiile în TypeScript (local) și să generați fișierul de migrație. Nu trebuie să scrieți manual funcțiile up/down, ci să vă asigurați că generarea lor funcționează corect și reflectă cerințele.

**Gândiți relațiile**: Stabiliți corect cardinalitatea. Când este o relație hasMany (array de ID-uri) și când este one-to-one sau many-to-one (un singur ID)? O diagramă ERD corectă depinde de acest pas.

Succes!
