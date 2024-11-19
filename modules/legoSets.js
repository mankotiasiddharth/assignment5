const setData = require("../data/setData");
const themeData = require("../data/themeData");
let sets = [];
function initialize() {
  return new Promise((resolve, reject) => {
    try {
      sets = setData.map((set) => {
        const theme = themeData.find((theme) => {
          return theme.id === set.theme_id;
        });
        return {
          ...set,
          theme: theme ? theme.name : "Unknown",
        };
      });
      resolve();
    } catch (error) {
      reject("Failed to initialize sets");
    }
  });
}

function getAllSets() {
  return new Promise((resolve, reject) => {
    if (sets) {
      resolve(sets);
    } else {
      reject("Processed Data not Available");
    }
  });
}

function getSetByNum(setNum) {

  return new Promise((resolve, reject) => {
    // console.log(sets);
   console.log(sets)
    const set = sets.find((sub) => sub.set_num === setNum);
    console.log(set)
    if (set) {
      resolve(set);
    } else {
      reject("Not able to fetch sets by set Number");
    }
  });
}

function getSetsByTheme(theme) {
  return new Promise((resolve, reject) => {
    try {
      const themeLower = theme.toLowerCase();
      const matchingSets = sets.filter((set) => set.theme.toLowerCase().includes(themeLower));
      
      // Resolve with matching sets, or an empty array if no sets are found
      resolve(matchingSets);
    } catch (err) {
      reject("Unable to find requested Sets");
    }
  });
}

module.exports = { initialize, getAllSets, getSetByNum, getSetsByTheme };
