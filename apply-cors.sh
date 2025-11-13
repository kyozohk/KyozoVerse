#!/bin/bash

# Authenticate with Google Cloud (if not already authenticated)
gcloud auth login

# Set the project
gcloud config set project kyozoverse

# Apply CORS configuration
gsutil cors set cors.json gs://kyozoverse.appspot.com

# Verify CORS configuration
gsutil cors get gs://kyozoverse.appspot.com

echo "CORS configuration applied successfully!"
