game = {
  depth: new Decimal(0),
  bestDepth: new Decimal(0),
  coins: new Decimal(0),
  totalCoins: new Decimal(0),
  cursor: {
    amount: [new Decimal(0)], // first one is x^0, second is derivative x^1, etc.
    bought: [new Decimal(0)],
  },
  clickCoolDown: 0, // millisecond
  miner: {
    bought: [new Decimal(0),new Decimal(0),new Decimal(0),new Decimal(0)],
  },
  dealed: new Decimal(0),
  factoryEnergy: new Decimal(0),
  factoryUpgrade: [null, new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0)],
  lastTick: Date.now(),
  totalPlayed: 0, // millisecond
  mainTab: 1,
  // option
  maxBulk: 1000,
  notation: 0,
  version: 0,
};
load();
Tab(game.mainTab)

const minerBaseEff = [new Decimal(0.1),new Decimal(2),new Decimal(56),new Decimal(11000)]; // when you buy 1 Miner, the effect
const minerReq = [new Decimal(49.999),new Decimal(149.999),new Decimal(249.999),new Decimal(499.999)] // first one is Miner 0, require cursor amount
const milestoneReq = [null,new Decimal(49.999),new Decimal(99.999),new Decimal(149.999),new Decimal(199.999),new Decimal(249.999),new Decimal(299.999),new Decimal(399.999),new Decimal(499.999),new Decimal(599.999)] // require cursor
const factoryUpgradeInitCost = [null,new Decimal(1),new Decimal(6),new Decimal(Infinity),new Decimal(6.4),new Decimal(45),new Decimal(Infinity),new Decimal(640),new Decimal(1800),new Decimal(Infinity)] // Infinity mean not completed yet
const factoryUpgradeCostScaling = [null,new Decimal(2),new Decimal(4),new Decimal(10),new Decimal(Infinity),new Decimal(Infinity),new Decimal(Infinity),new Decimal(Infinity),new Decimal(Infinity),new Decimal(Infinity)] // Infinity mean this is non-repeatable upgrade

let deltaTime;
const calculate = window.setInterval(() => {
  deltaTime = Date.now() - game.lastTick;
  if (deltaTime > 600000) {
    for (let i=0; i<1000; i++) {
      loop(deltaTime/1000)
    }
  } else loop(deltaTime)
  game.lastTick = Date.now()
}, 20);

var autoSave = window.setInterval(function() {
  save()
}, 10000)

function loop(unadjusted, off = 0) { //the begin of gameloop
  let ms = unadjusted
  game.totalPlayed += ms
  game.dealed = (game.dealed).add(getTotalMinerDamage().div(1000).times(ms));
  if (game.dealed.lt(0)) game.dealed = new Decimal(0)
  game.depth = getDepth(game.dealed);
  if (game.bestDepth.lte(game.depth)) game.bestDepth = game.depth;
  game.coins = (game.coins).add(getCoinPerSecond().div(1000).times(ms));
  game.totalCoins = (game.totalCoins).add(getCoinPerSecond().div(1000).times(ms));
  if (game.coins.lt(0)) game.coins = new Decimal(0)
  if (game.clickCoolDown > 0) game.clickCoolDown -= ms;
  game.factoryEnergy = (game.factoryEnergy).add(getFactoryEnergyPerSecond().div(1000).times(ms));
  if (game.factoryEnergy.gt(getFactoryEnergyCap())) game.factoryEnergy = getFactoryEnergyCap();
  updateDisplay()
  updateText()
}

function updateDisplay() {
  document.getElementById("coins").style.display = (game.depth.gte(1) ? "block" : "none")
  for (let i=0; i<4; i++) {
    document.getElementById("minerBought" + i).style.display = (game.cursor.amount[0].gte(minerReq[i]) ? "block" : "none")
    document.getElementById("maxMinerBought" + i).style.display = (game.cursor.amount[0].gte(minerReq[i]) ? "block" : "none")
  }
  document.getElementById("tab2").style.display = (game.cursor.amount[0].gte(49.999) ? "inline-block" : "none")
  document.getElementById("tab3").style.display = (game.cursor.amount[0].gte(299.999) ? "inline-block" : "none")
  document.getElementById("factoryUpgrade2").style.display = (game.factoryUpgrade[1].gte(2.999) ? "inline-block" : "none")
  document.getElementById("factoryUpgrade4").style.display = (game.factoryUpgrade[2].gte(0.999) ? "inline-block" : "none")
  document.getElementById("factoryUpgrade5").style.display = (game.factoryUpgrade[2].gte(0.999) ? "inline-block" : "none")
  document.getElementById("factoryUpgrade7").style.display = (game.factoryUpgrade[2].gte(3.999) ? "inline-block" : "none")
  document.getElementById("factoryUpgrade8").style.display = (game.factoryUpgrade[2].gte(3.999) ? "inline-block" : "none")
  document.getElementById("factoryUpgrade3").style.display = (game.factoryUpgrade[8].gte(0.999) ? "inline-block" : "none")
  document.getElementById("factoryUpgrade6").style.display = (game.factoryUpgrade[8].gte(0.999) ? "inline-block" : "none")
  document.getElementById("factoryUpgrade9").style.display = (game.factoryUpgrade[8].gte(0.999) ? "inline-block" : "none")
}

