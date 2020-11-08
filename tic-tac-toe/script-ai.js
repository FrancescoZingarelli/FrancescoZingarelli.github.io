let game = document.querySelector('#game')

const CELL_SIZE = 80

let linesData = [
  {left: CELL_SIZE + 'px', top: '0px', width: '4px', height: (CELL_SIZE * 3 + 8) + 'px' },
  {left: (CELL_SIZE * 2 + 4) + 'px', top: '0px', width: '4px', height: (CELL_SIZE * 3 + 8) + 'px' },
  {left: '0px', top: CELL_SIZE + 'px', width: (CELL_SIZE * 3 + 8) + 'px', height: '4px' },
  {left: '0px', top: (CELL_SIZE * 2 + 4) + 'px', width: (CELL_SIZE * 3 + 8) + 'px', height: '4px' }
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
      let cell = document.createElement("div")
      cell.className = "cell empty"
      cell.id = y * 3 + x
      cell.style.width = CELL_SIZE + 'px'
      cell.style.height = CELL_SIZE + 'px'
      cell.style.left = x * (CELL_SIZE + 4) + 'px'
      cell.style.top = y * (CELL_SIZE + 4) + 'px'
      cellElements.push(cell)
      game.appendChild(cell)
    }
  }
}



/* function draw(cells) {
  for (let x = 0; x < 3; x++) {
    for (let y = 0; y < 3; y++) {
      let cellElement = cellElements[x + y * 3]
      if (cells[x + y * 3]) cellElement.textContent = cells[x + y * 3] === 'human' ? ' ❌' : '⭕️'
    }
  }
} */
function draw(cells) {
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 3; x++) {
      let cellElement = cellElements[x + y * 3]
      if (cells[x + y * 3]) {
        let text = document.createElement("span")
        text.className = "symbol"
        text.textContent = cells[x + y * 3] === 'human' ? '👦' : '🤖'
        cellElement.textContent = ''
        cellElement.appendChild(text)
        cellElement.className = 'cell'
      }
    }
  }
}

let winCombinations = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
]

function turn(state, player) {
  return new Promise((resolve, reject) => {
    if (player === 'human') {
      let freeCellElements =
        state.cells.reduce((arr, cell, idx) => {
          return cell ? arr : [...arr, cellElements.find(el => el.id === String(idx))]
        }, [])

      function selected(event) {
        freeCellElements.forEach(el => el.removeEventListener('click', selected))
        let newState = { ...state }
        newState.cells[Number(event.target.id)] = 'human'
        draw(newState.cells)
        let checkCombinations = winCombinations.map(comb => comb.map(idx => newState.cells[idx]))
        if (checkCombinations.some(comb => comb.every(p => p === 'human'))) {
          newState.ended = true
          newState.winner = 'human'
        } else if (freeCellElements.length === 1) {
          newState.ended = true
          newState.winner = 'draw'
        }
        resolve(newState)
      }

      freeCellElements.forEach(cellElement => {
        cellElement.addEventListener('click', selected)
      })
    } else {
      let aiMove = aiBestMove(state.cells)
      let newCellState = state.cells.slice()
      newCellState[aiMove] = 'ai'
      let newState = { ...state, cells: newCellState }
      draw(newState.cells)
      let checkCombinations = winCombinations.map(comb => comb.map(idx => newState.cells[idx]))
      if (checkCombinations.some(comb => comb.every(p => p === 'ai'))) {
        newState.ended = true
        newState.winner = 'ai'
      } else if (!newCellState.some(player => !player)) {
        newState.ended = true
        newState.winner = 'draw'
      }
      resolve(newState)
    }
  })
}



let RECURSIONCOUNTER = 0

function aiBestMove(cells) {

  function move(cells, player, layer) {
    if (RECURSIONCOUNTER++ > 200000) {
      console.log('over 200000 rounds')
      return
    }

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

    let score = outcome => {
      switch(outcome.outcome) {
        case 'win':
          return 1
        case 'draw':
          return 0
        case 'lose':
          return -1
      }
    }

    let outcome

    if (player === 'ai') {
      outcome = outcomes.reduce((best, curr) => {
          return score(curr) > score(best) ? curr : best
        })
    } else {
      outcome = outcomes.reduce((best, curr) => {
        return score(curr) < score(best) ? curr : best
      })
    }
    //console.log(player, outcomes, outcome, freeCells)
    return layer === 1 ? outcome.cell : outcome.outcome
  }

  return move(cells, 'ai', 1)
}



function endGame(state) {
  let endGameString = ''
  if (state.winner === 'draw') endGameString = 'DRAW'
  else endGameString += ((state.winner === 'ai' ? 'THE AI' : 'YOU') + ' WON!')

  let message = document.createElement("div")
  message.className = "message"
  message.appendChild(document.createTextNode(endGameString))
  let button = document.createElement("button")
  button.innerText = 'RESTART'
  button.addEventListener('click', e => {
    message.remove()
    runGame()
  })
  message.appendChild(button)
  document.body.appendChild(message)
}

async function runGame() {
  let state = {
    cells: new Array(9).fill(null),
    ended: false,
    winner: null
  }

  initializeCells()

  while (!state.ended) {
    state = await turn(state, 'human')
    if (state.ended) { endGame(state); continue }
    await new Promise(res => setTimeout(res, 400))
    state = await turn(state, 'ai')
    if (state.ended) endGame(state)
  }
}

runGame()