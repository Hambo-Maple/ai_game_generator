import { gameState } from "./state.js";
import { isColliding } from "./collision.js";

export function checkCollisions() {
  const { currentSpec, player } = gameState;
  if (!currentSpec || !player) return;

  for (const object of gameState.objects) {
    if (object.touched) continue;

    if (currentSpec.player.control === "shoot") {
      for (const bullet of gameState.bullets) {
        if (isColliding(bullet, object)) {
          object.hp -= 1;
          bullet.remove = true;
          if (object.hp <= 0) {
            object.touched = true;
            gameState.score += object.points || 10;
            gameState.defeatedCount += 1;
          }
        }
      }

      if (isColliding(player, object)) {
        applyObjectEffect(object);
        object.touched = true;
      }
      continue;
    }

    if (currentSpec.player.control !== "click" && isColliding(player, object)) {
      applyObjectEffect(object);
      object.touched = true;
    }
  }

  gameState.objects = gameState.objects.filter((object) => !object.touched);
  gameState.bullets = gameState.bullets.filter((bullet) => !bullet.remove);
}

export function checkWinLose(endGame) {
  const rules = gameState.currentSpec.rules;

  if (gameState.health <= 0) {
    endGame("lose");
    return;
  }

  if (rules.winCondition === "scoreTarget" && gameState.score >= rules.scoreTarget) {
    endGame("win");
    return;
  }

  if (rules.winCondition === "defeatAll" && gameState.score >= rules.scoreTarget) {
    endGame("win");
    return;
  }

  if (gameState.timeLeft <= 0) {
    if (rules.winCondition === "surviveTime") {
      endGame("win");
    } else if (rules.loseCondition === "timeOut") {
      endGame(gameState.score >= rules.scoreTarget ? "win" : "lose");
    } else {
      endGame("lose");
    }
  }
}

function applyObjectEffect(object) {
  if (object.effect === "score") {
    gameState.score += object.points || 10;
  } else if (object.effect === "damage") {
    gameState.health -= object.damage || 1;
  } else if (object.effect === "win") {
    gameState.score = gameState.currentSpec.rules.scoreTarget;
  }
}
