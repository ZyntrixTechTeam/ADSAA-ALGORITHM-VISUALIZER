"use strict";

// ==========================================
// GLOBAL ELEMENTS AND STATE
// ==========================================

const barsContainer = document.getElementById("bars");
const algorithmSelect = document.getElementById("algorithm");
const speedInput = document.getElementById("speed");
const statusText = document.getElementById("status");
const comparisonsText = document.getElementById("comparisons");
const swapsText = document.getElementById("swaps");
const moduleContent = document.getElementById("module-content");

let values = [];
let comparisons = 0;
let swaps = 0;
let isSorting = false;

let stack = [];
let queue = [];

let customGraph = null;

if (algorithmSelect) {
    algorithmSelect.addEventListener("change", updateComplexity);
    updateComplexity();
}

// ==========================================
// COMMON HELPERS
// ==========================================

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function updateStats() {
    if (comparisonsText) comparisonsText.textContent = comparisons;
    if (swapsText) swapsText.textContent = swaps;
}

function updateComplexity() {
    if (!algorithmSelect) return;

    const complexityText = document.getElementById("complexity");
    if (!complexityText) return;

    const complexities = {
        bubble: "Bubble Sort: Best O(n), Average O(n²), Worst O(n²). Space: O(1).",
        selection: "Selection Sort: Best O(n²), Average O(n²), Worst O(n²). Space: O(1).",
        insertion: "Insertion Sort: Best O(n), Average O(n²), Worst O(n²). Space: O(1).",
        merge: "Merge Sort: Best O(n log n), Average O(n log n), Worst O(n log n). Space: O(n).",
        quick: "Quick Sort: Best O(n log n), Average O(n log n), Worst O(n²). Space: O(log n) average."
    };

    complexityText.textContent =
        complexities[algorithmSelect.value] || complexities.bubble;
}

// ==========================================
// SORTING VISUALIZER
// ==========================================

function generateArray() {
    if (isSorting) return;

    values = Array.from(
        { length: 25 },
        () => Math.floor(Math.random() * 90) + 10
    );

    comparisons = 0;
    swaps = 0;
    updateStats();
    renderBars();

    if (statusText) statusText.textContent = "New array generated!";
}

function useUserNumbers() {
    if (isSorting) return;

    const input = document.getElementById("userNumbers");
    if (!input) return;

    const raw = input.value.trim();
    const numbers = raw.split(",").map(n => n.trim());

    if (
        !raw ||
        numbers.some(n => n === "" || !Number.isFinite(Number(n)))
    ) {
        alert("Enter valid numbers separated by commas.");
        return;
    }

    values = numbers.map(Number);
    comparisons = 0;
    swaps = 0;
    updateStats();
    renderBars();

    if (statusText) {
        statusText.textContent = "Your numbers are ready to sort!";
    }
}

function renderBars(highlight = [], sorted = []) {
    if (!barsContainer) return;

    barsContainer.innerHTML = "";

    const maxValue = Math.max(1, ...values.map(v => Math.abs(v)));

    values.forEach((value, index) => {
        const bar = document.createElement("div");
        bar.className = "bar";
        bar.style.height =
            `${Math.max(5, Math.abs(value) / maxValue * 200)}px`;
        bar.title = String(value);
        bar.textContent = String(value);

        if (sorted.includes(index)) {
            bar.style.background = "#22c55e";
        } else if (highlight.includes(index)) {
            bar.style.background = "#f97316";
        }

        barsContainer.appendChild(bar);
    });
}

async function compareAndHighlight(i, j) {
    comparisons++;
    updateStats();
    renderBars([i, j]);
    await sleep(Number(speedInput?.value || 100));
}

async function bubbleSort() {
    for (let i = 0; i < values.length - 1; i++) {
        for (let j = 0; j < values.length - i - 1; j++) {
            await compareAndHighlight(j, j + 1);

            if (values[j] > values[j + 1]) {
                [values[j], values[j + 1]] =
                    [values[j + 1], values[j]];
                swaps++;
                updateStats();
                renderBars([j, j + 1]);
            }
        }
    }
}

