const connectDB = require("../mongo")

async function runAgent(query) {
  const db = await connectDB()

  const raw = await db
    .collection("gov_records")
    .find({})
    .toArray()

  query = query.toLowerCase()

  // 1. Only Budget Estimates
  let data = raw.filter(d =>
    d["Budget type"] &&
    d["Budget type"].toLowerCase() === "budget estimates"
  )

  // 2. Detect Year
  let detectedYear = null
  const yearMatch = query.match(/\b(19|20)\d{2}\b/)
  if (yearMatch) detectedYear = yearMatch[0]

  function extractYear(str) {
    if (!str) return null
    const match = str.match(/\d{4}/)
    return match ? match[0] : null
  }

  if (detectedYear) {
    data = data.filter(d => extractYear(d.Year) === detectedYear)
  }

  // 3. Detect States
  const allStates = [...new Set(data.map(d => d.State))]
  let detectedStates = []

  allStates.forEach(state => {
    if (query.includes(state.toLowerCase())) {
      detectedStates.push(state)
    }
  })

  if (detectedStates.length) {
    data = data.filter(d => detectedStates.includes(d.State))
  } else {
    detectedStates = allStates
  }

  // 4. Detect Sector Column
  const ignore = ["_id", "State", "Country", "Year", "Budget type"]
  const sectorColumns = Object.keys(data[0]).filter(c => !ignore.includes(c))

  function normalize(text) {
    return text
      .toLowerCase()
      .split("(")[0]
      .replace(/,/g, "")
      .replace(/\s+/g, " ")
      .trim()
  }

  let sectorIndex = {}
  sectorColumns.forEach(col => {
    sectorIndex[normalize(col)] = col
  })

  let detectedSector = null

  // Full match first
  Object.keys(sectorIndex).forEach(cleanName => {
    if (query.includes(cleanName)) {
      detectedSector = sectorIndex[cleanName]
    }
  })

  // Fallback partial match
  if (!detectedSector) {
    Object.keys(sectorIndex).forEach(cleanName => {
      cleanName.split(" ").forEach(word => {
        if (query.includes(word) && !detectedSector) {
          detectedSector = sectorIndex[cleanName]
        }
      })
    })
  }

  // 5. Build State Comparison
  let comparison = {}

  if (detectedSector) {
    data.forEach(row => {
      let value = row[detectedSector]
      if (value === null || value === undefined || isNaN(value)) value = 0
      comparison[row.State] = value
    })
  }

  // 6. Generate Insight
  let insight = "Budget Estimates data retrieved."
  const states = Object.keys(comparison)

  if (states.length >= 2) {
    const sorted = states.sort((a, b) => comparison[b] - comparison[a])
    const highest = sorted[0]
    const lowest  = sorted[sorted.length - 1]
    insight = `${highest} spends the most on ${normalize(detectedSector)}. ${lowest} spends the least.`
  }

  return {
    query,
    year: detectedYear,
    states,
    sector: detectedSector,
    comparison,
    data,
    insight
  }
}

module.exports = { runAgent }
