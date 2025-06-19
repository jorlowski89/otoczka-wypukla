// Pobieramy referencje do elementów DOM
const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")
const output = document.getElementById("output")
const clearBtn = document.getElementById("clearBtn")
const addPointBtn = document.getElementById("manualAddPointForm")

// Stała określająca promień rysowanych punktów (decyduje czy zostanie dodany nowy punkt)
const POINT_RADIUS = 6
// Wirtualny układ współrzędnych [-250, 250]
const COORD_LIMIT = 250
// Zmienna przechowująca indeks aktualnie zaznaczonego punktu (lub null, jeśli żaden nie jest zaznaczony)
let selectedPoint = null

// Początkowa tablica punktów na płótnie (każdy to obiekt {x, y})
let points = [
{ x: 100, y: 200 },
{ x: 220, y: -100 },
{ x: -50, y: -50 },
{ x: 0, y: 0 },
]

/**
 * Rysuje wszystkie punkty na canvasie.
 * Zaznaczony punkt (jeśli istnieje) jest dodatkowo obrysowany na niebiesko.
 */
function drawPoints(pts) {
pts.forEach((p, index) => {
    const { x, y } = toCanvasCoords(p.x, p.y)
    ctx.beginPath()
    ctx.arc(x, y, POINT_RADIUS, 0, 2 * Math.PI)
    ctx.fillStyle = "red"
    ctx.fill()
    if (selectedPoint === index) {
    ctx.strokeStyle = "blue"
    ctx.lineWidth = 2
    ctx.stroke()
    }
})
}

/**
 * Oblicza iloczyn wektorowy (cross product) dla trzech punktów:
 * o - punkt odniesienia, a i b - kolejne punkty.
 * Wynik > 0: skręt w lewo, < 0: skręt w prawo, = 0: współliniowość.
 */
function cross(o, a, b) {
return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
}

/**
 * Wyznacza otoczkę wypukłą (convex hull) dla zadanej tablicy punktów
 * Algorytm: monotoniczny łańcuch Andrewsa (O(n log n))
 * Zwraca tablicę punktów należących do otoczki w kolejności.
 */
function convexHull(pts) {
// Tworzymy kopię i sortujemy punkty po x (a w razie remisu po y)
const sorted = [...pts].sort((a, b) =>
    a.x === b.x ? a.y - b.y : a.x - b.x,
)

// Dolna część otoczki
const lower = []
for (const p of sorted) {
    // Usuwamy ostatni punkt z lower, jeśli dodanie p powoduje skręt w prawo lub współliniowość
    while (
    lower.length >= 2 &&
    cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0
    ) {
    lower.pop()
    }
    lower.push(p)
}

// Górna część otoczki (przechodzimy w odwrotnej kolejności)
const upper = []
for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i]
    // Analogicznie jak w dolnej części
    while (
    upper.length >= 2 &&
    cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0
    ) {
    upper.pop()
    }
    upper.push(p)
}

// Usuwamy ostatni punkt z każdej listy (bo się powtarza na początku drugiej)
upper.pop()
lower.pop()
// Łączymy dolną i górną część, otrzymując pełną otoczkę
return [...lower, ...upper]
}

/**
 * Rysuje otoczkę wypukłą na canvasie (zielona linia łącząca kolejne punkty otoczki)
 */
function drawHull(hullPoints) {
if (hullPoints.length < 2) return
ctx.strokeStyle = "green"
ctx.lineWidth = 2
ctx.beginPath()
const first = toCanvasCoords(hullPoints[0].x, hullPoints[0].y)
ctx.moveTo(first.x, first.y)
for (let i = 1; i < hullPoints.length; i++) {
    const { x, y } = toCanvasCoords(hullPoints[i].x, hullPoints[i].y)
    ctx.lineTo(x, y)
}
ctx.closePath()
ctx.stroke()
}

/**
 * Wyświetla w panelu tekstowym informacje o aktualnej otoczce wypukłej
 * oraz ewentualnie o zaznaczonym punkcie.
 */
function showOutput(hullPoints, allPoints) {
// Określamy typ otoczki na podstawie liczby punktów
let type
if (allPoints.length == 1) {
    type = "punkt"
} else {
    switch (hullPoints.length) {
    case 2:
        type = "odcinek"
        break
    case 3:
        type = "trójkąt"
        break
    case 4:
        type = "czworokąt"
        break
    default:
        type = `${hullPoints.length}-kąt`
    }
}

// Generujemy HTML z listą punktów otoczki
let html =
    `<p class="mb-2"><strong class="text-green-600">Otoczka wypukła:</strong> ${type}</p><ul class="space-y-1">` +
    points
    .map(
        (p, i) => `
<li class="flex justify-between items-center border px-2 py-1 rounded">
<span>(${p.x}, ${p.y})</span>
<button onclick="removePoint(${i})" class="text-red-500 hover:text-red-700 text-sm">Usuń</button>
</li>`,
    )
    .join("") +
    "</ul>"
// Informacja o zaznaczonym punkcie (jeśli istnieje)
if (selectedPoint !== null && points[selectedPoint]) {
    const p = points[selectedPoint]
    html += `<p class="mt-4"><strong class="text-blue-600">Zaznaczony punkt:</strong> (${p.x}, ${p.y})</p>`
}

output.innerHTML = html
}

