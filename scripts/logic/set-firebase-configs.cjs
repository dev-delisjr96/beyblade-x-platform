const path = require("path");
const fs = require("fs");
const { select } = require("@inquirer/prompts");
const LOGGER = require("../utilities/logger.cjs");
const templates = require("../templates/firebase/index.cjs");
const firebase_configs_templates = require("../templates/firebase/configs.cjs");
const { loadEnv } = require("vite");
const { execSync } = require("child_process");

const SRC = path.resolve(__dirname, "../../src");
const ROOT = path.resolve(__dirname, "../../");
const ENV_FILE = path.resolve(__dirname, "../../.env");

const DIRS = {
  firebase: path.join(SRC, "modules/hiring/v1/firebase.js"),
  firebase_json: path.join(ROOT, "/firebase.json"),
};

const envs_files = {
  dev: path.join(ROOT, "/.env.dev"),
  stg: path.join(ROOT, "/.env.prod"),
  prod: path.join(ROOT, "/.env.prod"),
};

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, "utf8");
  LOGGER.box(
    `Created: ${path.relative(path.resolve(__dirname, "../../"), filePath)}`,
  );
}

async function overwriteFile(sourceFilePath, destinationFilePath) {
  fs.copyFileSync(sourceFilePath, destinationFilePath);
}

const ENVS = loadEnv(
  process.env.NODE_ENV || "development", // mode
  process.cwd(), // root (where .env lives)
  "", // prefix — '' loads ALL vars, 'VITE_' loads only VITE_ ones
);

// const FIREBASE_CONFIGS = {
//   apiKey: ENVS.VITE_FIREBASE_API_KEY,
//   authDomain: ENVS.VITE_FIREBASE_AUTH_DOMAIN,
//   databaseURL: ENVS.VITE_FIREBASE_DATABASE_URL,
//   projectId: ENVS.VITE_FIREBASE_PROJECT_ID,
//   storageBucket: ENVS.VITE_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: ENVS.VITE_FIREBASE_MESSAGING_SENDER_ID,
//   appId: ENVS.VITE_FIREBASE_APP_ID,
// };

async function run() {
  const environment_selection = await select({
    message: "Environment to set:",
    choices: [
      { name: "Development", value: "dev" },
      { name: "Staging", value: "stg" },
      { name: "Production", value: "prod" },
    ],
  });

  // Set env file
  await overwriteFile(envs_files[environment_selection], ENV_FILE);

  const ENVS = loadEnv(
    process.env.NODE_ENV || "development", // mode
    process.cwd(), // root (where .env lives)
    "", // prefix — '' loads ALL vars, 'VITE_' loads only VITE_ ones
  );

  const FIREBASE_CONFIGS = {
    apiKey: ENVS.VITE_FIREBASE_API_KEY,
    authDomain: ENVS.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: ENVS.VITE_FIREBASE_DATABASE_URL,
    projectId: ENVS.VITE_FIREBASE_PROJECT_ID,
    storageBucket: ENVS.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: ENVS.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: ENVS.VITE_FIREBASE_APP_ID,
  };

  console.log("FIREBASE", FIREBASE_CONFIGS.authDomain);

  const build_firebase_file = templates.APP_INIT(FIREBASE_CONFIGS);

  fs.writeFileSync(DIRS.firebase, build_firebase_file);

  let hosting_selection = environment_selection;

  if (environment_selection === "dev") {
    hosting_selection = await select({
      message: "Hosting to deploy to:",
      choices: Object.entries(firebase_configs_templates.SITES_BY_ENV).map(
        function ([env, site]) {
          return { name: site, value: env };
        },
      ),
    });
  }

  console.log("hosting selected", hosting_selection);

  const build_firebase_config_file =
    firebase_configs_templates.CONFIGS(hosting_selection);

  fs.writeFileSync(DIRS.firebase_json, build_firebase_config_file);

  execSync(`firebase use ${environment_selection}`);

  LOGGER.box("Firebase set");

  return;
}

run();
