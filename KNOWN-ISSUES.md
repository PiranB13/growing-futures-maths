# Growing Futures Maths: known issues and improvement list

Version 2.0.0 · updated 17 November 2026 (version 1.0.0 list written the same day)

Version 2 moves the platform to Supabase (database and API) and GitHub Pages (website), and fixes many items from the version 1 list.
Each item keeps its version 1 number. **Status** is one of:

- **Fixed**: changed in version 2 and covered by an automatic test (`npm test`) unless it says otherwise.
- **Partly fixed**: some of it is done; the rest is described.
- **Open**: not changed.

---

## 1. Sort these out before real students use it

| # | Issue | Status | What version 2 does / what is left |
|---|---|---|---|
| 1.1 | It is not online. | **Fixed** | Live at https://piranb13.github.io/growing-futures-maths/ with the API on Supabase (project `ttxhffuxxyztcwxvzuuo`). GitHub Actions redeploys both on every push. Still to do: first-time setup, then a test from a second device. |
| 1.2 | The first person to open a fresh install becomes the admin. | **Fixed** | First-time setup needs the `SETUP_CODE` secret. Without the right code, setup is refused. |
| 1.3 | A locked-out sole staff member cannot get back in. | **Fixed** | Staff can reset each other's passwords. A locked-out member of staff can set a new password from the login page with the setup code. The last staff account cannot be removed. |
| 1.4 | No maths teacher has checked the questions or lessons. | Open | Still needs your maths lead to go through Curriculum and videos > Preview for all 140 topics. |
| 1.5 | Quizzes can contain the same question twice. | **Fixed** | A quiz never uses the same question type twice for a topic while that topic has another type left, and never uses identical wording. Tested: 600 quizzes, no repeats. |
| 1.6 | Lessons flash past on a device with no voice. | **Fixed (not tested on a real device)** | If speech "finishes" far too quickly, the player switches to reading-speed timing and says so. Speech that never ends cannot stall a lesson either. |
| 1.7 | "Find more videos on YouTube" link in every lesson. | **Fixed** | Off by default. Staff can switch it on in Settings > Options. |
| 1.8 | Quiz time limits only enforced in the browser. | **Fixed** | The server stores each attempt's end time. Saving after it is refused, and the attempt is marked with the saved answers as soon as anyone (student or staff) next opens a page about it. Staff have a "Mark it now" button. The on-screen clock follows the server's clock. |
| 1.9 | A student can skip a hard practice question for free. | **Fixed** | An unanswered question comes back after a reload, with its hint if one go has been used. "Show me how" still ends the question and counts it as wrong. |
| 1.10 | Data protection is not done. | **Partly fixed** | A draft privacy notice is built in (Settings > Privacy notice), readable from the login page. A **Student notes** page shows every note with an unread count in the menu. Still needed: Growing Futures sign-off, a retention period, and deciding who reads notes and how often. There is no automatic deletion. |
| 1.11 | No idle log-out on shared devices. | **Fixed** | Students are logged out after 20 minutes with nothing happening, staff after 60 (both adjustable). The server enforces it too. The login is kept only for that browser tab, so closing the tab logs out. A student logged out mid-quiz returns to the quiz after logging in, with saved answers. |
| 1.12 | Never used on a real tablet, phone, Chromebook, voice or printer. | Open | Still needs half an hour on each device type. |

---

## 2. Confirmed bugs and rough edges

