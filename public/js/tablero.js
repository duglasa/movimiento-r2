tablero = document.querySelector('#game');
let grey = true;
let letter = ['', '-6', '-5', '-4', '-3', '-2', '-1', '0', '1', '2', '3', '4', '5', '6']

for (let i = 13; i > 0; i--) {
    let cellprefix = document.createElement("div");
    cellprefix.className = "cellprefix grid";
    cellprefix.innerHTML = letter[i];
    tablero.append(cellprefix);
    for (let j = 13; j > 0; j--) {
        let cell = document.createElement("div")
        cell.className = "gamecell grid";
        cell.id = letter[14-j] + "_" + letter[i];
        if (grey) {
            cell.className += " grey";
        }
        grey = !grey;
        tablero.append(cell)
    }
}
for (let i = 0; i < 14; i++) {
    let cellprefix = document.createElement("div");
    cellprefix.className = "cellprefix grid";
    cellprefix.innerHTML = letter[i];
    tablero.append(cellprefix);
}
