const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

require("dotenv").config();
let Schema = mongoose.Schema;

let companySchema = new mongoose.Schema({
  userName: { type: String, unique: true },
  password: String,
  loginHistory: [{ dateTime: Date, userAgent: String }],
});

let User; // to be defined on new connection (see initialize)

const initialize = () => {
  return new Promise((resolve, reject) => {
    let db = mongoose.createConnection(process.env.MONGODB);

    db.on("error", (err) => {
      reject(err);
    });

    db.once("open", () => {
      User = db.model("users", companySchema);
      resolve();
    });
  });
};
function registerUser(userData) {
  return new Promise((resolve, reject) => {
    //Check if passwords match
    if (userData.password !== userData.password2) {
      reject("Passwords do not match"); // Stop if passwords don't match
      return;
    }

    //Hash the password using bcrypt
    bcrypt
      .hash(userData.password, 10) // Hash the password with 10 salt rounds
      .then((hashedPassword) => {
        //Create a new user object with the hashed password
        const newUser = new User({
          userName: userData.userName.toLowerCase().trim(), // Normalize username
          password: hashedPassword, // Save the hashed password
          email: userData.email,
          loginHistory: [], // Start with an empty login history
        });

        // Save the user to the database
        return newUser.save();
      })
      .then(() => {
        resolve(); // Success! User is saved
      })
      .catch((err) => {
        // Handle errors
        if (err.code === 11000) {
          reject("User Name already taken"); // Duplicate username
        } else {
          reject(`There was an error creating the user: ${err}`); // Other errors
        }
      })
      .catch(() => {
        reject("There was an error encrypting the password"); // Error during hashing
      });
  });
}

function checkUser(userData) {
  return new Promise((resolve, reject) => {
    User.findOne({ userName: userData.userName.toLowerCase().trim() })
      .then((user) => {
        if (!user) {
          reject(`Unable to find user: ${userData.userName}`);
          return;
        }

        bcrypt
          .compare(userData.password, user.password)
          .then((isMatch) => {
            if (!isMatch) {
              reject(`Incorrect Password for user: ${userData.userName}`);
              return;
            }

            if (user.loginHistory.length === 8) {
              user.loginHistory.pop(); // Remove the oldest entry
            }

            user.loginHistory.unshift({
              dateTime: new Date().toString(),
              userAgent: userData.userAgent,
            });

            User.updateOne(
              { userName: user.userName },
              { $set: { loginHistory: user.loginHistory } }
            )
              .then(() => {
                resolve(user);
              })
              .catch((err) => {
                reject(`There was an error verifying the user: ${err}`);
              });
          })
          .catch((err) => {
            reject(`Error comparing passwords: ${err}`);
          });
      })
      .catch((err) => {
        reject(`Unable to find user: ${userData.userName}`);
      });
  });
}

module.exports = { initialize, registerUser, checkUser };