| # | Issue | Status | Notes |
|---|---|---|---|
| 2.1 | Quizzes accept an un-simplified fraction when "simplest form" is asked. | **Fixed** | In quizzes, an un-simplified fraction (or ratio, when the question asks for simplest form) gets no mark. Practice still nudges. |
| 2.2 | £6.1 marked right for £6.10. | **Fixed** | Practice says "write money with two numbers after the point". Quizzes give no mark. |
| 2.3 | A decimal is accepted where a fraction is asked for. | **Fixed** | Practice asks for a fraction. Quizzes give no mark. |
| 2.4 | Words ("five") and a comma decimal point ("1,5") not accepted. | **Fixed** | Number words up to millions ("three hundred and six", "minus four") are accepted, and "1,5" means 1.5. "1,500" still means one thousand five hundred. |
| 2.5 | Quizzes set before a level change stay on the list. | **Fixed** | Unfinished quizzes for another level are hidden and cannot be started. Finished ones stay in the student's results. |
| 2.6 | "Let them retake" gives the same questions and keeps the first results. | **Fixed** | A retake has new questions of the same kind, and the first attempt is taken out of the student's progress. |
| 2.7 | Deleting a quiz does not remove its progress. | **Fixed** | Deleting a quiz takes its answers out of every student's progress. |
| 2.8 | On a phone the whiteboard and calculator cover the question. | **Fixed (checked at phone size in desktop Chrome)** | On narrow screens the tools use the bottom part of the screen and the page can scroll above them. Each tool has a Hide button. |
| 2.9 | The tool bar covers the bottom of the page. | **Fixed** | The page has room at the bottom for the bar. |
| 2.10 | No "skip to practice" on a phone. | **Fixed** | "Skip to the questions" link at the top of every topic. |
| 2.11 | Printed login slips include the page heading and buttons. | **Fixed (not tested on a printer)** | "Print login slips" prints only the slips. |
| 2.12 | Autosave fails silently when the connection drops. | **Fixed** | A warning stays on screen until saving works again, and it keeps retrying. If Finish cannot be sent, the student is told their answers are still on the page. |
| 2.13 | Double-pressing "Make the quiz" or "Create accounts" makes two. | **Fixed** | A button waiting for the server cannot be pressed again. |
| 2.14 | Whiteboard not cleared between questions; saved work not linked to the question. | **Fixed** | Each new question starts with a clean whiteboard. Saved notes and drawings record the question or quiz question they were made on, and staff see that. |
| 2.15 | "Days of practice" and the activity chart use UTC. | **Fixed** | Days are counted in UK time (tested with an answer at 00:30 BST). |
| 2.16 | Some buttons are smaller than 44 pixels. | **Fixed** | Small buttons, links and back links are at least 44 pixels tall. |
| 2.17 | Wording slips. | **Fixed** | "1 loose one"; bus timetables follow real Cornish routes in order (Truro–Penzance, Falmouth–Bodmin, Newquay–Saltash); custom quizzes are named after their topics. |
| 2.18 | Summer term assessment draws almost entirely on Block 5. | **Fixed** | Half of a Summer term assessment now comes from earlier blocks. A mock exam is still the better Summer check. |
| 2.19 | Starting-point check capped at 30 questions. | **Fixed** | One question per earlier topic, however many there are. |
| 2.20 | Demo mode password printed in the README. | **Fixed** | Demo mode only exists in the local dev server (`npm run demo`). The online platform has no demo data or demo account. |

---

## 3. Not tested

- **Browsers:** only Chrome. Not Safari (iPads), Firefox or Edge.
- **Voices:** the test browser had none. Voice quality, accent and whether iPads need a tap first are unknown.
- **Screen readers:** not tried.
- **Printing:** not on a real printer.
- **Touch drawing:** not with a real finger or stylus.
- **The live Supabase deployment:** the full test suite runs against an in-memory copy of Postgres (PGlite). On the live Supabase project only this has been checked: the API starts, creates its tables, answers from the GitHub Pages address, and the site shows the setup screen. After first-time setup, check a student login, a practice question and a timed quiz on the live site.
- **Many students at once:** Postgres handles many writers, but nothing has been load-tested. The Edge Function uses up to 4 database connections per running copy.
- **Slow connections and school web filters**, which may block `*.supabase.co`, `github.io` or the YouTube player. Ask your IT provider to allow them.
- **The browser screens have no automatic tests in the repository.** `npm test` covers the question bank, the marking rules and the API. The screens were checked by hand in a browser at phone and desktop size.

---

## 4. Content: gaps and quality

All open unless stated. The numbers are unchanged from version 1.

| # | Issue | Status |
|---|---|---|
| 4.1 | Repetition: 20 topics have only one or two question types. | Open |
| 4.2 | Guessing: 27 question types have only two options. | Open |
| 4.3 | Skills tested by choosing, not doing (drawing charts, measuring). | Open |
| 4.4 | Entry Level 1 practical work cannot be done on a screen. | Open (cannot be fixed on screen) |
| 4.5 | Plan sessions with no topic of their own. | Open |
| 4.6 | Level 1 and 2 problem solving is thin (one mark per question). | Open |
| 4.7 | Level 1 borrows some Level 2 questions. | Open |
| 4.8 | Level 1 "represent grouped data graphically" is thin. | Open |
| 4.9 | Lessons are text only; reading age not checked. | Open. Students can now make the text bigger (A / A+ / A++ button). |
| 4.10 | The "watch how" player is not a real video. | Open |
| 4.11 | Typing fractions needs the "/" key. | Open |
| 4.12 | Facts that will go out of date. | **Partly fixed**: dates in questions now use last year, this year and next year. The £12,570 tax-free allowance and hourly pay rates are still written in. |
| 4.13 | Hints vary in quality. | Open |
| 4.14 | My own rules, not an exam board's. | Open |
| 4.15 | "Secure" never wears off. | Open |
| 4.16 | The starting-point check is rough. | Open |

