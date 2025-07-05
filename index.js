import { login } from "./src/login.js";
import { getListenHistory } from "./src/history.js";
import { saveHistory } from "./src/db.js";

const email = process.env.EMAIL;
const password = process.env.PASS;

(async () => {
  const token = await login(email, password);
  const history = await getListenHistory(token);
  const savedHistory = saveHistory(history);

  console.log("History saved successfully.");
  console.log("History synced:", history.episodes.length);
  console.log("History local size:", savedHistory.episodes.length);
})();
