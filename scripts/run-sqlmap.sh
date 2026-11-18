#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-http://localhost:3000}"
OUTPUT_DIR="${2:-reports/sqlmap}"

rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

sqlmap \
  -u "$TARGET/products/search?q=mouse" \
  -p q \
  --batch \
  --dbms=PostgreSQL \
  --technique=BEU \
  --level=2 \
  --risk=1 \
  --flush-session \
  --disable-coloring \
  --output-dir="$OUTPUT_DIR" \
  | tee "$OUTPUT_DIR/sqlmap-console.txt"

injection_log=$(find "$OUTPUT_DIR" -type f -name log -size +0 | head -n 1)

if [[ -n "$injection_log" ]]; then
  echo "::error::sqlmap found an injectable parameter"
  cat "$injection_log"
  exit 1
fi

echo "sqlmap found no injectable parameters"
