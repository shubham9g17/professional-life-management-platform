'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface Transaction {
  id: string
  amount: number
  type: 'INCOME' | 'EXPENSE'
  category: string
  subcategory?: string
  description: string
  date: Date
  tags: string[]
}

interface FinancialExportProps {
  transactions: Transaction[]
}

export function FinancialExport({ transactions }: FinancialExportProps) {
  const [format, setFormat] = useState<'CSV' | 'JSON'>('CSV')
  const [isExporting, setIsExporting] = useState(false)

  const exportToCSV = () => {
    // Create CSV header
    const headers = ['Date', 'Type', 'Category', 'Subcategory', 'Description', 'Amount', 'Tags']
    
    // Create CSV rows
    const rows = transactions.map(t => [
      new Date(t.date).toISOString(),
      t.type,
      t.category,
      t.subcategory || '',
      t.description,
      t.amount.toString(),
      t.tags.join('; '),
    ])

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n')

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportToJSON = () => {
    // Create JSON content
    const jsonContent = JSON.stringify(transactions, null, 2)

    // Create and download file
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.json`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExport = async () => {
    setIsExporting(true)
    
    try {
      if (format === 'CSV') {
        exportToCSV()
      } else {
        exportToJSON()
      }
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export data. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Financial Data</h3>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="export-format">Export Format</Label>
          <select
            id="export-format"
            value={format}
            onChange={(e) => setFormat(e.target.value as 'CSV' | 'JSON')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="CSV">CSV (Comma-Separated Values)</option>
            <option value="JSON">JSON (JavaScript Object Notation)</option>
          </select>
        </div>

        <div className="p-4 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-700 mb-2">
            <strong>Export includes:</strong>
          </p>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>{transactions.length} transaction(s)</li>
            <li>All transaction details (date, type, category, amount, etc.)</li>
            <li>Tags and subcategories</li>
          </ul>
        </div>

        {format === 'CSV' && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>CSV Format:</strong> Compatible with Excel, Google Sheets, and other spreadsheet applications.
            </p>
          </div>
        )}

        {format === 'JSON' && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>JSON Format:</strong> Structured data format suitable for importing into other applications or databases.
            </p>
          </div>
        )}

        <Button
          onClick={handleExport}
          disabled={isExporting || transactions.length === 0}
          className="w-full"
        >
          {isExporting ? 'Exporting...' : `Export as ${format}`}
        </Button>

        {transactions.length === 0 && (
          <p className="text-sm text-gray-500 text-center">
            No transactions to export
          </p>
        )}
      </div>
    </div>
  )
}
