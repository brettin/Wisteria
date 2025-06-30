#!/bin/bash

source wisteria-web/backend/venv/bin/activate

export PATH="/home/ac.cucinell/miniforge3/envs/wisteria_env/bin/":$PATH

cd wisteria-web/ 
./serve-frontend-only.sh
