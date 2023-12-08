# How to Clone

1. Make sure that node (latest version) and npm is installed
2. Clone this project into a repository
3. Run `npm install` to install all the packages in `packages.json`
5. To load a live version of the app, run `npm start run`
6. To only build, run `run start build`

# Firebase CLI

1. Run `npm install -g firebase-tools` to install the CLI globally
2. Login using `firebase login` with your own google account - @benjamin.tran will add you
3. Run `firebase projects:list` to verify you have access to `uqrl-website` 

## Testing & Deploying Locally
DO NOT EVER MANUALLY DEPLOY! ONLY DEPLOY THROUGH GITHUB.

To test ("deploy") locally, run
```firebase emulators:start```

Follow the terminal commands or go to `localhost:4000` for more info.

## Merging to Develop & Main

Merge all except hotfixes to develop before merging to main. In order to merge, it must automatically pass the testing pipeline set up. This pipeline also has a preview website. You should examine this website before accepting the merge request.

Feature-Specific Branches: Is for prototyping and developing code. Is not expected to be functional or correct.
Develop Branch: IS FOR FUNCTIONAL CODE. Once a feature (or part of a feature) has been completed it can be merged into this branch.
Main Branch: IS FOR COMPLETE AND PRODUCTION-READY CODE. Once an entire set of feature have been developed to form a functional behaviour in the *develop* branch, merge it to main. Requires pipeline success and secondary approval.

## Directory Listing


- build (not in source code, built when deployed): the built website files

- extensions: firebase extensions

- functions: firebase functions in NodeJS

- node_modules: the modules required for the React App

- public: the public portions of the react app. Note that this is not the same as firebase public

- src: the dynamic portions of the react app.

- .firebaserc: contains the deploy site

- .firebase.json: contains configuration information for firebase

- firestore.indexes.json: contains the indexes for firestore

- firestore.rule: contains the firestore rules

- remoteconfig.template.json: contains remote configuration templates

- storage.rules: contains security rules for storage

## Help
To learn React, check out the [React documentation](https://reactjs.org/).

For firebase, check out the [Documentation](https://firebase.google.com/docs).