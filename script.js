game = {
  num: 0,
  lastTick: 0
}

game.lastTick = Date.now()

let deltaTime;
const calculate = window.setInterval(() => {
  deltaTime = Date.now() - game.lastTick;
  loop(deltaTime);
}, game.msint);

function loop(unadjusted, off = 0) {
  unadjusted=10
  game.num++
  document.getElementById("number").innerHTML = "Your number is currently "+ game.num
}

function inc() {
  game.num++
}
