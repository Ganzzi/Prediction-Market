#!/usr/bin/env bash

# ENVIRONMENT VARIABLES
CONTRACTS_DIR="${CONTRACTS_DIR:=./src}" # Base contract directory 
OUT_DIR="${OUT_DIR:=./deployments}" # Output directory for build files
OUT_DIR_FRONTEND="${OUT_DIR_FRONTEND:=../frontend/src/deployments}" # Output directory for build files

# Store all folder names under `CONTRACTS_DIR` in an array
contracts=()
for d in $CONTRACTS_DIR/* ; do
  if [ -d "$d" ] && [ -f "$d/Cargo.toml" ]; then
    contracts+=($(basename $d))
  fi
done

# Build all contracts
for i in "${contracts[@]}"
do
  echo -e "\nBuilding '$CONTRACTS_DIR/$i/Cargo.toml'…"
  cargo contract build --release --quiet --manifest-path $CONTRACTS_DIR/$i/Cargo.toml

  # build to contracts folder
  # echo "Copying build files to '$OUT_DIR/$i/'…"
  # mkdir -p $OUT_DIR/$i
  # cp ./target/ink/$i/$i.contract $OUT_DIR/$i/
  # cp ./target/ink/$i/$i.wasm $OUT_DIR/$i/
  # cp ./target/ink/$i/$i.json $OUT_DIR/$i/

  # build to frontend folder
  echo "Copying build files to '$OUT_DIR_FRONTEND/$i/'…"
  mkdir -p $OUT_DIR_FRONTEND/$i
  cp ./target/ink/$i/$i.contract $OUT_DIR_FRONTEND/$i/
  cp ./target/ink/$i/$i.wasm $OUT_DIR_FRONTEND/$i/
  cp ./target/ink/$i/$i.json $OUT_DIR_FRONTEND/$i/
done