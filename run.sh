#!/usr/bin/env bash
cd backend
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from example. Edit .env if needed."
fi
npm install
npm start
