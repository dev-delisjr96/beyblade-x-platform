const SITES_BY_ENV = {
  preview: "preview-doona-hiring",
  dev: "doona-hiring-dev",
  stg: "doona-hiring-stg",
  prod: "doona-hiring-prod",
};

module.exports.SITES_BY_ENV = SITES_BY_ENV;

const CONFIGS = (env) => `{
  "hosting": {
    "public": "dist",
    "site": "${SITES_BY_ENV[env]}",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}`;

module.exports.CONFIGS = CONFIGS;
