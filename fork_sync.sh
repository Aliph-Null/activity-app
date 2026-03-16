#!/bin/bash

UPSTREAM_BRANCH="main"
WORK_BRANCH="my-feature"

echo "Fetching upstream..."
git fetch upstream

echo "Switching to main..."
git checkout $UPSTREAM_BRANCH

echo "Resetting to upstream..."
git reset --hard upstream/$UPSTREAM_BRANCH

echo "Force pushing fork..."
git push origin $UPSTREAM_BRANCH --force

echo "Deleting old work branch (if exists)..."
git branch -D $WORK_BRANCH 2>/dev/null

echo "Creating new work branch..."
git checkout -b $WORK_BRANCH

echo "Pushing new branch..."
git push -u origin $WORK_BRANCH

echo "Done. Ready to work on $WORK_BRANCH"