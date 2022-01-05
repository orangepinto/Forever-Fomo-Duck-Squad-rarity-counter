const superagent = require("superagent");
const fs = require("fs");

async function main() {
  // Uncomment to download.
  // const ducks = await getDuckList();
  // fs.writeFileSync("./data/ducklist.json", JSON.stringify(ducks));

  // Read already downloaded data
  const ducks = JSON.parse(fs.readFileSync("./data/ducklist.json"));
  const traitFrequencies = listTraits(ducks);
  const score = computeDuckScore(ducks, traitFrequencies);
  makeDuckScoreCSV(ducks, score);
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function getDuckList() {
  const duckList = [];
  for (let i = 0; i < 8090; i++) {
    try {
      const response = await superagent.get(
        `https://www.highstreet.market/api/FFDS/${i}`
      );
      console.log(i, response.statusCode);
      duckList.push(response.body);
    } catch (e) {}
    await sleep(100);
  }
  return duckList;
}

function listTraits(duckList) {
  const traitsFreq = {};

  for (const duck of duckList) {
    for (const trait of duck.attributes) {
      const tt = trait.trait_type;
      const tv = trait.value;
      if (!traitsFreq[tt]) {
        traitsFreq[tt] = {};
        traitsFreq[tt]._total = 0;
      }

      traitsFreq[tt]._total = traitsFreq[tt]._total + 1;
      if (!traitsFreq[tt][tv]) {
        traitsFreq[tt][tv] = 0;
      }

      traitsFreq[tt][tv] += 1;
    }
  }

  return traitsFreq;
}

function getDuckTraits(duck) {
  return duck.attributes.reduce((prev, curr) => {
    prev[curr.trait_type] = curr.value;
    return prev;
  }, {});
}

// : 1/(# of ducks with trait/total # of ducks)
//  and the score for each trait together and you got your answer
function computeDuckScore(ducks, traits) {
  const duckScore = {};
  const nbDuck = ducks.length;
  for (const duck of ducks) {
    duckScore[duck.tokenId] = 0;
    const duckTraits = getDuckTraits(duck);
    duckScore[duck.tokenId] +=
      1 / traits["Background"][duckTraits["Background"]] / nbDuck;
    duckScore[duck.tokenId] +=
      1 / (traits["Skin"][duckTraits["Skin"]] / nbDuck);
    duckScore[duck.tokenId] +=
      1 / (traits["Foot"][duckTraits["Foot"]] / nbDuck);
    duckScore[duck.tokenId] +=
      1 / (traits["Body"][duckTraits["Body"]] / nbDuck);
    duckScore[duck.tokenId] +=
      1 / (traits["Face"][duckTraits["Face"]] / nbDuck);
    duckScore[duck.tokenId] += 1 / (traits["Hat"][duckTraits["Hat"]] / nbDuck);
    // duckScore[duck.tokenId] += traits / traits["Vault Run Left"][duckTraits["Vault Run Left"]] / nbDuck;
  }
  return duckScore;
}

function getDuckTrait(duck, trait) {
  const result = duck.attributes.find((x) => x.trait_type == trait);
  if (result) {
    return result.value;
  }
  return "";
}

function makeDuckScoreCSV(ducks, duckScore) {
  let csv = "duckId\tScore\tBackground\tSkin\tFoot\tBody\tFace\tOpen sea\n";
  for (const duck of ducks) {
    // for (const key of Object.keys(duckScore)) {
    duck.tokenId +
      "\t" +
      duckScore[duck.tokenId] +
      "\t" +
      getDuckTrait(duck, "Background") +
      "\t" +
      getDuckTrait(duck, "Skin") +
      "\t" +
      getDuckTrait(duck, "Foot") +
      "\t" +
      getDuckTrait(duck, "Body") +
      "\t" +
      getDuckTrait(duck, "Face") +
      "\t" +
      "https://opensea.io/assets/0x78f190efe7b9198b76207f14d90ba96fb782680e/" +
      duck.tokenId +
      "\n";
  }
  fs.writeFileSync("./data/duck-score.csv", csv);
}

main()
  .then(() => {
    console.log("End");
  })
  .catch((e) => {
    console.log(e);
  });
