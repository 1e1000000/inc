let deltaTime;
const calculate = window.setInterval(() => {
  deltaTime = Date.now() - game.lastTick;
  loop(deltaTime);
  game.lastTick = Date.now()
}, 0);

function loop(unadjusted, off = 0) {
  game.num += unadjusted/1000
  document.getElementById("number").innerHTML = "Your number is currently " + (game.num).toFixed(3)
}

function inc() {
  game.num++
}
