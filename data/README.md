# data/

Build-time data baking scripts. Populated by `data` sub-agent in run
`20260501_122446`.

Expected contents (per architect spec §Deployment topology):

- `build.ts` — runs at CI time; outputs published to R2 `static/`
  prefix with content-hashed filenames
- TopoJSON simplification (state + constituency boundaries)
- Historical JSON construction (2019 LS + 2024 LS baselines)
- Search index (constituency name → id, prefix-trie for client-side)
