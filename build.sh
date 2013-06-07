
function rewriteManifest {
	node << __EOF__
	var fs = require('fs');
	fs.readFile('Manifest.json', function(err, data) {
		var json = JSON.parse(data);
		json.info.checksum = "$1";
		fs.writeFile('Manifest.json', JSON.stringify(json, null, 2));
	});
__EOF__
}

mkdir dist
rm -f dist/dist.zip

rewriteManifest ""
zip -r dist/dist.zip * -x dist
SHA=`shasum dist/dist.zip`
SHA=${SHA/%  dist\/dist.zip/}
rewriteManifest "$SHA"

git add dist/dist.zip Manifest.json
git commit -m 'building distribution'
git push
