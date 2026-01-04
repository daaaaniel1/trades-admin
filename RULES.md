# Trades Admin – Working Rules (Freeze)

1. production/ exists ONLY on the server
   - never committed
   - never renamed
   - never restructured

2. appbackend/ and appfrontend/ are the ONLY git-tracked code
   - no Docker changes without explicit intent
   - no proxy changes without written reason

3. Environment files
   - .env.local → local dev only
   - .env.production → server only
   - never copied between environments

4. Infra changes
   - must be written in INFRA.md first
   - then applied once
   - never re-applied blindly

5. If something works:
   - we stop
   - snapshot
   - then change ONE thing only