async function selectionSort() {
    for (let i = 0; i < values.length - 1; i++) {
        let minIndex = i;

        for (let j = i + 1; j < values.length; j++) {
            await compareAndHighlight(minIndex, j);

            if (values[j] < values[minIndex]) {
                minIndex = j;
            }
        }

        if (minIndex !== i) {
            [values[i], values[minIndex]] =
                [values[minIndex], values[i]];
            swaps++;
            updateStats();
        }

        renderBars();
    }
}

async function insertionSort() {
    for (let i = 1; i < values.length; i++) {
        const key = values[i];
        let j = i - 1;

        while (j >= 0) {
            await compareAndHighlight(j, j + 1);

            if (values[j] <= key) break;

            values[j + 1] = values[j];
            swaps++;
            updateStats();
            j--;
        }

        values[j + 1] = key;
        renderBars();
    }
}

async function mergeSort() {
    async function merge(left, mid, right) {
        const leftArr = values.slice(left, mid + 1);
        const rightArr = values.slice(mid + 1, right + 1);

        let i = 0;
        let j = 0;
        let k = left;

        while (i < leftArr.length && j < rightArr.length) {
            comparisons++;
            updateStats();
            await compareAndHighlight(k, k);

            if (leftArr[i] <= rightArr[j]) {
                values[k++] = leftArr[i++];
            } else {
                values[k++] = rightArr[j++];
                swaps++;
            }

            updateStats();
            renderBars();
        }

        while (i < leftArr.length) {
            values[k++] = leftArr[i++];
            renderBars();
        }

        while (j < rightArr.length) {
            values[k++] = rightArr[j++];
            renderBars();
        }
    }

    async function divide(left, right) {
        if (left >= right) return;

        const mid = Math.floor((left + right) / 2);

        await divide(left, mid);
        await divide(mid + 1, right);
        await merge(left, mid, right);
    }

    await divide(0, values.length - 1);
}

async function quickSort(low, high) {
    if (low >= high) return;

    const pivot = values[high];
    let i = low - 1;

    for (let j = low; j < high; j++) {
        await compareAndHighlight(j, high);

        if (values[j] <= pivot) {
            i++;

            if (i !== j) {
                [values[i], values[j]] = [values[j], values[i]];
                swaps++;
                updateStats();
                renderBars([i, j]);
            }
        }
    }

    const pivotIndex = i + 1;

    if (pivotIndex !== high) {
        [values[pivotIndex], values[high]] =
            [values[high], values[pivotIndex]];
        swaps++;
        updateStats();
        renderBars([pivotIndex, high]);
    }

    await quickSort(low, pivotIndex - 1);
    await quickSort(pivotIndex + 1, high);
}

async function startSort() {
    if (isSorting) return;

    if (values.length === 0) generateArray();
    if (values.length === 0) return;

    isSorting = true;
    comparisons = 0;
    swaps = 0;
    updateStats();

    if (statusText) statusText.textContent = "Sorting in progress...";

    try {
        const algorithm = algorithmSelect?.value || "bubble";

        if (algorithm === "selection") {
            await selectionSort();
        } else if (algorithm === "insertion") {
            await insertionSort();
        } else if (algorithm === "merge") {
            await mergeSort();
        } else if (algorithm === "quick") {
            await quickSort(0, values.length - 1);
        } else {
            await bubbleSort();
        }

        renderBars([], values.map((_, i) => i));

        if (statusText) statusText.textContent = "Sorting completed!";
    } catch (error) {
        console.error("Sorting error:", error);
        if (statusText) statusText.textContent = "Sorting failed. Check the console.";
    } finally {
        isSorting = false;
    }
}

// ==========================================
// MODULE NAVIGATION
// ==========================================