//Dodawanie siatki
function drawGrid() {
const step = 50
ctx.strokeStyle = "#ddd"
ctx.lineWidth = 1
ctx.font = "10px sans-serif"
ctx.fillStyle = "#888"

for (let x = -COORD_LIMIT; x <= COORD_LIMIT; x += step) {
    const { x: cx } = toCanvasCoords(x, 0)
    ctx.beginPath()
    ctx.moveTo(cx, 0)
    ctx.lineTo(cx, canvas.height)
    ctx.stroke()
    if (x !== 0) {
    ctx.fillText(x, cx + 2, canvas.height / 2 - 2)
    }
}

for (let y = -COORD_LIMIT; y <= COORD_LIMIT; y += step) {
    const { y: cy } = toCanvasCoords(0, y)
    ctx.beginPath()
    ctx.moveTo(0, cy)
    ctx.lineTo(canvas.width, cy)
    ctx.stroke()
    if (y !== 0) {
    ctx.fillText(y, canvas.width / 2 + 4, cy - 4)
    }
}

// axes
ctx.strokeStyle = "#aaa"
ctx.beginPath()
ctx.moveTo(0, canvas.height / 2)
ctx.lineTo(canvas.width, canvas.height / 2)
ctx.moveTo(canvas.width / 2, 0)
ctx.lineTo(canvas.width / 2, canvas.height)
ctx.stroke()
}

/**
 * Główna funkcja rysująca: czyści canvas, rysuje punkty, otoczkę i aktualizuje panel tekstowy.
 */
function redraw() {
ctx.clearRect(0, 0, canvas.width, canvas.height) // Czyścimy cały canvas
drawGrid() // Rysujemy siatkę
drawPoints(points) // Rysujemy wszystkie punkty
if (points.length >= 1) {
    const hull = convexHull(points) // Wyznaczamy otoczkę wypukłą
    drawHull(hull) // Rysujemy otoczkę
    showOutput(hull, points) // Wyświetlamy informacje
} else {
    // Jeśli nie ma punktów, wyświetlamy zachętę
    output.innerHTML =
    "<em class='text-gray-500'>Dodaj punkty klikając na płótnie.</em>"
}
}

/**
 * Sprawdza, czy kliknięto w okolicy któregoś z istniejących punktów.
 * Zwraca indeks punktu, jeśli tak, lub -1 jeśli nie.
 */
function getClickedPointIndex(x, y) {
return points.findIndex((p) => {
    const dx = p.x - x
    const dy = p.y - y
    // Sprawdzamy, czy odległość od punktu jest mniejsza niż promień punktu
    return dx * dx + dy * dy <= POINT_RADIUS * POINT_RADIUS
})
}

/**
 * Obsługa kliknięcia na canvasie:
 * - Jeśli kliknięto w istniejący punkt, zaznaczamy go.
 * - Jeśli kliknięto w puste miejsce, dodajemy nowy punkt i zaznaczamy go.
 */
canvas.addEventListener("click", (e) => {
// Przeliczamy współrzędne kliknięcia na współrzędne canvasu (uwzględniając skalowanie)
const rect = canvas.getBoundingClientRect()
const scaleX = canvas.width / rect.width
const scaleY = canvas.height / rect.height
const px = (e.clientX - rect.left) * scaleX
const py = (e.clientY - rect.top) * scaleY

const x = Math.round(px - canvas.width / 2)
const y = Math.round(canvas.height / 2 - py)

if (Math.abs(x) > COORD_LIMIT || Math.abs(y) > COORD_LIMIT) return

const clickedIndex = getClickedPointIndex(x, y)
if (clickedIndex !== -1) {
    selectedPoint = clickedIndex // Zaznaczamy punkt
} else {
    points.push({ x, y }) // Dodajemy nowy punkt
    selectedPoint = points.length - 1 // Zaznaczamy nowo dodany punkt
}
redraw() // Odświeżamy rysunek i panel
})

// Usuwa wszystkie punkty i resetuje zaznaczenie
clearBtn.addEventListener("click", () => {
points = []
selectedPoint = null
redraw()
})

// Obsługa dodawania punktu ręcznie
addPointBtn.addEventListener("submit", function (e) {
e.preventDefault()
const x = parseFloat(document.getElementById("inputX").value)
const y = parseFloat(document.getElementById("inputY").value)
if (isPointValidToAdd(x, y)) {
    const clickedIndex = getClickedPointIndex(x, y)
    if (clickedIndex !== -1) {
    selectedPoint = clickedIndex // Zaznaczamy punkt
    alert("Punkt znajduje się zbyt blisko istniejącego.")
    this.reset()
    } else {
    points.push({ x, y })
    selectedPoint = points.length - 1
    this.reset()
    redraw()
    }
} else {
    alert(
    `Wartości muszą mieścić się w zakresie od -${COORD_LIMIT} do ${COORD_LIMIT}`,
    )
}
redraw()
})

// Usuwa konkretny punkt z listy
function removePoint(index) {
if (index >= 0 && index < points.length) {
    points.splice(index, 1)
    selectedPoint = null
    redraw()
}
}

function isPointValidToAdd(x, y) {
return (
    !isNaN(x) &&
    !isNaN(y) &&
    Math.abs(x) <= COORD_LIMIT &&
    Math.abs(y) <= COORD_LIMIT
)
}

// Mapowanie na koordynaty canvas (dodane dla liczb ujemnych)
function toCanvasCoords(x, y) {
return {
    x: canvas.width / 2 + x,
    y: canvas.height / 2 - y,
}
}

// Inicjalne rysowanie po załadowaniu strony
redraw()
