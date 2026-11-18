import User from "../models/User.js";

const DEMO_EMAIL = "demo@example.com";

let demoUserPromise = null;

function getDemoUser() {
  if (!demoUserPromise) {
    demoUserPromise = User.findOneAndUpdate(
      { email: DEMO_EMAIL },
      { $setOnInsert: { username: "demo_user", passwordHash: "disabled-demo-account" } },
      { upsert: true, returnDocument: "after" },
    )
      .exec()
      .catch((error) => {
        demoUserPromise = null;
        throw error;
      });
  }
  return demoUserPromise;
}

export async function attachDemoUser(req, res, next) {
  req.user = await getDemoUser();
  next();
}