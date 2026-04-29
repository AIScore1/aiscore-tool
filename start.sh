#!/bin/bash
# AI Score — Start the internal tool

set -a
source .env.local
set +a

echo "🚀 Starting AI Score..."
npm run dev
