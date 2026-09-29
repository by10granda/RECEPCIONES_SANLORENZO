import fs from "node:fs";

function parseEnv() {
  const env = new Map();
  const text = fs.readFileSync(".env.local", "utf8");
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index <= 0) continue;
    let value = line.slice(index + 1);
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    env.set(line.slice(0, index), value.replace(/\\n/g, "\n"));
  }
  return env;
}

const baseUrl = process.argv[2] || "http://localhost:3000";
const env = parseEnv();
const admins = [{ username: env.get("ADMIN_USERNAME"), password: env.get("ADMIN_PASSWORD") }, ...JSON.parse(env.get("ADMIN_USERS_JSON") || "[]")].filter((admin) => admin.username && admin.password);

for (const admin of admins) {
  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: admin.username, password: admin.password })
  });
  console.log(`${admin.username}: ${res.status}`);
}
