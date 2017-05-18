#!/usr/bin/env bash

set -e
cd `dirname $0`

if [ -z "$2" ]; then
    CMD=deploy
else
    CMD="$2"
fi

if [ -d .deploy/$1 ]; then
#    echo `[ -d .deploy/$1 ]`

    cd .deploy/$1
    mupx $CMD "$3" "$4"
    exit
fi
if [ -d .deploy/.deploy_$1 ]; then
    cd .deploy/.deploy_$1
    mupx $CMD "$3" "$4"
fi