function showModule(module) {
    const sortingVisualizer =
        document.getElementById("sorting-visualizer");

    if (sortingVisualizer) {
        sortingVisualizer.style.display =
            module === "sorting" ? "block" : "none";
    }

    const modules = {
        sorting: `
            <h2>Sorting Algorithms</h2>
            <p>Arrange data in ascending order using different algorithms.</p>
            <p>Available: Bubble Sort, Selection Sort, Insertion Sort, Merge Sort and Quick Sort.</p>
            <p>Use the sorting visualizer below to test them.</p>
        `,

        searching: `
            <h2>Searching Algorithms</h2>
            <p>Enter your array elements separated by commas:</p>
            <input id="searchInputArray" type="text"
                value="23, 32, 54, 56, 63, 87, 98"
                placeholder="Example: 10, 20, 30, 40">
            <button onclick="updateSearchArray()">Set Array</button>
            <p id="searchArray">Set your array to begin.</p>
            <label for="searchTarget">Target number:</label>
            <input id="searchTarget" type="number" value="25">
            <button onclick="runSearch('linear')">Linear Search</button>
            <button onclick="runSearch('binary')">Binary Search</button>
            <p id="searchResult">Choose a search algorithm.</p>
            <p>Linear Search: O(n) time.</p>
            <p>Binary Search: O(log n) time on sorted data.</p>
        `,

        graphs: `
            <h2>Graph Algorithms</h2>
            <p>Enter your own graph nodes and edges.</p>
            <label for="graphNodes">Nodes (comma-separated):</label>
            <input id="graphNodes" type="text" value="A, B, C, D, E"
                placeholder="A, B, C, D">
            <label for="graphEdges">Edges (comma-separated pairs):</label>
            <input id="graphEdges" type="text" value="A-B, A-C, B-D, C-E"
                placeholder="A-B, B-C, C-D">
            <button onclick="setCustomGraph()">Create Graph</button>
            <div id="customGraphOutput"></div>
            <label for="graphStart">Starting node:</label>
            <input id="graphStart" type="text" value="A">
            <label for="graphEnd">Destination node:</label>
            <input id="graphEnd" type="text" value="E">
            <button onclick="runGraphAlgorithm('bfs')">BFS</button>
            <button onclick="runGraphAlgorithm('dfs')">DFS</button>
            <button onclick="runGraphAlgorithm('dijkstra')">Shortest Path</button>
            <p id="graphResult">Create a graph to begin.</p>
            <p>BFS and DFS traverse the graph. Shortest Path finds the fewest edges in an unweighted graph.</p>
        `,

        structures: `
            <h2>Data Structures</h2>
            <label for="structureValue">Value:</label>
            <input id="structureValue" placeholder="Enter a value">
            <button onclick="addStack()">Push to Stack</button>
            <button onclick="removeStack()">Pop Stack</button>
            <button onclick="addQueue()">Enqueue</button>
            <button onclick="removeQueue()">Dequeue</button>

            <h3>Stack (LIFO)</h3>
            <p id="stackResult">Stack is empty.</p>
            <div id="stackDiagram" style="display:flex;flex-direction:column;align-items:center;gap:5px;margin:15px;"></div>

            <h3>Queue (FIFO)</h3>
            <p id="queueResult">Queue is empty.</p>
            <div id="queueDiagram" style="display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:5px;margin:15px;"></div>


            <h3>Binary Tree Traversal</h3>
            <p>Example tree: A is the root, B and C are its children, and D, E, F, G are the next level.</p>
            <button onclick="showTree('inorder')">Inorder</button>
            <button onclick="showTree('preorder')">Preorder</button>
            <button onclick="showTree('postorder')">Postorder</button>
            <p id="treeResult">Choose a tree traversal.</p>
        `,

       
    };

    if (!Object.prototype.hasOwnProperty.call(modules, module)) {
        if (moduleContent) {
            moduleContent.innerHTML = "<h2>Module not found</h2>";
        }
        return;
    }

    if (moduleContent) {
        moduleContent.innerHTML = modules[module];
    }

    if (module === "searching") {
        const input = document.getElementById("searchInputArray");
        const output = document.getElementById("searchArray");

        if (input && output) {
            values = input.value.split(",").map(Number);
            output.textContent = "Array: " + values.join(", ");
        }
    }

    if (module === "structures") {
        updateStructures();
    }

}

// Make navigation callable by HTML onclick handlers.
window.showModule = showModule;

// ==========================================
// SEARCHING ALGORITHMS
// ==========================================

function updateSearchArray() {
    const input = document.getElementById("searchInputArray");
    const output = document.getElementById("searchArray");
    const result = document.getElementById("searchResult");

    if (!input || !output || !result) return;

    const raw = input.value.trim();
    const array = raw.split(",").map(s => s.trim());

    if (!raw || array.some(s => s === "" || !Number.isFinite(Number(s)))) {
        result.textContent = "Enter valid numbers separated by commas.";
        return;
    }

    values = array.map(Number);
    output.textContent = "Array: " + values.join(", ");
    result.textContent = "Array updated. Choose a search algorithm.";
}

