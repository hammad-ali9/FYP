# 360° Multi-View Try-On — CatVTON on Colab

VirtualFit's try-on engine is **CatVTON** (ICLR 2025), hosted on a free Google
Colab **T4 GPU** and reached from the Flask backend over a tunnel. We approximate
the MV-Fashion 360° look by running CatVTON **once per captured body view**
(front / left / right / back) and assembling the results into a rotatable viewer.

> Why not MV-VTON? Its diffusion model needs a *precomputed warped garment*
> (`warp_feat`) produced by a flow net whose weights are never released, and the
> only source of that data is the gated MVG dataset (institutional email required).
> So true cross-view MV-VTON is not runnable on custom photos. CatVTON per-view is
> the achievable path. See `memory/virtualfit-tryon-direction.md`.

## 1. Start the Colab server

1. Open `colab/catvton_server.ipynb` in Google Colab.
2. **Runtime → Change runtime type → T4 GPU**.
3. Run all cells top-to-bottom. First run downloads ~6 GB of weights.
4. The last cell prints a public URL like `https://xxxx.trycloudflare.com`.
   **This URL changes every Colab session.**

Endpoints exposed: `GET /health`, `POST /tryon`.

## 2. Point VirtualFit at the server

Either set the env var before starting Flask:

```bash
# backend/.env
TRYON_API_URL=https://xxxx.trycloudflare.com
```

…or set it at runtime (no restart) — handy because the URL changes each session:

```bash
curl -X POST http://localhost:5000/api/tryon/server \
  -H "Content-Type: application/json" \
  -d '{"url": "https://xxxx.trycloudflare.com"}'
```

`GET /api/tryon/server` returns the current URL and a live health check.

## 3. Garment images

Each product can have a **front** and a **back** image (Inventory form → *Front
Image URL* / *Back Image URL*, or the `back_image_url` field / `back_image`
upload). The back image is used for the BACK view; the front image for the
others. If no back image is set, the front image is reused for all views.

Run the DB migration once to add the column:

```bash
cd backend && flask db upgrade
```

## 4. Performance (measured on T4)

| Steps | Per view | 4 views (360) | Peak VRAM |
|------:|---------:|--------------:|----------:|
| 20    | ~50 s    | ~3.3 min      | ~5.3 GB   |
| 30    | ~67 s    | ~4.5 min      | ~5.3 GB   |
| 50    | ~110 s   | ~7.5 min      | ~5.3 GB   |

Backend default is **30 steps** (`steps` is overridable in the
`/api/tryon/generate_multiview` request). Generation is sequential — one tunnel
call per captured view.

## API: `POST /api/tryon/generate_multiview`

```json
{
  "person_images": { "front": "<base64>", "back": "<base64>",
                      "left": "<base64>", "right": "<base64>" },
  "garment_front": "/uploads/shirt_front.jpg",
  "garment_back":  "/uploads/shirt_back.jpg",
  "clothing_type": "upper",
  "steps": 30
}
```

Response: `{ "success": true, "results": { "front": "data:image/png;base64,...", ... },
"timings": { ... }, "errors": { ... } }`. Only captured views are processed;
one failed view does not abort the others.
