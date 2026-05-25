#!/bin/bash
# Ensure node/npm/npx are available for Turbopack's child processes
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
cd "$(dirname "$0")/.."
exec /usr/local/bin/node ./node_modules/.bin/next dev --port 3000
