const APP_INIT = (configs) => `
import { initializeApp } from "firebase/app";
import { setPersistence, signInWithEmailAndPassword, browserSessionPersistence, getAuth } from "firebase/auth";

const firebaseConfig = {"apiKey":"${configs.apiKey}",\n"authDomain":"${configs.authDomain}",\n"databaseURL":"${configs.databaseURL}",\n"projectId":"${configs.projectId}",\n"storageBucket":"${configs.storageBucket}",\n"messagingSenderId":"${configs.messagingSenderId}",\n"appId":"${configs.appId}"\n};

const APP = initializeApp(firebaseConfig, "${configs.projectId}")
const AUTH = getAuth(APP);

async function authenticate(){
  await signInWithEmailAndPassword(AUTH, "admin@doona.com", "FiloWebPages2024!!")
    .then( () => {
      console.log("Logged in")
    })

  setPersistence(AUTH, browserSessionPersistence)
    .then(() => {
      return signInWithEmailAndPassword(AUTH, "admin@doona.com", "FiloWebPages2024!!")
    })
}

( async () => {
  authenticate()
})()

export default APP;
`;
module.exports.APP_INIT = APP_INIT;
