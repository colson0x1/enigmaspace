const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

const engine = Engine.create();
engine.world.gravity.y = 0;
const { world } = engine;

const cellsHorizontal = 30;
const cellsVertical = 20;
const width = window.innerWidth;
const height = window.innerHeight;

const unitLengthX = width / cellsHorizontal;
const unitLengthY = height / cellsVertical;

const render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    wireframes: false,
    width,
    height,
  },
});

Render.run(render);
Runner.run(Runner.create(), engine);

// Walls
const walls = [
  Bodies.rectangle(width / 2, 0, width, 2, { isStatic: true }),
  Bodies.rectangle(width / 2, height, width, 2, { isStatic: true }),
  Bodies.rectangle(0, height / 2, 2, height, { isStatic: true }),
  Bodies.rectangle(width, height / 2, 2, height, { isStatic: true }),
];
World.add(world, walls);

// Maze

const shuffle = (arr) => {
  let counter = arr.length;

  while (counter > 0) {
    const index = Math.floor(Math.random() * counter);
    counter--;
    const temp = arr[counter];
    arr[counter] = arr[index];
    arr[index] = temp;
  }

  return arr;
};

const grid = Array(cellsVertical)
  .fill(null)
  .map(() => Array(cellsHorizontal).fill(false));

const verticals = Array(cellsVertical)
  .fill(null)
  .map(() => Array(cellsHorizontal - 1).fill(false));

const horizontals = Array(cellsVertical - 1)
  .fill(null)
  .map(() => Array(cellsHorizontal).fill(false));

const startRow = Math.floor(Math.random() * cellsVertical);
const startColumn = Math.floor(Math.random() * cellsHorizontal);

const stepThroughCell = (row, column) => {
  // if visited the cell of [row, column], then return
  if (grid[row][column]) {
    return;
  }

  // mark this cell as being visited
  grid[row][column] = true;

  // gather randomly ordered list of neighbors
  const neighbors = shuffle([
    [row - 1, column, 'up'],
    [row, column + 1, 'right'],
    [row + 1, column, 'down'],
    [row, column - 1, 'left'],
  ]);

  // do this for each neighbor
  for (let neighbor of neighbors) {
    const [nextRow, nextColumn, direction] = neighbor;

    // check if that neighbor is out of bounds
    if (
      nextRow < 0 ||
      nextRow >= cellsVertical ||
      nextColumn < 0 ||
      nextColumn >= cellsHorizontal
    ) {
      continue;
    }

    // if neighbor visited, continue to next one
    if (grid[nextRow][nextColumn]) {
      continue;
    }

    // remove walls from either horizontal or vertical
    if (direction === 'left') {
      verticals[row][column - 1] = true;
    } else if (direction === 'right') {
      verticals[row][column] = true;
    } else if (direction === 'up') {
      horizontals[row - 1][column] = true;
    } else if (direction === 'down') {
      horizontals[row][column] = true;
    }
    stepThroughCell(nextRow, nextColumn);
  }
};

stepThroughCell(startRow, startColumn);

horizontals.forEach((row, rowIndex) => {
  row.forEach((open, columnIndex) => {
    if (open) {
      return;
    }

    const wall = Bodies.rectangle(
      columnIndex * unitLengthX + unitLengthX / 2,
      rowIndex * unitLengthY + unitLengthY,
      unitLengthX,
      10,
      {
        isStatic: true,
        label: 'wall',
        render: {
          fillStyle: '#FF0000',
        },
      }
    );
    World.add(world, wall);
  });
});

verticals.forEach((row, rowIndex) => {
  row.forEach((open, columnIndex) => {
    if (open) {
      return;
    }

    const wall = Bodies.rectangle(
      columnIndex * unitLengthX + unitLengthX,
      rowIndex * unitLengthY + unitLengthY / 2,
      10,
      unitLengthY,
      {
        isStatic: true,
        label: 'wall',
        render: {
          fillStyle: '#FF0000',
        },
      }
    );
    World.add(world, wall);
  });
});

// nexus

const nexus = Bodies.rectangle(
  width - unitLengthX / 2,
  height - unitLengthY / 2,
  unitLengthX * 0.7,
  unitLengthY * 0.7,
  {
    isStatic: true,
    label: 'nexus',
    render: {
      fillStyle: '#98FF98',
    },
  }
);

World.add(world, nexus);

// meteor

const meteorRadius = Math.min(unitLengthX, unitLengthY) / 4;
const meteor = Bodies.circle(unitLengthX / 2, unitLengthY / 2, meteorRadius, {
  label: 'meteor',
  render: {
    fillStyle: '#FFA500',
  },
});

World.add(world, meteor);

document.addEventListener('keydown', (event) => {
  const { x, y } = meteor.velocity;

  if (event.key === 'w') {
    Body.setVelocity(meteor, { x, y: y - 1 });
  }
  if (event.key === 'a') {
    Body.setVelocity(meteor, { x: x - 1, y });
  }
  if (event.key === 's') {
    Body.setVelocity(meteor, { x, y: y + 1 });
  }
  if (event.key === 'd') {
    Body.setVelocity(meteor, { x: x + 1, y });
  }
});

// meteor collides with nexus

Events.on(engine, 'collisionStart', (event) => {
  event.pairs.forEach((collision) => {
    const labels = ['meteor', 'nexus'];

    if (
      labels.includes(collision.bodyA.label) &&
      labels.includes(collision.bodyB.label)
    ) {
      document.querySelector('.champ').classList.remove('hidden');
      world.gravity.y = 1;
      world.bodies.forEach((body) => {
        if (body.label === 'wall') {
          Body.setStatic(body, false);
        }
      });
    }
  });
});
