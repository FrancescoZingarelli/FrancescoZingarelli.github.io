// UTILS

function elt(type, props, ...children) {
  let dom = document.createElement(type);
  if (props) Object.assign(dom, props);
  for (let child of children) {
    if (typeof child != "string") dom.appendChild(child);
    else dom.appendChild(document.createTextNode(child));
  }
  return dom;
}



let container = document.querySelector('#container')

let game = elt("div", {id:"game"})
container.appendChild(game)

const CELL_SIZE = 80
const LINE_WIDTH = 5

const GAME_SIZE = CELL_SIZE * 3 + LINE_WIDTH * 2

game.style.width = GAME_SIZE + 'px'
game.style.height = GAME_SIZE + 'px'

let linesData = [
  {left: CELL_SIZE + 'px', top: '0px', width: LINE_WIDTH + 'px', height: (CELL_SIZE * 3 + 8) + 'px' },
  {left: (CELL_SIZE * 2 + 4) + 'px', top: '0px', width: LINE_WIDTH + 'px', height: (CELL_SIZE * 3 + 8) + 'px' },
  {left: '0px', top: CELL_SIZE + 'px', width: (CELL_SIZE * 3 + 8) + 'px', height: LINE_WIDTH + 'px' },
  {left: '0px', top: (CELL_SIZE * 2 + 4) + 'px', width: (CELL_SIZE * 3 + 8) + 'px', height: LINE_WIDTH + 'px' }
]

for (let lineData of linesData) {
  let line = document.createElement("div")
  line.style.position = 'absolute'
  line.className = "line"
  for (let [prop, value] of Object.entries(lineData)) line.style[prop] = value
  game.appendChild(line)
}

let cellElements = []

function initializeCells() {
  cellElements.forEach(c => c.remove())
  cellElements = []

  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 3; x++) {
      let cell = elt("div",
        { className: "cell empty", id: y * 3 + x }
      )
      cell.style.width = CELL_SIZE + 'px'
      cell.style.height = CELL_SIZE + 'px'
      cell.style.left = x * (CELL_SIZE + 4) + 'px'
      cell.style.top = y * (CELL_SIZE + 4) + 'px'

      cellElements.push(cell)
      game.appendChild(cell)
    }
  }
}

const SYMBOL_SIZE = 40

function draw(cells) {
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 3; x++) {
      let cellElement = cellElements[x + y * 3]
      if (cells[x + y * 3]) {
        let symbol = elt("span", { className: "symbol" },
          cells[x + y * 3] === 'human' ? '🙂' : '🤖'
        )
        symbol.style.fontSize = SYMBOL_SIZE + 'px'
        symbol.style.top = (CELL_SIZE - SYMBOL_SIZE) / 2 + 'px'
        symbol.style.left = (CELL_SIZE - SYMBOL_SIZE) / 2 + 'px'

        cellElement.textContent = ''
        cellElement.appendChild(symbol)
        cellElement.className = 'cell'
      }
    }
  }
}



function turn(cells, player) {
  return new Promise(resolve => {
    if (player === 'human') {
      let freeCellElements =
        cells.reduce((arr, cell, idx) => {
          return cell ? arr : [...arr, cellElements.find(el => el.id === String(idx))]
        }, [])

      function selected(event) {
        freeCellElements.forEach(el => el.removeEventListener('click', selected))
        let newCells = [ ...cells ]
        newCells[Number(event.target.id)] = 'human'
        resolve(newCells)
      }

      freeCellElements.forEach(cellElement => {
        cellElement.addEventListener('click', selected)
      })
    } else {
      let aiMove = aiBestMove(cells)
      let newCells = cells.slice()
      newCells[aiMove] = 'ai'
      resolve(newCells)
    }
  })
}

let winCombinations = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
]

function calculateGameState(cells) {
  let newState = { cells }

  let combinations = winCombinations.map(comb => comb.map(idx => cells[idx]))

  if (combinations.some(comb => comb.every(p => p === 'ai'))) {
    newState.ended = true
    newState.winner = 'ai'
  } else if (combinations.some(comb => comb.every(p => p === 'human'))) {
    newState.ended = true
    newState.winner = 'human'
  } else if (cells.every(player => player)) {
    newState.ended = true
    newState.winner = 'draw'
  } else {
    newState.ended = false
    newState.winner = null
  }
  
  return newState
}

function aiBestMove(cells) {

  function move(cells, player, layer) {

    let freeCells = []
    cells.forEach((c, idx) => { if (!c) freeCells.push(idx) })

    let outcomes = []

    for (let cell of freeCells) {
      let cellsCopy = [ ...cells]
      cellsCopy[cell] = player
      let checkCombinations = winCombinations.map(comb => comb.map(idx => cellsCopy[idx]))
      if (checkCombinations.some(comb => comb.every(p => p === 'ai'))) outcomes.push({ cell, outcome: 'win'})
      else if (checkCombinations.some(comb => comb.every(p => p === 'human'))) outcomes.push({ cell, outcome: 'lose'})
      else if (freeCells.length === 1) outcomes.push({ cell, outcome: 'draw'})
      else outcomes.push({ cell, outcome: move(cellsCopy, player === 'ai' ? 'human' : 'ai', layer + 1)})
    }

    let scores = { win: 1, draw: 0 , lose: -1 }

    let outcome

    if (player === 'ai') {
      outcome = outcomes.reduce((best, curr) => {
          return scores[curr.outcome] > scores[best.outcome] ? curr : best
        })
    } else {
      outcome = outcomes.reduce((best, curr) => {
        return scores[curr.outcome] < scores[best.outcome] ? curr : best
      })
    }

    return layer === 1 ? outcome.cell : outcome.outcome
  }

  return move(cells, 'ai', 1)
}



function endGame(state) {
  let endGameString = ''
  if (state.winner === 'draw') endGameString = 'DRAW'
  else endGameString += ((state.winner === 'ai' ? 'THE AI' : 'YOU') + ' WON!')

  let message = elt("div", { className: "message" },
    endGameString,
    elt("button", {
        onclick: e => {
          message.remove()
          runGame()
        }
      },
      "RESTART"
    )
  )
  document.body.appendChild(message)
}

async function runGame() {
  let state = {
    cells: new Array(9).fill(null),
    ended: false,
    winner: null
  }

  initializeCells()

  let cellState
  while (true) {
    cellState = await turn(state.cells, 'human')
    state = calculateGameState(cellState)
    draw(state.cells)
    if (state.ended) return endGame(state)

    await new Promise(res => setTimeout(res, 400))
    cellState = await turn(state.cells, 'ai')
    state = calculateGameState(cellState)
    draw(state.cells)
    if (state.ended) return endGame(state)
  }
}

runGame()