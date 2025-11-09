import { useEffect, useMemo, useState } from 'react'
import '../App.css'
import ReportModal, { type ReportDialogContext } from '../components/ReportModal'

type RawReport = Record<string, unknown>

type ReportRecord = {
  ticketId: string
  issueType: string
  title: string
  description: string
  status: string
  createdAt: string
  location?: string | null
}

type ReportsResponse = {
  data?: RawReport[]
  pagination?: {
    totalResults?: number
    totalPages?: number
    currentPage?: number
  }
  meta?: {
    total?: number
    total_pages?: number
    current_page?: number
  }
}

type StatusFilterKey = 'all' | 'Pending Review' | 'In Progress' | 'Resolved'

const STATUS_FILTERS: Array<{ label: string; value: StatusFilterKey }> = [
  { label: 'All', value: 'all' },
  { label: 'Pending Review', value: 'Pending Review' },
  { label: 'In Progress', value: 'In Progress' },
  { label: 'Resolved', value: 'Resolved' },
]

const STATUS_BADGE_CLASSNAME: Record<Exclude<StatusFilterKey, 'all'>, string> = {
  'Pending Review': 'status-chip status-chip--pending',
  'In Progress': 'status-chip status-chip--in-progress',
  Resolved: 'status-chip status-chip--resolved',
}

const REPORTS_API_URL = import.meta.env.VITE_REPORT_API_URL ?? ''

const normalizeReport = (item: RawReport): ReportRecord | null => {
  if (!item || typeof item !== 'object') {
    return null
  }

  const readString = (keys: string[], fallback = ''): string => {
    for (const key of keys) {
      const value = item[key]
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim()
      }
    }
    return fallback
  }

  const ticketId = readString(['ticket_id', 'ticketId', 'TicketID'])
  const issueType = readString(['issue_type', 'issueType', 'IssueType'])
  const title = readString(['title', 'Title'])
  const description = readString(['description', 'Description'])
  const status = readString(['status', 'Status'])
  const createdAt = readString(['created_at', 'createdAt', 'dateSubmitted', 'DateSubmitted'])

  if (ticketId.length === 0) {
    return null
  }

  const locationValue = (() => {
    const raw =
      item.location ??
      item.Location ??
      item.site ??
      null
    return typeof raw === 'string' && raw.trim().length > 0 ? raw.trim() : null
  })()

  return {
    ticketId,
    issueType,
    title: title || 'Untitled Report',
    description,
    status: status || 'Pending Review',
    createdAt: createdAt || new Date().toISOString(),
    location: locationValue,
  }
}

const formatDisplayDate = (value: string) => {
  try {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return value
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    })
  } catch {
    return value
  }
}

const getStatusClassName = (status: string) => {
  if (status in STATUS_BADGE_CLASSNAME) {
    return STATUS_BADGE_CLASSNAME[status as Exclude<StatusFilterKey, 'all'>]
  }
  return 'status-chip'
}

const buildPageArray = (totalPages: number, currentPage: number) => {
  if (totalPages <= 6) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const pages = new Set<number>()
  pages.add(1)
  pages.add(totalPages)

  const neighbors = [currentPage - 1, currentPage, currentPage + 1].filter(
    (value) => value > 1 && value < totalPages,
  )

  neighbors.forEach((item) => pages.add(item))
  if (currentPage - 2 > 1) {
    pages.add(currentPage - 2)
  }
  if (currentPage + 2 < totalPages) {
    pages.add(currentPage + 2)
  }

  return Array.from(pages).sort((a, b) => a - b)
}

type LegacyPagination = NonNullable<ReportsResponse['pagination']>
type MetaPagination = NonNullable<ReportsResponse['meta']>

const extractPagination = (payload: ReportsResponse & Record<string, unknown>): LegacyPagination | MetaPagination | null => {
  const candidateValues: unknown[] = []
  if (payload.pagination && typeof payload.pagination === 'object') {
    candidateValues.push(payload.pagination)
  }
  if (payload.meta && typeof payload.meta === 'object') {
    candidateValues.push(payload.meta)
  }

  for (const candidate of candidateValues) {
    if (!candidate || typeof candidate !== 'object') {
      continue
    }

    if ('totalResults' in candidate || 'totalPages' in candidate || 'currentPage' in candidate) {
      return candidate as LegacyPagination
    }

    if ('total' in candidate || 'total_pages' in candidate || 'current_page' in candidate) {
      return candidate as MetaPagination
    }
  }

  return null
}

const parseJsonSafely = async (response: Response) => {
  const text = await response.text()
  const trimmed = text.trim()

  if (trimmed.length === 0) {
    return {}
  }

  try {
    return JSON.parse(trimmed) as ReportsResponse | Record<string, unknown>
  } catch (error) {
    console.error('Reports API returned non-JSON payload:', trimmed.slice(0, 200))
    throw new Error('Report API did not return valid JSON.')
  }
}

