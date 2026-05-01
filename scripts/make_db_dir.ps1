#### Berkeley's stupid shell scripting'
Push-Location .
cd ..

if (-not (Get-ChildItem | Where-Object { $_.Name -match '\bdb\b' })) {
	mkdir db
} else {
	echo "/db directory already exists :) "
}
Pop-Location
