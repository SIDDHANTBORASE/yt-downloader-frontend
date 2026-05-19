#!/bin/bash
# Install dependencies and start the backend server

pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