function updateText() {
  document.getElementById("depth").innerHTML = "Your depth is currently " + formate(game.depth,0) + " meter"
  document.getElementById("health").innerHTML = "Your health on this block is currently " + formate(getHealth(game.depth).sub(game.dealed),2) + "/" + formate(getHealth(game.depth).sub(getHealth(game.depth.sub(1))),2)
  document.getElementById("coins").innerHTML = "You have " + formate(game.coins,2) + " coins (+" + formate(getCoinPerSecond(),2) + "/s)"
  document.getElementById("damage").innerHTML = "Deal Damage by " + formate(getCursorDamage(),2)
  document.getElementById("damagePerSecond").innerHTML = "You are dealing " + formate(getTotalMinerDamage(),2) + " per second"
  document.getElementById("maxBulk").innerHTML = "Max Bulk buy: " + game.maxBulk
  for (let i=0; i<1; i++) {
    document.getElementById("cursor" + i + "Amount").innerHTML = (game.cursor.bought[i].gte(1000) ? (game.cursor.bought[i].gte(10000) ? "Superscaled " : "Scaled ") : "") + "Cursor: " + formate(game.cursor.amount[i],0) + " (" + formate(game.cursor.bought[i],0) + " Bought)"
    document.getElementById("cursor" + i + "Power").innerHTML = "Power: " + formate(getCursorPower(i),2) + "x"
    document.getElementById("cursor" + i + "Cost").innerHTML = "Cost: " + formate(getCursorCost(i, game.cursor.bought[i]),2)
  }
  for (let i=0; i<4; i++) {
    document.getElementById("miner" + i + "Amount").innerHTML = (game.miner.bought[i].gte(1000) ? (game.miner.bought[i].gte(10000) ? "Superscaled " : "Scaled ") : "") + "Miner " + i + ": " + formate(game.miner.bought[i],0)
    document.getElementById("miner" + i + "Power").innerHTML = "Power: "+ formate(getMinerPower(i),2) +"x"
    document.getElementById("miner" + i + "Cost").innerHTML = "Cost: " + formate(getMinerCost(i, game.miner.bought[i]),2)
  }
  document.getElementById("nextMinerReq").innerHTML = (game.cursor.amount[0].lt(499.999) ? "Get " + formate(
    game.cursor.amount[0].lt(49.999) ? new Decimal(50) : 
    (game.cursor.amount[0].lt(149.999) ? new Decimal(150) : 
    (game.cursor.amount[0].lt(249.999) ? new Decimal(250) : new Decimal(500)))) + 
    " Cursors to Unlock new Miner" : "You have unlocked all Miners!")
  document.getElementById("damagePerSecond").style.display = (getTotalMinerDamage().gt(0) ? "block" : "none")
  document.getElementById("factoryEnergy").innerHTML = "You have " + formate(game.factoryEnergy, 3) + " Factory Energy, Multiply all Miner damage by " + formate(getFactoryEnergyEff(), 3)
  document.getElementById("factoryEnergyPerSecond").innerHTML = "You are getting " + formate(getFactoryEnergyPerSecond(), 3) + " Factory Energy per second (based on Miners),"
  document.getElementById("factoryEnergyCap").innerHTML = "but will capped at " + formate(getFactoryEnergyCap(), 3) + " Factory Energy (based on Cursors)"
  for (let i=1; i<10; i++) {
    document.getElementById("factoryUpg" + i + "Eff").innerHTML = formate(getFactoryUpgEff(i), 2)
    if (i > 3.5) {
      document.getElementById("factoryUpg" + i + "Level").innerHTML = (game.factoryUpgrade[i].gte(0.5) ? "Purchased" : "Not Purchased")
      document.getElementById("factoryUpg" + i + "Cost").innerHTML = "Cost: " + formate(factoryUpgradeInitCost[i], 3)
    } else {
    document.getElementById("factoryUpg" + i + "Level").innerHTML = (game.factoryUpgrade[i].gte(100) ? "Scaled " : "") + "Level " + formate(game.factoryUpgrade[i])
    document.getElementById("factoryUpg" + i + "Cost").innerHTML = "Cost: " + formate(getFactoryUpgradeCost(i,game.factoryUpgrade[i]), 3)
    }
  }
  document.getElementById("notation").innerHTML = "Notation: " + (game.notation == 0 ? "Scientific " : "Standard I" + (game.notation >= 2 ? (game.notation >= 3 ? "II " : "I ") : " ")) + "(Scientific Notation start at 1e" + (3 * 10 ** game.notation + 3) + ")"
  for (let i=1; i<10; i++) {
    document.getElementById("milestone" + i + "achieve").innerHTML = (game.cursor.amount[0].gte(milestoneReq[i]) ? "(Achieved) " : "(" + formate(game.cursor.amount[0].div(milestoneReq[i]).mul(100), 2) + "% done) " )
  }
  document.getElementById("milestone2effect").innerHTML = formate((game.cursor.amount[0].gte(99.999) ? getTotalMinerDamage().div(100).mul(getMilestone7Eff()) : new Decimal(0)), 2)
  document.getElementById("milestone4effect").innerHTML = formate(game.cursor.amount[0].gte(199.999) ? getTotalMiners() : new Decimal(0))
  document.getElementById("milestone7effect").innerHTML = formate(getMilestone7Eff(), 2)
  document.getElementById("statistic1").innerHTML = "You have played for " + formateTime(new Decimal(game.totalPlayed/1000))
  document.getElementById("statistic2").innerHTML = "You have gained " + formate(game.totalCoins,2) + " coins"
  document.getElementById("statistic3").innerHTML = "You have bought " + formate(getTotalMiners()) + " miners"
  document.getElementById("statistic4").innerHTML = "You have dealed " + formate(game.dealed,2) + " damage"
  document.getElementById("statistic5").innerHTML = "Your best depth was " + formate(game.bestDepth) + " meter"
}
