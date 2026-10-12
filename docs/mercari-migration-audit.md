# Mercari → MTB migration audit (2026-10-12)

## Safety
- Main branch unchanged. Audit and future implementation must be validated on this feature branch.
- App uses localStorage key `mstb_products_v3`; `DATA_VERSION=408`. Changing version can reset local edits to `products.json`. Before rollout, add backup/export and migration preserving local edits.
- `products.json` has 173 records; 12 have `mercariId`.
- `mercari-state.json` has 15 records, lastMercariSync = 2026-09-06T12:56:00+09:00, but app.js does not directly fetch this file. Do not assume this is live sync.
- Item identification must use Mercari source listing ID + draft ID, never title alone.
- Null purchase price or shipping should remain null, not zero.
- Never publish or change prices automatically in migration.

## First five (photos currently absent in drafts)
| Source ID | Draft ID | Item | Existing MTB candidate | Verification |
|---|---:|---|---|---|
| m31882910473 | 657353490 | Big Bird | p017 | Need exact product match |
| m19951188924 | 239854698 | Mickey/Minnie 2-pack | p012 | Need exact product match |
| m42309067444 | 89086746 | Nami Wanted Poster | none found by name | Needs item-level check |
| m57552799828 | 359981448 | Usopp Wanted Poster | none found by name | Needs item-level check |
| m24633374658 | 1356464293 | Winnie the Pooh cherry blossom flocked | p008 | Need variant verification |

## Proposed workflow
1. Prepare audit manifest JSON for five source/draft pairs, image URLs and status fields.
2. Implement non-destructive audit in app or external tool (read-only first): exact Mercari ID match → confirmed product variant → human review when ambiguous.
3. Test image retrieval using iPhone Shortcuts (download URLs); Working Copy can store manifest and pulled files but does not itself execute remote iPhone shortcuts.
4. Test Mercari upload separately: photos must be uploaded to pre-signed URL; `upsert_draft(photo_paths)` replaces all photos. Retrieve existing photo_paths and merge, max 20.
5. After confirming upload feasibility, add explicit transfer steps and verification per draft.
6. Sync validated records with MTB without resetting browser-local edits; take backup first.

## Suggested manifest fields
`sourceMercariId`, `draftId`, `mtbId`, `title`, `price`, `photoSourceUrls`, `uploadedPhotoPaths`, `photoStatus`, `mtbStatus`, `verifiedAt`, `error`.

## Not yet done
No draft photos added in this audit, no MTB records modified, no live listing published.
