# VirtualFit / Drape — Presentation Guide

> One naming note first: the file `catvton_engine.py` is named for an older model.
> **The model you actually use now is IDM-VTON.** Same file, upgraded model. If asked,
> say: *"We started with CatVTON, upgraded to IDM-VTON for better quality; the client
> file kept its old name."*

---

## 1) GARMENT OVERLAY ENGINE — "how the clothes get put on the person"

**Where it lives**
- `src/pages/TryOn.jsx` — the try-on screen (UI). Garment selection, camera, capture of 4
  body views (front/back/left/right), and `handleVirtualTryOn()` which sends everything to the backend.
- `backend/app/routes/tryon.py` — the API: `/generate_multiview` builds the ordered garment
  list (shirt then pant) and calls the engine.
- `backend/app/utils/catvton_engine.py` — `tryon_outfit()` runs the overlay **once per body
  view, per garment** and talks to the AI server.
- `backend/app/utils/gesture_engine.py` + `hand_tracking.py` — the **live camera overlay** with
  hand-gesture control (pick a garment by pointing, hands-free).
- `src/components/OutfitViewer3D.jsx` (image turntable) and `MeshViewer.jsx` (real 3D mesh).

**Say it simply:** *"The user selects a shirt/pant, we capture front, back, left, right from the
camera, and for each view the AI 'inpaints' the chosen garment onto the body — keeping the face,
pose and background — then we show the four results as a 360° look (and an optional 3D model)."*

**Key point:** the overlay is **not** manual image-pasting. The garment region of the body is
**masked**, and the AI **generates** the new garment into that region so it drapes/folds realistically.

---

## 2) AI MODEL INTEGRATION — "which AIs, and what each does"

You integrate **several AI models**, each with one job:

| Model | File | Job (simple) |
|---|---|---|
| **IDM-VTON** (diffusion try-on) | `catvton_engine.py` → Colab GPU | The star. Person photo + garment → photoreal person wearing it |
| **MediaPipe Hands** | `hand_tracking.py` | Reads hand landmarks → hands-free gesture control |
| **MediaPipe Pose** | `pose_analyzer.py` | Checks the person is standing correctly before each capture |
| **Groq LLM** | `narrator.py` | Writes the friendly spoken steps ("now turn left") |
| **TripoSR** | Colab | Turns the 2D result into a rotatable 3D model |
| **OpenPose + Human-Parsing + DensePose** | inside IDM-VTON | Find body pose & regions so the garment lands in the right place |

**Where the heavy AI runs:** on a **Google Colab GPU (NVIDIA L4)** in the cloud, reached through a
secure tunnel. Your laptop backend just **orchestrates** (sends images, gets results). The light AIs
(hands, pose) run **on the CPU in real time**.

**Say it simply:** *"Gesture and pose AI run live on the device. The photoreal try-on is a diffusion
model (IDM-VTON) on a cloud GPU — it takes ~20 seconds per render."*

---

## 3) PRIVACY & DATA DELETION — "we don't keep the customer's photos"

**The privacy story (your strongest point):**
- The **customer's camera photos are NOT stored on the server.** They're captured, sent to the AI
  for processing, the result is returned, and nothing is written to disk — **ephemeral / in-memory.**
- The **only images stored** are the **merchant's own product/garment catalog** (`UPLOAD_FOLDER`) —
  that's shop data, not customer data.
- **Analytics** (`try_on_sessions`, `try_on_events`) store **anonymous counts only** — which product
  was viewed and for how long. **No images, no names.**
- **Passwords are hashed** (`werkzeug generate_password_hash`) — never stored in plain text. Logins
  use **JWT tokens**.

**Deletion endpoints (already built):**
- `DELETE /api/products/<id>` — hard-delete a product (`products.py`)
- `DELETE /api/outlets/<id>` — **soft-delete** an outlet (sets `is_active = False`, `outlets.py`)
- `DELETE /api/subscriptions/<id>/cards/<id>` — remove a saved card

**Say it simply:** *"We're privacy-first: customer try-on photos are processed and discarded, never
saved. We store only the shop's catalogue and anonymous usage counts. Passwords are hashed, sessions
use JWTs, and merchants can delete their products and accounts."*

---

## IF THE PANEL ASKS YOU TO MAKE A CHANGE — where to do it

| They ask… | Do this |
|---|---|
| "Make the try-on faster / lower quality" | `backend/app/routes/tryon.py` → `steps` (default 30 → e.g. 20). Fewer steps = faster. |
| "Change a button/text/colour on a page" | The matching file in `src/components/` or `src/pages/` (e.g. `Hero.jsx`, `TryOn.jsx`). |
| "Change the spoken instruction text" | `backend/app/utils/narrator.py` → the `fallbacks` dictionary. |
| "Add a delete button for a product" | Already exists: `productsAPI.delete(id)` in `src/services/api.js` → `DELETE /api/products/<id>`. |
| "Add a 'delete my session data' endpoint" | Add a `DELETE` route in `backend/app/routes/sessions.py` (copy the products delete pattern). |
| "Support a new garment type (e.g. dress)" | `clothing_type` is passed through `tryon.py`; the Colab maps `upper/lower/dresses`. |
| "Show that passwords aren't plain text" | `backend/app/models/outlet.py` → `password_hash`; seeding uses `generate_password_hash`. |
| "Point the app at a different backend" | `runtime-config.js` (`window.__API_BASE__`) — no rebuild. |

> Tip: for any *live* edit, change **one obvious thing** (a number or a text string), save, and refresh —
> Vite hot-reloads the frontend; the backend you restart with `python run.py`.

---

## LIKELY QUESTIONS + SIMPLE ANSWERS

**Q: How does the AI actually put the clothes on the person?**
It's a **diffusion model**. It starts from random noise in the clothing area and, step by step, removes
the noise into a realistic garment — guided by the garment image and the body's pose. The face,
background and body stay; only the clothing region is repainted ("inpainting").

**Q: What is a diffusion model, in one line?**
A model that learned to turn noise into images; we guide it with the person + garment so it "imagines"
that person wearing that garment.

**Q: Did you train the model yourself?**
We use the pretrained **IDM-VTON** and have a **LoRA fine-tuning notebook** to adapt it to our own
dataset (small trainable adapters, not the whole model — fits one GPU). *(Only say "fine-tuned" if you
actually ran it; otherwise say "we built the fine-tuning pipeline and can adapt it to our data.")*

**Q: Is it real-time?**
The camera, hand gestures and pose checks are **real-time** (on-device). The photoreal render takes
**~20 seconds** on the cloud GPU per view.

**Q: Where does it run / what if there's no GPU?**
The heavy model needs a GPU, so it runs on a **cloud GPU (Colab L4)** reached via a tunnel; the laptop
just sends/receives. Without the GPU server, the lightweight features still work.

**Q: How do you handle user privacy?**
Customer photos are **never stored** — processed and discarded. Only the shop's catalogue + anonymous
usage counts are kept. Passwords hashed, JWT auth, deletion endpoints for merchant data.

**Q: Why is it accurate (clothes land in the right place)?**
Before rendering we compute **pose (OpenPose), body-part map (human parsing) and a 3D body map
(DensePose)**, so the model knows exactly where the torso/arms/legs are.

**Q: Frontend / backend / database stack?**
React + Vite frontend, Flask + SQLAlchemy backend, **Supabase Postgres** database, AI on Colab GPU.

**Q: What was the hardest part?**
Running the heavy model on limited hardware (cloud GPU + tunnels), building correct body-conditioning,
and keeping the whole pipeline (gestures → capture → AI → 3D) smooth.
