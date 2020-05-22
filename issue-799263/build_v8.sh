git reset --hard 48d436b2ed3b4c6436e381a14114e508c84d22e3
gclient sync
tools/dev/v8gen.py x64.release
ninja -C out.gn/x64.release d8
tools/dev/v8gen.py x64.debug
ninja -C out.gn/x64.debug d8