async function runSearch(type) {
    const targetInput = document.getElementById("searchTarget");
    const result = document.getElementById("searchResult");

    if (!targetInput || !result) return;

    const target = Number(targetInput.value);
    const array = [...values];

    if (!array.length) {
        result.textContent = "Set an array first.";
        return;
    }

    if (!Number.isFinite(target)) {
        result.textContent = "Enter a valid target number.";
        return;
    }

    if (type === "linear") {
        for (let i = 0; i < array.length; i++) {
            result.textContent = `Checking index ${i}: ${array[i]}`;
            await sleep(300);

            if (array[i] === target) {
                result.textContent =
                    `Found ${target} at index ${i} in the entered array.`;
                return;
            }
        }
    } else if (type === "binary") {
        const sorted = [...array].sort((a, b) => a - b);
        let left = 0;
        let right = sorted.length - 1;

        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            result.textContent = `Checking middle value: ${sorted[mid]}`;
            await sleep(300);

            if (sorted[mid] === target) {
                result.textContent =
                    `Found ${target} at index ${mid} in the sorted array: ${sorted.join(", ")}.`;
                return;
            }

            if (sorted[mid] < target) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
    } else {
        result.textContent = "Unknown search algorithm.";
        return;
    }

    result.textContent = `${target} was not found in the array.`;
}

// ==========================================
 // GRAPH ALGORITHMS
 // ==========================================

customGraph = new Map([
    ["A", ["B", "C"]],
    ["B", ["A", "D", "E"]],
    ["C", ["A", "F"]],
    ["D", ["B"]],
    ["E", ["B", "F"]],
    ["F", ["C", "E"]]
]);

function setCustomGraph() {
    const output = document.getElementById("customGraphOutput");

    if (output) {
        output.innerHTML = `
            <h3>Graph Created</h3>
            <p>A — B, A — C, B — D, B — E, C — F, E — F</p>
        `;
    }

    const result = document.getElementById("graphResult");

    if (result) {
        result.textContent = "Graph ready! Choose BFS, DFS, or Shortest Path.";
    }
}

function runGraphAlgorithm(type) {
    const result = document.getElementById("graphResult");

    if (!result) return;

    type = type.toLowerCase();

    const startInput = document.getElementById("graphStart");
    const endInput = document.getElementById("graphEnd");

    const start = startInput ? startInput.value.trim() : "A";
    const end = endInput ? endInput.value.trim() : "F";

    if (!customGraph.has(start)) {
        result.textContent = "Starting node not found in the graph.";
        return;
    }

    if (type === "bfs") {
        const visited = new Set([start]);
        const queue = [start];
        const order = [];

        while (queue.length > 0) {
            const node = queue.shift();
            order.push(node);

            for (const neighbor of customGraph.get(node)) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push(neighbor);
                }
            }
        }

        result.textContent = "BFS Traversal: " + order.join(" → ");
        return;
    }

    if (type === "dfs") {
        const visited = new Set();
        const order = [];

        function dfs(node) {
            visited.add(node);
            order.push(node);

            for (const neighbor of customGraph.get(node)) {
                if (!visited.has(neighbor)) {
                    dfs(neighbor);
                }
            }
        }

        dfs(start);
        result.textContent = "DFS Traversal: " + order.join(" → ");
        return;
    }

    if (type === "dijkstra") {
        if (!customGraph.has(end)) {
            result.textContent = "Destination node not found in the graph.";
            return;
        }

        const visited = new Set([start]);
        const queue = [[start, [start]]];
        let path = null;

        while (queue.length > 0) {
            const [node, currentPath] = queue.shift();

            if (node === end) {
                path = currentPath;
                break;
            }

            for (const neighbor of customGraph.get(node)) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push([neighbor, [...currentPath, neighbor]]);
                }
            }
        }

        result.textContent = path
            ? "Shortest Path: " + path.join(" → ")
                + " | Number of edges: " + (path.length - 1)
            : "No path exists between these nodes.";

        return;
    }

    result.textContent = "Unknown graph algorithm.";
}

window.runGraphAlgorithm = runGraphAlgorithm;
window.setCustomGraph = setCustomGraph;
// ==========================================
// DATA STRUCTURES: STACK, QUEUE, LINKED LIST
// ==========================================

