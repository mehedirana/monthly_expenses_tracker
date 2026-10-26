const argon2 = require("argon2");
const db = require("../config/db");

async function login(req, res) {
    try {
        const email = String(req.body?.email || "")
            .trim()
            .toLowerCase();

        const password = req.body?.password;

        if (!email || typeof password !== "string" || !password) {
            return res.status(400).json({
                message: "Email and password are required",
            });
        }

        const [rows] = await db.execute(
            `SELECT id, name, email, password_hash, role
       FROM users
       WHERE email = ? AND is_active = 1
       LIMIT 1`,
            [email]
        );

        const user = rows[0];

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        const valid = await argon2
            .verify(user.password_hash, password)
            .catch(() => false);

        if (!valid) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        req.session.regenerate((error) => {
            if (error) {
                console.error("SESSION REGENERATE ERROR:", error);

                return res.status(500).json({
                    message: "Session creation failed",
                });
            }

            req.session.userId = user.id;
            req.session.role = user.role;

            req.session.save((saveError) => {
                if (saveError) {
                    return res.status(500).json({
                        message: "Session save failed",
                    });
                }

                return res.json({
                    message: "Login successful",
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                    },
                });
            });
        });
    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
}

async function me(req, res) {
    try {
        const [rows] = await db.execute(
            `SELECT id, name, email, role
       FROM users
       WHERE id = ? AND is_active = 1
       LIMIT 1`,
            [req.session.userId]
        );

        if (!rows.length) {
            return res.status(401).json({
                message: "Account unavailable",
            });
        }

        return res.json({ user: rows[0] });
    } catch (error) {
        console.error("Current user error:", error);

        return res.status(500).json({
            message: "Internal server error",
        });
    }
}

function logout(req, res) {
    req.session.destroy((error) => {
        if (error) {
            return res.status(500).json({
                message: "Logout failed",
            });
        }

        res.clearCookie("expenseflow.sid", {
            path: "/",
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
        });

        return res.json({
            message: "Logout successful",
        });
    });
}

module.exports = {
    login,
    me,
    logout,
};