const MyReports = () => {
  const [reports, setReports] = useState<ReportRecord[]>([])
  const [totalResults, setTotalResults] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(6)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeStatus, setActiveStatus] = useState<StatusFilterKey>('all')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedReport, setSelectedReport] = useState<ReportRecord | null>(null)
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [reportContext, setReportContext] = useState<ReportDialogContext | null>(null)

  useEffect(() => {
    const fetchReports = async () => {
      if (!REPORTS_API_URL) {
        setErrorMessage('Report API endpoint is not configured. Please set VITE_REPORT_API_URL.')
        return
      }

      setIsLoading(true)
      setErrorMessage(null)

      try {
        const url = new URL(REPORTS_API_URL)
        url.searchParams.set('page', currentPage.toString())
        url.searchParams.set('limit', pageSize.toString())
        if (url.hostname.includes('ngrok')) {
          url.searchParams.set('ngrok-skip-browser-warning', 'true')
        }

        const response = await fetch(url.toString(), {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to load reports (${response.status})`)
        }

        const payload = (await parseJsonSafely(response)) as ReportsResponse & Record<string, unknown>
        const rawCollection =
          Array.isArray(payload.data)
            ? payload.data
            : Array.isArray((payload as { reports?: RawReport[] }).reports)
              ? (payload as { reports?: RawReport[] }).reports ?? []
              : []

        const normalized = rawCollection
          .map((item) => normalizeReport(item))
          .filter((item): item is ReportRecord => item !== null)

        setReports(normalized)
        const paginationData = extractPagination(payload)

        const resolvedTotal =
          (paginationData && 'totalResults' in paginationData && typeof paginationData.totalResults === 'number'
            ? paginationData.totalResults
            : undefined) ??
          (paginationData && 'total' in paginationData && typeof paginationData.total === 'number'
            ? paginationData.total
            : undefined) ??
          normalized.length

        const resolvedTotalPages =
          (paginationData && 'totalPages' in paginationData && typeof paginationData.totalPages === 'number'
            ? paginationData.totalPages
            : undefined) ??
          (paginationData && 'total_pages' in paginationData && typeof paginationData.total_pages === 'number'
            ? paginationData.total_pages
            : undefined) ??
          Math.max(1, Math.ceil(resolvedTotal / pageSize))

        setTotalResults(resolvedTotal)
        setTotalPages(resolvedTotalPages)
      } catch (error) {
        console.error('Failed to load reports', error)
        const message = error instanceof Error ? error.message : 'Unknown error occurred.'
        setErrorMessage(message)
        setReports([])
        setTotalResults(0)
        setTotalPages(1)
      } finally {
        setIsLoading(false)
      }
    }

    fetchReports()
  }, [currentPage, pageSize])

  useEffect(() => {
    const handleExternalReport = (event: Event) => {
      const detail = (event as CustomEvent<Partial<ReportDialogContext> | undefined>).detail
      setReportContext({
        flaggedMessage: detail?.flaggedMessage ?? 'Manual report from navigation bar',
        reason: detail?.reason ?? 'User opened report dialog from the navigation.',
        issueType: detail?.issueType,
        ticketId: detail?.ticketId,
        timestamp: detail?.timestamp,
        details: detail?.details,
      })
      setIsReportOpen(true)
    }

    window.addEventListener('secureSBU:openReport', handleExternalReport)
    return () => {
      window.removeEventListener('secureSBU:openReport', handleExternalReport)
    }
  }, [])

  const filteredReports = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    return reports.filter((report) => {
      const matchesStatus = activeStatus === 'all' || report.status === activeStatus
      if (normalizedSearch.length === 0) {
        return matchesStatus
      }

      const haystack = `${report.ticketId} ${report.issueType} ${report.title} ${report.description}`.toLowerCase()
      return matchesStatus && haystack.includes(normalizedSearch)
    })
  }, [reports, activeStatus, searchTerm])

  const startIndex = totalResults === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endIndex = totalResults === 0 ? 0 : startIndex + filteredReports.length - 1

  const pageNumbers = buildPageArray(totalPages, currentPage)

  const handleStatusChange = (status: StatusFilterKey) => {
    setActiveStatus(status)
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value)
  }

  const handleNewReportClick = () => {
    setReportContext({
      flaggedMessage: 'Manual report from My Reports page',
      reason: 'User opened report dialog from My Reports page.',
    })
    setIsReportOpen(true)
  }

  const closeReportModal = () => {
    setIsReportOpen(false)
    setReportContext(null)
  }

  return (
    <div className="reports-page">
      <header className="reports-header">
        <div className="reports-header__titles">
          <h1 className="reports-title">My Submitted Reports</h1>
          <p className="reports-subtitle">Track the progress of every security report you have submitted.</p>
        </div>

        <button type="button" className="reports-new-button" onClick={handleNewReportClick}>
          <span aria-hidden="true">＋</span> New Report
        </button>
      </header>

      <section className="reports-controls">
        <div className="reports-search">
          <span className="reports-search__icon" aria-hidden="true">
            🔍
          </span>
          <input
            type="search"
            placeholder="Search by Ticket ID or keyword..."
            value={searchTerm}
            onChange={handleSearchChange}
            aria-label="Search reports"
          />
        </div>

        <div className="reports-filters" role="tablist" aria-label="Status Filters">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              role="tab"
              aria-selected={activeStatus === filter.value}
              className={`reports-filter-button ${activeStatus === filter.value ? 'active' : ''}`}
              onClick={() => handleStatusChange(filter.value)}
              disabled={isLoading}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </section>

      <section className="reports-table-wrapper" aria-live="polite">
        <table className="reports-table">
          <thead>
            <tr>
              <th scope="col">Ticket ID</th>
              <th scope="col">Issue Type</th>
              <th scope="col">Date Submitted</th>
              <th scope="col">Status</th>
              <th scope="col" className="reports-table__action-column">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="reports-empty">
                  Loading reports…
                </td>
              </tr>
            ) : filteredReports.length === 0 ? (
              <tr>
                <td colSpan={5} className="reports-empty">
                  {searchTerm.trim().length > 0
                    ? 'No reports match your search.'
                    : activeStatus !== 'all'
                      ? 'No reports found for this status.'
                      : 'No reports available yet.'}
                </td>
              </tr>
            ) : (
              filteredReports.map((report) => (
                <tr key={report.ticketId}>
                  <td>{report.ticketId}</td>
                  <td>
                    <div className="reports-issue">
                      <span className="reports-issue__label">{report.issueType}</span>
                      <p className="reports-issue__title">{report.title}</p>
                    </div>
                  </td>
                  <td>{formatDisplayDate(report.createdAt)}</td>
                  <td>
                    <span className={getStatusClassName(report.status)}>{report.status}</span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="reports-link-button"
                      onClick={() => setSelectedReport(report)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <footer className="reports-footer">
        <p className="reports-results-count">
          Showing {startIndex} to {endIndex} of {totalResults} results
        </p>
        <nav className="reports-pagination" aria-label="Reports pagination">
          <button
            type="button"
            className="reports-pagination__nav"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            ‹
          </button>

          {pageNumbers.map((pageNumber, index) => {
            const previousPage = pageNumbers[index - 1]
            const shouldRenderEllipsis = previousPage && pageNumber - previousPage > 1

            return (
              <span key={pageNumber} className="reports-pagination__item">
                {shouldRenderEllipsis && <span className="reports-pagination__ellipsis">…</span>}
                <button
                  type="button"
                  className={`reports-pagination__page ${pageNumber === currentPage ? 'active' : ''}`}
                  onClick={() => setCurrentPage(pageNumber)}
                  aria-current={pageNumber === currentPage ? 'page' : undefined}
                >
                  {pageNumber}
                </button>
              </span>
            )
          })}

          <button
            type="button"
            className="reports-pagination__nav"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            aria-label="Next page"
          >
            ›
          </button>
        </nav>
      </footer>

      {errorMessage && (
        <div role="alert" className="reports-error-banner">
          {errorMessage}
        </div>
      )}

      {selectedReport && (
        <div
          className="reports-detail-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-detail-heading"
          onClick={() => setSelectedReport(null)}
        >
          <div
            className="reports-detail-modal"
            role="document"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="reports-detail-close"
              onClick={() => setSelectedReport(null)}
              aria-label="Close"
            >
              ×
            </button>
            <header className="reports-detail-header">
              <h2 id="report-detail-heading">{selectedReport.title}</h2>
              <span className={getStatusClassName(selectedReport.status)}>{selectedReport.status}</span>
            </header>
            <dl className="reports-detail-list">
              <div>
                <dt>Ticket ID</dt>
                <dd>{selectedReport.ticketId}</dd>
              </div>
              <div>
                <dt>Issue Type</dt>
                <dd>{selectedReport.issueType}</dd>
              </div>
              <div>
                <dt>Date Submitted</dt>
                <dd>{formatDisplayDate(selectedReport.createdAt)}</dd>
              </div>
              {selectedReport.location && (
                <div>
                  <dt>Location</dt>
                  <dd>{selectedReport.location}</dd>
                </div>
              )}
            </dl>
            <section className="reports-detail-description">
              <h3>Description</h3>
              <p>{selectedReport.description}</p>
            </section>
          </div>
        </div>
      )}

      <ReportModal
        isOpen={isReportOpen}
        onClose={closeReportModal}
        context={reportContext}
        fallbackTitle="Suspicious report submitted from My Reports page"
        successButtonLabel="Back to My Reports"
      />
    </div>
  )
}

export default MyReports

