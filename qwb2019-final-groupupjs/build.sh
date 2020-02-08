#!/bin/bash
# needs depot_tools in the path
# git clone https://chromium.googlesource.com/chromium/tools/depot_tools.git
# export PATH="$PATH:/path/to/depot_tools"

# https://chromium.googlesource.com/chromium/src/+/master/docs/linux_build_instructions.md
fetch --nohooks chromium
cd src
build/install-build-deps.sh
gclient runhooks

# https://www.chromium.org/developers/how-tos/get-the-code/working-with-release-branches
git fetch --tags
git checkout f3ee5ef941cb
gclient sync

gn gen out/Default

pushd v8
git apply ../diff.patch
popd

autoninja -C out/Default chrome#