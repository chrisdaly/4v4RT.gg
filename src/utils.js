export const standardDeviation = (array) => {
  const n = array.length;
  const mean = array.reduce((a, b) => a + b) / n;
  const dev = Math.sqrt(array.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n);
  return Math.round(dev);
};

export const arithmeticMean = (x) => {
  const product = x.reduce((p, c) => p * c, 1);
  const exponent = 1 / x.length;
  return Math.round(Math.pow(product, exponent));
};

export const getUniqueListBy = (arr, key) => [...new Map(arr.map((item) => [item[key], item])).values()];

export const akaLookup = (aka) => {
  const mapping = {
    完颜啊骨打: "hainiu",
    테드의뜨거운눈빛: "bonggo",
    渺小之牛头人: "tiny tauren",
  };

  const name = mapping[aka] || null;
  return name;
};

export const raceLookup = (aka) => {
  const mapping = {
    "Teo#23801": "hainiu",
  };

  const name = mapping[aka] || null;
  return name;
};

export const calcPlayerMmrAndChange = (battleTag, match) => {
  for (const team of match.teams) {
    for (const player of team.players) {
      if (player.battleTag === battleTag) {
        const mmr = player.currentMmr;
        const oldMmr = player.oldMmr;
        let mmrChange = player.mmrGain.toString(); // Convert mmrChange to a string
        if (player.mmrGain > 0) {
          mmrChange = `+${mmrChange}`;
        }
        return { oldMmr, mmrChange };
      }
    }
  }
  return null;
};

export const preprocessPlayerScores = (match, playerScores) => {
  // Define the key display name mapping
  const keyDisplayNameMapping = {
    heroesKilled: "Heroes Killed",
    expGained: "Experience Gained",
    goldCollected: "Gold Mined",
    unitsProduced: "Units Produced",
    unitsKilled: "Units Killed",
    largestArmy: "Largest Army",
    lumberCollected: "Lumber Harvested",
    goldUpkeepLost: "Gold Lost to Upkeep",
  };

  const dataTypes = ["heroScore", "resourceScore", "unitScore"];

  let stats = {};
  for (const dataType of dataTypes) {
    for (const [statName, value] of Object.entries(playerScores[0][dataType])) {
      const values = playerScores.map((d) => d[dataType][statName]);
      let percentiles = calculatePercentiles(values);

      // If the statName is "goldUpkeepLost", reverse the percentiles
      if (statName === "goldUpkeepLost") {
        percentiles = percentiles.map((d) => 100 - d);
      }
      const displayName = keyDisplayNameMapping[statName] || statName;
      stats[displayName] = { percentiles, values };
    }
  }

  console.log("stats", stats);
  let mvpData = {};
  // Define keys to calculate MVP
  const mvpKeys = ["Heroes Killed", "Experience Gained", "Gold Mined", "Units Killed", "Largest Army"];
  // Loop through each player
  for (let i = 0; i < 8; i++) {
    // console.log("i", i);
    // console.log(playerScores[i]);
    const playerName = playerScores[i].battleTag.split("#")[0];
    let summed = 0;
    for (const dataType of mvpKeys) {
      const percentiles = stats[dataType].percentiles;
      // console.log(percentiles);
      summed += percentiles[i];
    }
    // console.log("playerName", playerName, summed);
    mvpData[playerName] = summed;
  }

  const [mvp, maxValue] = Object.entries(mvpData).reduce((acc, [key, value]) => (value > acc[1] ? [key, value] : acc), ["", -Infinity]);
  // console.log("mvp", mvp);

  // Map over the match data first
  const playerData = match.teams.flatMap((team, teamIndex) => {
    return team.players.map((playerData) => {
      const playerScore = playerScores.find((score) => score.battleTag === playerData.battleTag);
      const { oldMmr, mmrChange } = calcPlayerMmrAndChange(playerData.battleTag, match);
      const isMvp = playerData.battleTag.split("#")[0] === mvp ? true : false;
      return {
        ...playerScore,
        ...playerData,
        oldMmr,
        mmrChange,
        isMvp,
      };
    });
  });

  const metaData = {
    startTime: match.startTime.slice(0, 16),
    gameLength: `${Math.floor(match.durationInSeconds / 60)}:${(match.durationInSeconds % 60).toString().padStart(2, "0")}`,
    server: match.serverInfo.name?.toUpperCase(),
    location: match.serverInfo.location?.toUpperCase(),
    mapName: match.mapName?.toUpperCase(),
  };

  return { playerData, metaData, stats };
};

export const calculatePercentiles = (arr) => {
  // console.log(arr);
  // Sort the array in ascending order
  const sortedArr = arr.slice().sort((a, b) => a - b);
  const n = sortedArr.length;

  // Calculate percentile for each element
  const percentiles = arr.map((num) => {
    // Find the index of the number in the sorted array
    const index = sortedArr.indexOf(num);

    // Calculate percentile using index and array length
    const percentile = (index / (n - 1)) * 100;
    return percentile;
  });
  return percentiles;
};
