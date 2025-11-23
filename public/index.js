const stock_check = document.getElementById('stock_check');
const restock = document.getElementById("restock");
const restock_detail = document.getElementById("restock_detail");
const nuke_restock = document.getElementById("NUKE-Restock");
const nuke_stock = document.getElementById("NUKE-Stock");
const nuke_both = document.getElementById("NUKE-Both");
const stockTable = document.getElementById("stock-table");
const restockTable = document.getElementById("restock-table");

function renderStockTable(data) {
    const tbody = document.querySelector("#stock-table tbody");
    tbody.innerHTML = "";
    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td class="p-2 text-gray-500" colspan="4">No data</td></tr>`;
        return;
    }
    data.forEach(item => {
        const row = `<tr>
            <td class="p-2">${item.item_id}</td>
            <td class="p-2">${item.item_name || ''}</td>
            <td class="p-2">${item.item_qty}</td>
            <td class="p-2">${item.updated_at || ''}</td>
        </tr>`;
        tbody.innerHTML += row;
    });
}

function renderRestockTable(data) {
    const tbody = document.querySelector("#restock-table tbody");
    tbody.innerHTML = "";
    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td class="p-2 text-gray-500" colspan="4">No data</td></tr>`;
        return;
    }

const sorted = data
  .filter(item => item.added_at) // optional: buang yang null
  .slice()
  .sort((a, b) => new Date(b.added_at) - new Date(a.added_at));
  
    const limited = sorted.slice(0, 3);
    limited.forEach(item => {
        const row = `<tr>
            <td class="p-2">${item.restock_id}</td>
            <td class="p-2">${item.item_id}</td>
            <td class="p-2">${item.quantity}</td>
            <td class="p-2">${item.added_at || ''}</td>
        </tr>`;
        tbody.innerHTML += row;
    });
}

stock_check.addEventListener('click', () => {
    console.log('THIS BLOCK IS NOT USED ANYMORE, YOU CAN DELETE IT(index.js : 54)');
    fetchAndRenderStock();
});

restock.addEventListener('click', async () => {
    try {
        console.log('generating restock...');
        await fetch("/restock");           // tunggu server selesai restock
        await fetchAndRenderStock();       // baru render stock table
        await fetchAndRenderRestock();     // baru render restock table
        console.log('restock generated and tables updated.');
    } catch(err) {
        console.error(err);
    }
});

restock_detail.addEventListener('click', () => {
    console.log("THIS BLOCK IS NOT USED ANYMORE, YOU CAN DELETE IT(index.js : 72)");
    fetchAndRenderRestock();
});

nuke_restock.addEventListener('click', () => {
    console.log("NUKING restock_detail table...");
    fetch("/nuke-restock")
        .then(res => res.text())
        .then(msg => console.log("NUKE MESSAGE: ", msg))
        .catch(err => console.error(err));
});

nuke_stock.addEventListener('click', () => {
    console.log("NUKING stock table...");
    fetch("/nuke-stock")
        .then(res => res.text())
        .then(msg => {
            console.log("NUKE MESSAGE: ", msg);
            fetchAndRenderStock();
        })
        .catch(err => console.error(err));
});

nuke_both.addEventListener('click', () => {
    console.log("NUKING both stock and restock_detail tables...");
    fetch("/nuke-both")
        .then(res => res.text())
        .then(msg => {
            console.log("NUKE MESSAGE: ", msg);
            fetchAndRenderStock();
            fetchAndRenderRestock();
        })
        .catch(err => console.error(err));
});

function fetchAndRenderStock() {
    fetch("/api/stock_table")
        .then(res => {
            if (!res.ok) {
                // try to read body as text to surface server error
                return res.text().then(t => { throw new Error(t || `status ${res.status}`); });
            }
            return res.json();
        })
        .then(data => renderStockTable(data))
        .catch(err => {
            console.error("Failed to fetch stock table:", err);
            // show friendly message in table
            const tbody = document.querySelector("#stock-table tbody");
            tbody.innerHTML = `<tr><td class="p-2 text-red-600" colspan="4">Error loading stock</td></tr>`;
        });
}

function fetchAndRenderRestock() {
    fetch("/restock-info")
        .then(res => res.json())
        .then(data => renderRestockTable(data))
        .catch(err => console.error(err));
}

// populate tables on load
document.addEventListener('DOMContentLoaded', () => {
    fetchAndRenderStock();
    fetchAndRenderRestock();
});