mkdir -p docs
cp -r src/* docs
svgo src/map.svg -o docs/map.svg
drop-inline-css -r src -o docs
minify -r docs -o .
