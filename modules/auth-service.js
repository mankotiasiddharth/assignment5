const mongoose = require("mongoose");
require("dotenv").config();
let Schema = mongoose.Schema;

let companySchema = new mongoose.Schema({
  userName: { type: String, unique: true },
  password: String,
  loginHistory: [{ dateTime: Date, userAgent: String }],
});

let User; // to be defined on new connection (see initialize)

// function initialize() {
//   return new Promise(function (resolve, reject) {
//     const db = mongoose.createConnection(process.env.MONGODB); //creating a connection in mongodb

//     // Handle connection errors
//     db.on("error", (err) => {
//       reject(err); // Reject the promise with an error if the connection fails
//     });

//     db.once("open", () => {
//       User = db.model("users", userSchema); // Set up the User model
//       resolve(); // Resolve the promise to indicate success
//     });
//   });
// }
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
    // Step 1: Check if passwords match
    if (userData.password !== userData.password2) {
      reject("Passwords do not match"); // If not, stop here
      return;
    }
    let newUser = new User({
      userName: userData.userName,
      password: userData.password, // This will be hashed later!
      email: userData.email,
      loginHistory: [], // Start with an empty login history
    });
    newUser
      .save()
      .then(() => {
        resolve(); // Success! User is saved
      })
      .catch((err) => {
        // Check if it’s a "username taken" error
        if (err.code === 11000) {
          reject("User Name already taken");
        } else {
          // Other errors
          reject(`There was an error creating the user: ${err}`);
        }
      });
  });
}
function checkUser(userData) {
  return new Promise((resolve, reject) => {
    User.find({ userName: userData.userName }) //checking if the user is in the list
      .then((users) => {
        if (users.length === 0) {
          reject(`Unable to find user: ${userData.userName}`);
          return;
        }

        // Step 2: Check the password
        const user = users[0];
        bcrypt
          .compare(userData.password, user.password) // Compare entered password with saved password
          .then((isMatch) => {
            if (!isMatch) {
              reject(`Incorrect Password for user: ${userData.userName}`);
              return;
            }

            //updating the detail
            if (user.loginHistory.length === 8) {
              user.loginHistory.pop(); // Erase the oldest entry if full
            }

            user.loginHistory.unshift({
              dateTime: new Date().toString(), // Add the current time
              userAgent: userData.userAgent, // Add info about their device
            });

            //saves the updated info
            User.updateOne(
              { userName: user.userName }, // Find the user to update
              { $set: { loginHistory: user.loginHistory } } // Update their data
            )
              .then(() => {
                resolve(user); // Success! Let it is set and ready to go ahead
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
