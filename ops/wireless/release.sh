#!/bin/bash
# The one way to release the staff app: ops/wireless/release.sh
# Run from the repo root on the development branch.
#
# Refuses to tag unless:
#   - development is committed and pushed (the tag builds what's on GitHub)
#   - every migration in the repo is applied and recorded in production,
#     so the app never ships ahead of the database it depends on
#   - the production database checks pass (ops/wireless/db-checks.sql)
# Then tags the next patch version (v1.10.N+1), which triggers the
# production deploy. That deploy itself re-runs the full CI suite first
# and stops if it fails.
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"
fail() { echo "✗ $*" >&2; exit 1; }

[ "$(git branch --show-current)" = "development" ] || fail "Release from the development branch."

# Build output (out/) and local editor settings aren't part of a release.
if [ -n "$(git status --porcelain -- . ':!out' ':!.claude' ':!wireless-site')" ]; then
  git status --short -- . ':!out' ':!.claude' ':!wireless-site' >&2
  fail "Uncommitted changes (above). Commit or stash them first."
fi

git fetch -q origin development --tags
[ "$(git rev-parse HEAD)" = "$(git rev-parse origin/development)" ] || fail "development isn't pushed (or is behind origin). Push/pull first."
echo "✓ development is committed and pushed ($(git rev-parse --short HEAD))"

ops/wireless/apply-migration.sh --status >/dev/null || {
  ops/wireless/apply-migration.sh --status | grep "NOT RECORDED" >&2 || true
  fail "Migrations above aren't applied in production. Apply them with ops/wireless/apply-migration.sh first."
}
echo "✓ every migration is applied in production"

ops/wireless/apply-migration.sh --check >/dev/null 2>&1 || fail "Production DB checks fail. Run: ops/wireless/apply-migration.sh --check"
echo "✓ production database checks pass"

latest=$(git tag -l 'v*' --sort=-v:refname | head -1)
[ -n "$latest" ] || fail "No existing v* tag to increment."
base=${latest%.*}; patch=${latest##*.}
next="$base.$((patch + 1))"
git tag "$next"
git push -q origin "$next"
echo "✓ tagged $next ($latest → $next); production deploy started"

if command -v gh >/dev/null; then
  sleep 5
  run=$(gh run list --workflow deploy-production.yml --limit 1 --json databaseId --jq '.[0].databaseId')
  gh run watch "$run" --exit-status >/dev/null && echo "✓ $next is live" || fail "Deploy of $next failed: gh run view $run --log-failed"
fi
