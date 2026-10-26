require("dotenv").config();

const readline = require("node:readline/promises");
const argon2 = require("argon2");
const db = require("../src/config/db");

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const name = (await rl.question("Admin name: ")).trim();
    const email = (await rl.question("Admin email: "))
      .trim()
      .toLowerCase();
    const password = await rl.question("Admin password: ");

    if (!name || !email.includes("@") || password.length < 8) {
      throw new Error(
        "Valid name, email and password (at least 8 characters) required"
      );
    }

    const hash = await argon2.hash(password, {
      type: argon2.argon2id,
    });

    const [existing] = await db.execute(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length) {
      throw new Error("An account with this email already exists");
    }

    const [result] = await db.execute(
      `INSERT INTO users
       (name, email, password_hash, role, is_active)
       VALUES (?, ?, ?, 'admin', 1)`,
      [name, email, hash]
    );

    console.log("Admin created successfully.");
    console.log("Admin user ID:", result.insertId);
  } finally {
    rl.close();
    await db.end();
  }
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exitCode = 1;
});