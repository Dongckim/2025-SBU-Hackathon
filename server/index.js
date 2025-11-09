import express from 'express'
import cors from 'cors'

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors())
app.use(express.json())

const buildTicketId = (() => {
  let counter = 8394
  return () => {
    counter += 1
    return `SBU-${counter}`
  }
})()

const reports = [
  {
    ticket_id: 'SBU-84393',
    issue_type: 'Suspicious Individual',
    title: 'Suspicious person near library entrance',
    description:
      'Observed an individual acting suspiciously near the main library entrance around 2 PM.',
    status: 'Pending Review',
    created_at: '2023-10-27 14:30:00',
  },
  {
    ticket_id: 'SBU-84392',
    issue_type: 'Suspicious Individual',
    title: 'Person seen tailgating into secure lab',
    description: 'An individual followed a staff member through the secure lab doors without a badge.',
    status: 'Pending Review',
    created_at: '2023-10-26 18:00:00',
  },
]

app.get('/api/reports', (req, res) => {
  const page = Number.parseInt(req.query.page ?? '1', 10)
  const limit = Number.parseInt(req.query.limit ?? '10', 10)

  const start = (page - 1) * limit
  const end = start + limit

  const results = reports.slice(start, end)

  res.json({
    data: results,
    pagination: {
      totalResults: reports.length,
      totalPages: Math.ceil(reports.length / limit),
      currentPage: page,
    },
  })
})

app.post('/api/reports', (req, res) => {
  const { issue_type, title, description, location } = req.body ?? {}

  if (!issue_type || !title || !description) {
    return res.status(400).json({
      message: 'issue_type, title, and description are required.',
    })
  }

  const ticket_id = buildTicketId()
  const created_at = new Date().toISOString()

  const report = {
    ticket_id,
    issue_type,
    title,
    description,
    location: location ?? null,
    status: 'Pending Review',
    created_at,
  }

  reports.unshift(report)

  return res.status(201).json({
    message: 'Report submitted successfully',
    report,
  })
})

app.listen(PORT, () => {
  console.log(`Mock report API listening on http://localhost:${PORT}`)
})

