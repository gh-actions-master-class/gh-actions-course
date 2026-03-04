# installations commands

```bash
npm init -y
npm i @actions/core@1.10.1 --save-exact
npm i @actions/exec@1.1.1 @actions/github@6.0.0 --save-exact

# git checkout -- package-lock.json 
# przywraca plik package-lock.json do wersji z ostatniego commita na bieżącej gałęzi, odrzucając wszystkie niezacommitowane lokalne zmiany w tym pliku.
npm ci
```