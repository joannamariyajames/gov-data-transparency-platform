fetch("http://localhost:5000/api/data")
.then(res => res.json())
.then(data => {

const schemes = data.map(d => d.scheme);
const budgets = data.map(d => d.budget);

const ctx = document.getElementById("budgetChart");

new Chart(ctx, {
type: "bar",
data: {
labels: schemes,
datasets: [{
label: "Budget Allocation",
data: budgets
}]
}
});

});