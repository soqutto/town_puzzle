#!/bin/sh

if [ -e "../bin/activate" ]; then
  source ../bin/activate
fi

python concat_tile.py
