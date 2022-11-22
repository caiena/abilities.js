# Releasing

## setup

- `npm install -g npm@9.1.2`
- `npm install`
- `npm run build`
- `npm run test`


## pre-testing

- `npm run build`
- `bin/console`
  - enter the node REPL and interact with `abilities`, available globally
  - sample: `TODO: script` should output `TODO: output`


## publishing

- edit `package.json`, bumping version
- `git commit -m "v1.2.3"`
- `git tag ${git_tag}`
- `git push upstream ${release_branch}`
- `git push upstream --tags`
- `gh release create ${git_tag} --prerelease --generate-notes`
- `npm publish --access=public`
- check on https://www.npmjs.com/settings/caiena/packages
