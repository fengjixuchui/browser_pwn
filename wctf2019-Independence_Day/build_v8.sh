git checkout c93858abcd73a4632db955392232ba1d1d21c3af
git apply < ../d8-strip-globals.patch
git apply < ../independence.patch
gclient sync
tools/dev/gm.py x64.debug
tools/dev/gm.py x64.release