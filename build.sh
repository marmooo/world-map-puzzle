mkdir -p docs
cp -r src/* docs
npx svgo@3.3.2 src/map.svg --precision 0 -o docs/map.svg
drop-inline-css -r src -o docs
minify -r docs -o .