---

## 5. Features staff will probably want

**Added in version 2**
- Extra time per student on timed quizzes (25%, 50% or double), for access arrangements.
- What a student typed: the student page shows their last 30 answers.
- "Who has not logged in this week": a filter on the Students page, and their last-active date is shown in red.
- Staff resetting another staff member's password.
- A record of who changed what (Settings > Activity log).
- Full backup download.

**Still not there**
- Time spent, and progress over time (the readiness figure has no history).
- A printable report for one student.
- Different staff roles. Every staff account sees every student and can change everything.
- Importing students from a spreadsheet, changing a username, moving a whole group up a level.
- Editing a quiz after making it; opening and closing dates; hiding answers until everyone has finished; a pass mark.
- Feedback or targets from staff to a student; rewards or streaks; following the calendar automatically.
- Editing lessons or questions in the browser; uploading your own videos or worksheets; printable practice worksheets.
- A parent or carer login; email; more than one centre; other subjects.

---

## 6. Security and data

Nobody independent has reviewed the security.

| # | Issue | Status |
|---|---|---|
| 6.1 | No HTTPS. | **Fixed**: GitHub Pages and Supabase both use HTTPS. |
| 6.2 | Short student passwords; no two-step login for staff. | Open (student minimum still 4 characters, staff 8). |
| 6.3 | Wrong-password lock forgotten on restart; nothing limits one device trying many usernames. | **Fixed**: locks are kept in the database. One device (IP address) is locked for 15 minutes after 40 wrong passwords in 10 minutes. A student can still be locked out for 5 minutes by someone guessing their username 8 times; staff resetting the password clears it. |
| 6.4 | No record of logins or staff actions. | **Fixed**: staff log-ins, wrong passwords and every staff change are logged for a year (Settings > Activity log). Student log-ins are not logged. |
| 6.5 | Hidden screen-reader labels give away counting and chart answers. | **Fixed**: a label that contains the answer is replaced with "Diagram. Ask a member of staff if you need it described." Screen-reader users lose the description on those questions. |
| 6.6 | Manual backups; database not encrypted. | **Partly fixed**: Supabase encrypts the database on disk. Daily backups need a paid Supabase plan; otherwise use the backup download. |
| 6.7 | Deleting a student is instant and cannot be undone. | **Fixed**: a student must be deactivated before they can be deleted, and the button says it cannot be undone. |
| 6.8 | Node.js's built-in database was "experimental". | **Fixed**: the platform now uses Postgres. |
| 6.9 | No system for upgrading the database. | **Fixed**: the database layout is a numbered list of migrations, applied automatically and recorded in `gf.meta`. |
| 6.10 | *New:* the login token is kept in the browser tab (sessionStorage), not in a cookie the page cannot read. | Open by design: the website and the API are on different addresses. The strict content security policy (no outside scripts) is what protects it. |

---

## 7. Accessibility

- No formal accessibility check has been done.
- **Fixed:** the class overview grid shows a letter (S, C, G, N) in each square, not just a colour.
- **Fixed:** text-size control (A / A+ / A++) in the top bar, remembered on each device.
- Open: no dark mode or coloured overlay.
- Open: "Read it to me" reads tables cell by cell and does not describe diagrams. Picture answer choices are not read out.
- Open: the whiteboard cannot be used with a keyboard.
- Open: English only.

---

## 8. Smaller improvements

- Brand colours and logo: see the note at the end of this file.
- A short daily "number retrieval" starter. Open.
- Offline use or an installable app on tablets. Open.
- The earlier Level 2 only version that lives inside Claude is separate. Retire it or ignore it.

---

## 9. What was tested and passed (version 2)

- `test/content.test.mjs`: every one of the 468 question types built 150 times (70,200 questions) and checked against its own answer, its options and its worked steps. No failures.
- `test/marking.test.mjs`: the new marking rules, hidden labels, 600 quizzes with no repeated question, and the full-length starting-point check.
- `test/api.test.mjs`: about 2,000 checks of the real API against an in-memory Postgres: logins, setup code, permissions, practice on every topic at every level, catch-up, every quiz type at every level, time limits, extra time, retakes, deleting quizzes, notes, idle log-out, staff tools, password recovery, activity log, login locks.
- By hand in Chrome, at phone and desktop size: login, student home, a topic page, "Skip to the questions", a practice question surviving a reload, the whiteboard on a phone, the class overview letters, Settings and the activity log.
