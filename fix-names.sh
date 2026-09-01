#!/bin/bash
# Fix names back to original Next.js format
find . -type d -name "_id_" -exec bash -c 'mv "$1" "$(dirname "$1")/[id]"' _ {} \;
find . -type d -name "_dashboard_" -exec bash -c 'mv "$1" "$(dirname "$1")/(dashboard)"' _ {} \;
find . -type d -name "_auth_" -exec bash -c 'mv "$1" "$(dirname "$1")/(auth)"' _ {} \;
echo "Fixed!"
