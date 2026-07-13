import app from "./app";
import { getDatabase } from "firebase/database";

const rtdb = getDatabase(app);

export default rtdb;
