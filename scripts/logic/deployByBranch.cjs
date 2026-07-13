// const { execSync } = require("child_process");
// const fs = require("fs");
// const path = require("path");
// const { select } = require("@inquirer/prompts");
// const logger = require("../utilities/logger.cjs");

// const templates_builder = require("../templates/firebase/index.cjs");

// const COMMANDS = {
//   git: {
//     branch: {
//       current: "git rev-parse --abbrev-ref HEAD",
//       switch: (branch) => `git switch ${branch}`,
//       check: (actual, compare) => `git diff ${compare}..${actual}`,
//       status: "git status --porcelain",
//       commit: (message) => `git add . && git commit -m ${message}`,
//       push: (actual) => `git push -u origin ${actual}`,
//     },
//   },
//   firebase: {
//     project: {
//       current: "firebase use",
//       switch: (alias) => `firebase use ${alias}`,
//     },
//     deploy: "firebase deploy --only hosting",
//   },
//   vite: {
//     build: "npm run build",
//   },
// };

// const FILE_PATHS = {
//   firebase: {
//     json: path.resolve(__dirname, "../../firebase.json"),
//     app: path.resolve(__dirname, "../../src/services/firebase/app.js"),
//   },
//   constants: {
//     form: path.resolve(__dirname, "../../src/modules/forms/constants.js"),
//   },
// };

// const FIREBASE_ALIAS_BY_ENV = {
//   dev: "dev",
//   prod: "prod",
//   stg: "stg",
// };

// const BRANCHES_BY_ENV = {
//   dev: "dev",
//   stg: "stg",
//   prod: "main",
// };

// const COMPARE_BRANCHES_BY_BRANHC = {
//   dev: "refactor",
//   stg: "dev",
//   prod: "stg",
// };

// async function run() {
//   const which_env = await select({
//     message: "Which env to run?",
//     choices: [
//       {
//         name: "Development",
//         value: "dev",
//       },
//       {
//         name: "Staging",
//         value: "stg",
//       },
//       {
//         name: "Prod",
//         value: "prod",
//       },
//     ],
//   });

//   //* Check if there are changes to commit

//   const isChanged = execSync(COMMANDS.git.branch.status, { encoding: "utf8" });

//   if (isChanged !== "") {
//     //! Stop the deploy if there are changes to commit
//     logger.error(
//       "There are some changes in actual branch. Check, commit and push and try to redeploy"
//     );
//     return;
//   } else {
//     //* Switch to branch to deploy
//     execSync(COMMANDS.git.branch.switch(BRANCHES_BY_ENV[which_env]));
//     //* Check if there are differences between the previous branch
//     const differences = execSync(
//       COMMANDS.git.branch.check(
//         which_env,
//         COMPARE_BRANCHES_BY_BRANHC[which_env]
//       ),
//       { encoding: "utf8" }
//     );
//     if (differences !== "") {
//       //! STOP if there are differences
//       logger.error(
//         `It is not updated with ${COMPARE_BRANCHES_BY_BRANHC[which_env]} branch`
//       );
//       return;
//     } else {
//       //* Continue with deploy
//       logger.box(`Updated with ${COMPARE_BRANCHES_BY_BRANHC[which_env]}`);

//       execSync(
//         COMMANDS.firebase.project.switch(FIREBASE_ALIAS_BY_ENV[which_env])
//       );
//       logger.box("Firebase Project Switched to " + which_env);

//       //* Set templates
//       const new_app_file = templates_builder.build_firebase_app_file(which_env);
//       const new_firebase_json =
//         templates_builder.build_firebase_json(which_env);
//       const new_constants_file =
//         templates_builder.build_form_constants(which_env);

//       fs.writeFileSync(FILE_PATHS.firebase.app, new_app_file);
//       fs.writeFileSync(FILE_PATHS.firebase.json, new_firebase_json);
//       fs.writeFileSync(FILE_PATHS.constants.form, new_constants_file);
//       logger.box("Templates successfully rewritten for " + which_env);

//       //* Build the actual code
//       execSync(COMMANDS.vite.build, { stdio: "inherit" });

//       logger.box("App built");
//     }
//     return;
//   }

//   // execSync(COMMANDS.git.branch.switch(BRANCHES_BY_ENV[which_env]));
// }

// run();
