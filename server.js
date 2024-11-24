/********************************************************************************
 * WEB322 – Assignment 05
 *
 * I declare that this assignment is my own work in accordance with Seneca's
 * Academic Integrity Policy:
 *
 * https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
 *
 * Name: Kunwar Siddharth Mankotia Student ID: 152030227 Date: 11/19/2024
 *
 * Published URL:
 *
 ********************************************************************************/

const express = require("express");
require("dotenv").config();
const legoData = require("./modules/legoSets");
const app = express();
app.set("view engine", "ejs");
const PORT = process.env.PORT || 2004;
app.use(express.static("public"));
const path = require("path");
const { homedir } = require("os");
const authData = require("./modules/auth-service");
const clientSessions = require("client-sessions");
require("pg"); // explicitly require the "pg" module
app.use(express.urlencoded({ extended: true })); // Middleware for form data
const { getAllThemes, addSet } = require("./modules/legoSets");

app.set("views", __dirname + "/views");
legoData
  .initialize()
  .then(authData.initialize)
  .then(() => {
    app.use(express.static(path.join(__dirname, "/public")));

    app.get("/", (req, res) => {
      res.render("home");
    });
    app.get("/about", (req, res) => {
      // res.sendFile(path.join(__dirname,'/public/views/about.html'))
      res.render("about");
    });
    app.get("/lego/sets", (req, res) => {
      const { theme } = req.query;
      if (theme) {
        legoData
          .getSetsByTheme(theme)
          .then((sets) => {
            if (sets.length === 0) {
              res.status(404).render("404", {
                message: `No sets found for theme "${theme}".`,
              });
            } else {
              res.render("sets", { sets });
            }
            // res.json(set);
          })
          .catch((err) => {
            res.status(500).render("404", {
              message: `No sets found for theme "${theme}".`,
            });
          });
      } else {
        legoData
          .getAllSets()
          .then((sets) => {
            res.render("sets", { sets });
          })
          .catch((err) => {
            res.status(500).send(err);
          });
      }
    });

    app.get("/lego/sets/:numId", (req, res) => {
      const { numId } = req.params;

      legoData
        .getSetByNum(numId)
        .then((set) => {
          if (!set) {
            res.status(404).render("404", {
              message: `Lego set with number "${numId}" not found.`,
            });
          } else {
            res.render("set", { set });
          }
        })
        .catch((err) => {
          res.status(404).render("404", {
            message: `Lego set with number "${numId}" not found.`,
          });
        });
    });

    app.get("/lego/addSet", ensureLogin, (req, res) => {
      getAllThemes()
        .then((themes) => {
          res.render("addSet", { themes }); // Pass the themes to the view
        })
        .catch((err) => {
          res.render("500", {
            message: `I'm sorry, but we have encountered the following error: ${err}`,
          });
        });
    });

    app.post("/lego/addSet", ensureLogin, (req, res) => {
      const setData = req.body; // Extract form data from the request body

      addSet(setData)
        .then(() => {
          res.redirect("/lego/sets"); // Redirect to the sets page on success
        })
        .catch((err) => {
          res.render("500", {
            message: `I'm sorry, but we have encountered the following error: ${err}`,
          });
        });
    });

    app.get("/lego/editSet/:num", (req, res) => {
      const setNum = req.params.num;

      Promise.all([legoData.getSetByNum(setNum), legoData.getAllThemes()])
        .then(([set, themes]) => {
          res.render("editSet", { set, themes });
        })
        .catch((err) => {
          res.status(404).render("404", { message: `Error: ${err.message}` });
        });
    });

    app.post("/lego/editSet", ensureLogin, (req, res) => {
      const { set_num, ...setData } = req.body;

      legoData
        .editSet(set_num, setData)
        .then(() => {
          res.redirect("/lego/sets");
        })
        .catch((err) => {
          res.render("500", { message: `Error: ${err.message}` });
        });
    });
    app.get("/lego/deleteSet/:num", ensureLogin, (req, res) => {
      const setNum = req.params.num;

      legoData
        .deleteSet(setNum)
        .then(() => {
          res.redirect("/lego/sets");
        })
        .catch((err) => {
          res.render("500", { message: `Error: ${err.message}` });
        });
    });

    function ensureLogin(req, res, next) {
      if (!req.session.user) {
        // If there's no user in the session, redirect them to the login page
        res.redirect("/login");
      } else {
        // If the user is logged in, continue to the next step
        next();
      }
    }

    app.use((req, res, next) => {
      res.status(404).render("404", {
        message: "I'm sorry, we're unable to find what you're looking for",
      });
    });
    app.use(
      clientSessions({
        cookieName: "session", // this is the object name that will be added to 'req'
        secret: "o6LjQ5EVNC28ZgK64hDELM18ScpFQr", // this should be a long un-guessable string.
        duration: 24 * 60 * 60 * 1000,
        activeDuration: 1000 * 60 * 5,
      })
    );
    app.use((req, res, next) => {
      res.locals.session = req.session; // Pass the session object to templates
      next(); // Go to the next middleware or route
    });

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  });