// STACK — Last In, First Out (LIFO)
function addStack() {
    const input = document.getElementById("structureValue");
    if (!input || input.value.trim() === "") {
        alert("Enter a value to push.");
        return;
    }

    stack.push(input.value.trim());
    input.value = "";
    updateStructures();
}

function removeStack() {
    if (stack.length === 0) {
        alert("Stack is empty!");
        return;
    }

    const removed = stack.pop();
    updateStructures();

    const result = document.getElementById("stackResult");
    if (result) result.textContent = "Popped: " + removed;
}

// QUEUE — First In, First Out (FIFO)
function addQueue() {
    const input = document.getElementById("structureValue");
    if (!input || input.value.trim() === "") {
        alert("Enter a value to enqueue.");
        return;
    }

    queue.push(input.value.trim());
    input.value = "";
    updateStructures();
}

function removeQueue() {
    if (queue.length === 0) {
        alert("Queue is empty!");
        return;
    }

    const removed = queue.shift();
    updateStructures();

    const result = document.getElementById("queueResult");
    if (result) result.textContent = "Dequeued: " + removed;
}

// UPDATE STACK AND QUEUE DIAGRAMS
function updateStructures() {
    const stackResult = document.getElementById("stackResult");
    const stackDiagram = document.getElementById("stackDiagram");
    const queueResult = document.getElementById("queueResult");
    const queueDiagram = document.getElementById("queueDiagram");

    if (stackResult) {
        stackResult.textContent = stack.length
            ? "Stack: " + stack.join(" → ") + " (bottom to top)"
            : "Stack is empty.";
    }

    if (stackDiagram) {
        stackDiagram.replaceChildren();

        [...stack].reverse().forEach((value, index) => {
            const box = document.createElement("div");
            box.textContent = index === 0 ? "TOP → " + value : value;
            box.style.cssText =
                "padding:12px 24px;border:2px solid #6366f1;border-radius:6px;min-width:70px;text-align:center;font-weight:bold;";
            stackDiagram.appendChild(box);
        });
    }

    if (queueResult) {
        queueResult.textContent = queue.length
            ? "FRONT → " + queue.join(" → ") + " → REAR"
            : "Queue is empty.";
    }

    if (queueDiagram) {
        queueDiagram.replaceChildren();

        queue.forEach((value, index) => {
            const box = document.createElement("div");
            box.textContent =
                (index === 0 ? "FRONT: " : "") + value +
                (index === queue.length - 1 ? " :REAR" : "");
            box.style.cssText =
                "padding:12px 18px;border:2px solid #0d9488;border-radius:6px;text-align:center;font-weight:bold;";
            queueDiagram.appendChild(box);
        });
    }
}
  

// Make functions accessible to HTML onclick buttons
window.addStack = addStack;
window.removeStack = removeStack;
window.addQueue = addQueue;
window.removeQueue = removeQueue;
window.updateStructures = updateStructures;


// ==========================================
// BINARY TREE TRAVERSAL
// ==========================================

function showTree(type) {
    const result = document.getElementById("treeResult");
    if (!result) return;

    const tree = {
        value: "A",
        left: {
            value: "B",
            left: { value: "D", left: null, right: null },
            right: { value: "E", left: null, right: null }
        },
        right: {
            value: "C",
            left: { value: "F", left: null, right: null },
            right: { value: "G", left: null, right: null }
        }
    };

    const order = [];

    function inorder(node) {
        if (!node) return;
        inorder(node.left);
        order.push(node.value);
        inorder(node.right);
    }

    function preorder(node) {
        if (!node) return;
        order.push(node.value);
        preorder(node.left);
        preorder(node.right);
    }

    function postorder(node) {
        if (!node) return;
        postorder(node.left);
        postorder(node.right);
        order.push(node.value);
    }

    if (type === "inorder") {
        inorder(tree);
    } else if (type === "preorder") {
        preorder(tree);
    } else if (type === "postorder") {
        postorder(tree);
    } else {
        result.textContent = "Unknown traversal type.";
        return;
    }

    result.textContent =
        type.charAt(0).toUpperCase() + type.slice(1) +
        " Traversal: " + order.join(" → ");
}

window.showTree = showTree;
