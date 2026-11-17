# Growing Futures Maths

A maths practice platform for Functional Skills **Entry Level 1, Entry Level 2, Entry Level 3, Level 1 and Level 2**.
Topics follow the Growing Futures annual session plans (six half-term blocks per level) and the DfE subject content.

- Students log in, work through lessons and practice questions, and see what to do next.
- Staff create the accounts, see each student's progress topic by topic, set catch-up work, and make quizzes, term assessments and mock exams.
- It has a built-in calculator (only on questions where one is allowed), a whiteboard and notes.

Version 2 runs on **Supabase** (database and API) and **GitHub Pages** (the website). See [KNOWN-ISSUES.md](KNOWN-ISSUES.md) for what changed and what is still to do.

## How it fits together

```
 Student or staff browser
        │  loads the website from GitHub Pages (web/)
        │  sends every request to ↓ with a login token
 Supabase Edge Function "api"   (supabase/functions/api → _shared/core.js)
        │  builds questions, marks answers, keeps time limits, checks logins
        ↓
 Supabase Postgres, private schema "gf"   (not reachable from the browser)
```

The browser never sees an answer before the server has marked it. Supabase's public REST API cannot reach the `gf` schema: only the Edge Function can, through its own database connection.

## Try it on your own computer

You need **Node.js 20 or newer** (https://nodejs.org). No Supabase account is needed for this: it uses an in-memory database.

```
npm install
npm run demo
```

Open http://localhost:3000. Staff login `demo` / `demo-staff-1`. Student logins `alex`, `bryn`, `casey`, `devon`, `elowen`, `finn`, `gwen`, `harri`, all with password `demo1234`. Everything is forgotten when you stop it.

`npm run dev` does the same without the made-up students (the setup screen asks you to create the first staff account).

## Put it online

You do this once. After that, every push to `main` tests the code and updates both the website and the API.

1. **Create a Supabase project** at https://supabase.com (free plan is fine to start). Choose the **London (eu-west-2)** region. Note the **project ref**: the part before `.supabase.co` in the project URL.
2. **Create a Supabase access token**: supabase.com → your avatar → Account → Access tokens → Generate. Copy it.
3. In this GitHub repository go to **Settings → Secrets and variables → Actions** and add:
   - Variable `SUPABASE_PROJECT_REF`: your project ref.
   - Secret `SUPABASE_ACCESS_TOKEN`: the token from step 2.
   - Secret `SETUP_CODE`: any long random text. It is needed to create the first staff account and to recover a locked-out staff account. Keep a copy somewhere safe.
4. **Settings → Pages**: under "Build and deployment" choose **GitHub Actions**.
5. **Actions → Test and deploy → Run workflow**. When it finishes, the website is at `https://<your-github-name>.github.io/<repository-name>/`.
6. Open the website straight away and do the **first-time setup** with the setup code. Then add a second staff account (Settings → Staff accounts) so one can reset the other's password.

The database tables are created automatically the first time the API runs.

### Settings

| Where | Name | Meaning |
| --- | --- | --- |
| GitHub variable | `SUPABASE_PROJECT_REF` | Which Supabase project to deploy to |
| GitHub secret | `SUPABASE_ACCESS_TOKEN` | Lets the workflow deploy the API |
| GitHub secret → Supabase secret | `SETUP_CODE` | Needed for first setup and staff password recovery |
| Supabase secret (set by the workflow) | `ALLOWED_ORIGIN` | The website address allowed to call the API (your GitHub Pages address) |
| Supabase secret (optional) | `ADMIN_USER`, `ADMIN_PASS`, `ADMIN_NAME` | Create the first staff account automatically instead of using the setup screen |

Staff can change these in the platform itself (Settings): branding, logo, the YouTube search link (off by default), the idle log-out times (20 minutes for students, 60 for staff by default) and the privacy notice.

### Using your own web address

Point a domain at GitHub Pages (Settings → Pages → Custom domain), then set the Supabase secret `ALLOWED_ORIGIN` to that address (for example `https://maths.growingfutures.org.uk`). If you do, also change the `ORIGIN` line in `.github/workflows/deploy.yml` so the workflow does not set it back.

## Back up

Supabase keeps daily backups on its paid plans. On any plan, staff can download a full copy from **Settings → Data and backups → Download a full backup** (a JSON file with every table; passwords stay scrambled). Do this at least every half term and keep it somewhere safe: it contains student names and notes.

## How the catch-up system works

- Each student has a **level** and a **current half term** (block 1 to 6). Staff set both.
- The student's home screen shows the current half term's topics first.
- Any topic from an **earlier** half term that is not secure appears on the student's **catch-up list**. They practise only those, not everything.
- Staff can add any topic to a student's catch-up list by ticking "Set" on the student's page.
- For a late starter, press **Set a starting-point check**. This makes a short quiz with one question per earlier topic. Topics answered correctly are marked "Passed check" and skipped. The rest go on the catch-up list.
- A topic becomes **Secure** when the student gets 8 of their last 10 questions right first time (at least 4 of the first 5).

## Quizzes

| Type | What it covers | Default length |
| --- | --- | --- |
| Half-term quiz | The sessions taught in one half term | 10 questions, untimed |
| Term assessment | The term's two blocks, plus a quarter from earlier terms (half for Summer). Non-calculator and calculator sections | 20 questions, 40 minutes |
| Mock exam | The whole level. Non-calculator and calculator sections | 20 (Entry) or 30 (Level 1 and 2) questions |
| Starting-point check | One question per topic before a chosen half term | untimed |
| Custom quiz | Topics you tick | 10 questions |

- No quiz contains the same question type twice while a topic has others, and never identical wording.
- Time limits are kept by the server. When time runs out the attempt is marked with whatever was saved, even if the student closed the page. Staff can also press **Mark it now**.
- **Extra time** for access arrangements is set per student (25%, 50% or double).
- **Let them retake** takes the first attempt out of the student's progress and gives them new questions.
- Every quiz has a printable paper and a version with answers and methods.

## Videos

Every lesson and every worked solution can be played step by step with a voice reading it out (the browser's built-in voice). On a device with no voice installed, the steps move on at reading speed.
To add a real video to a topic, go to **Curriculum and videos**, paste a YouTube or Vimeo link next to the topic and press Save.

## What is stored about students

A display name, a username, a scrambled (hashed) password, their answers, quiz results, and any notes or whiteboard drawings they save.
No dates of birth, addresses or email addresses. Use a first name and initial rather than full names.
A **draft** privacy notice is built in (Settings → Privacy notice). Growing Futures must check it and fill in the gaps before real students use the platform.
Staff see every new student note on the **Student notes** page, with a count of unread notes in the menu.

## What is in this folder

| File or folder | What it does |
| --- | --- |
| `supabase/functions/_shared/core.js` | The API: logins, marking, quizzes, progress, staff tools |
| `supabase/functions/_shared/schema.js` | The database tables, as numbered migrations (add new ones at the end) |
| `supabase/functions/_shared/content.js` | **Generated** from `content/` by `npm run build`. Do not edit by hand |
| `supabase/functions/api/index.js` | The Supabase Edge Function that runs the API |
| `content/` | The question bank and lessons. One file per level, plus shared drawing and checking code (`lib.js`, `figs.js`) |
| `web/` | The website: the page, the styles, the student screens (`app.js`) and the staff screens (`admin.js`) |
| `dev/server.mjs` | Runs everything on your own computer with an in-memory database |
| `test/` | Automatic checks. Run `npm test` |
| `.github/workflows/deploy.yml` | Tests, then deploys the API to Supabase and the website to GitHub Pages |

### Changing or adding questions

Open the level file in `content/`. Each `topic(...)` block is one session from the plan: a title, a lesson, and a list of small functions that each build one type of question with random numbers.
After any change run `npm test` (it rebuilds `content.js` first), then commit both your change and the rebuilt `supabase/functions/_shared/content.js`.

## Tests

```
npm test
```

- `test/content.test.mjs` builds every question type many times and checks the answer, the options and the worked steps.
- `test/marking.test.mjs` checks the marking rules (money, fractions, words, commas), hidden labels and quiz building.
- `test/api.test.mjs` runs the real API against an in-memory Postgres and checks logins, permissions, marking, quizzes, time limits, retakes, catch-up, notes and the staff tools (about 2,000 checks).

On Windows the in-memory database prints "The system cannot find the path specified" a few times when it starts. That is harmless.
