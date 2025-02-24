import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Building2, Users2, Clock } from 'lucide-react';
import * as XLSX from 'xlsx';
import styles from './ui/SystemsOverview.module.css';

// Define interfaces for type safety
interface SystemsDataType {
  total: number;
  inHouse: number;
  subcontracted: number;
  activeSubcontractors: number;
  onHold: number;
  notStarted: number;
  totalContractValue: number;
}

// Update the date handling utility
const formatExcelDate = (date: any): string => {
  if (!date) return '-';
  try {
    // Handle Excel serial numbers
    if (typeof date === 'number') {
      const excelDate = new Date((date - 25569) * 86400 * 1000);
      return excelDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
    // Handle date objects
    if (date instanceof Date) {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
    // Handle ISO strings
    if (typeof date === 'string' && date.includes('-')) {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
    return String(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
};

// Update the interface to specify date types
interface TableRowType {
  sr: number;
  system: string;
  ownership: string;
  subcontractor: string;
  status: string;
  startDate: string | Date | number;
  endDate: string | Date | number;
  contractValue: string;
}

// Add safe storage utilities

const safeJSONStringify = (data: any) => {
  try {
    return JSON.stringify(data);
  } catch (e) {
    console.error('Error stringifying data:', e);
    return null;
  }
};

const SystemsOverview = () => {
  const [systemsData, setSystemsData] = useState<SystemsDataType>({
    total: 0,
    inHouse: 0,
    subcontracted: 0,
    activeSubcontractors: 0,
    onHold: 0,
    notStarted: 0,
    totalContractValue: 0
  });
  
  const [showTable, setShowTable] = useState(false);
  const [tableData, setTableData] = useState<TableRowType[]>([]);

  useEffect(() => {
    const loadServicesData = async () => {
      try {
        const response = await fetch('Project Performance Template.xlsx');
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, {
          cellDates: true,
          cellNF: false, // Disable number formatting
          cellText: false // Disable text formatting
        });

        const sheet = workbook.Sheets['Services'];
        const data = XLSX.utils.sheet_to_json(sheet, { 
          header: 1,
          raw: true, // Get raw values
          dateNF: 'yyyy-mm-dd' // Use ISO date format
        }) as any[][];

        // Ensure data is serializable
        const tableRows = data
          .slice(2, -1)
          .map(row => {
            if (!row || !Array.isArray(row)) return null;
            
            try {
              // Ensure all values are serializable
              const processedRow: TableRowType = {
                sr: Number(row[0]) || 0,
                system: String(row[1] || ''),
                ownership: String(row[2] || ''),
                subcontractor: String(row[3] || '-'),
                status: String(row[4] || ''),
                startDate: formatExcelDate(row[5]), // Convert directly to string
                endDate: formatExcelDate(row[6]), // Convert directly to string
                contractValue: row[7] ? `${(Number(row[7])/1000000).toFixed(1)}M` : '-'
              };

              // Validate serialization
              const test = safeJSONStringify(processedRow);
              if (!test) return null;

              return processedRow;
            } catch (err) {
              console.error('Error processing row:', err);
              return null;
            }
          })
          .filter((row): row is TableRowType => row !== null && row.system !== '');

        // Validate final data
        const serializedData = safeJSONStringify(tableRows);
        if (serializedData) {
          setTableData(tableRows);
        }

        // Process data for charts with validation
        const processedData: SystemsDataType = {
          total: 0,
          inHouse: 0,
          subcontracted: 0,
          activeSubcontractors: 0,
          onHold: 0,
          notStarted: 0,
          totalContractValue: 0
        };

        // Update data processing with validation
        for (const row of data.slice(2, -1)) {
          if (!row || !Array.isArray(row)) continue;

          const ownership = String(row[2] || '');
          const status = String(row[4] || '');
          const contractValue = Number(row[7]) || 0;

          if (ownership) {
            processedData.total++;
            
            if (ownership === 'In-House') {
              processedData.inHouse++;
            } else if (ownership === 'Subcontractor') {
              processedData.subcontracted++;
              processedData.totalContractValue += contractValue;
            }

            if (status === 'Active') {
              processedData.activeSubcontractors++;
            } else if (status === 'On Hold') {
              processedData.onHold++;
            } else if (status === 'Not Started') {
              processedData.notStarted++;
            }
          }
        }

        setSystemsData(processedData);
      } catch (error) {
        console.error('Error loading services data:', error);
      }
    };

    loadServicesData();
  }, []);

  // Calculate percentages
  const inHousePercentage = (systemsData.inHouse / systemsData.total) * 100;
  const subcontractedPercentage = (systemsData.subcontracted / systemsData.total) * 100;

  // Pie chart data
  const ownershipData = [
    { name: 'In-House', value: systemsData.inHouse, color: '#4ECDC4' },
    { name: 'Subcontracted', value: systemsData.subcontracted, color: '#FF9F1C' }
  ];

  const statusData = [
    { name: 'Active', value: systemsData.activeSubcontractors, color: '#2AB7CA' },
    { name: 'On Hold', value: systemsData.onHold, color: '#FFD93D' },
    { name: 'Not Started', value: systemsData.notStarted, color: '#FF6B6B' }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Existing header */}
        <div className={styles.header}>
          <h2 className={styles.title}>Systems Overview</h2>
          <p className={styles.subtitle}>Project Scope of Work Analysis</p>
        </div>

        {/* Existing charts grid */}
        <div className={styles.chartsGrid}>
          {/* ... Your existing chart components ... */}
          {/* Stats Column */}
          <div className={styles.chartCard}>
            <div className={styles.statsGrid}>
              <div className={`${styles.statCard} ${styles.cyan}`}>
                <div className={styles.statHeader}>
                  <Building2 className={`${styles.statIcon} ${styles.cyan}`} size={20} />
                  <h3 className={styles.statTitle}>Total Systems</h3>
                </div>
                <p className={`${styles.statValue} ${styles.cyan}`}>{systemsData.total}</p>
              </div>
              
              <div className={`${styles.statCard} ${styles.orange}`}>
                <div className={styles.statHeader}>
                  <Users2 className={`${styles.statIcon} ${styles.orange}`} size={20} />
                  <h3 className={styles.statTitle}>Contracts Value</h3>
                </div>
                <p className={`${styles.statValue} ${styles.orange}`}>
                  {(systemsData.totalContractValue / 1000000).toFixed(1)}M
                </p>
              </div>
              
              <div className={`${styles.statCard} ${styles.green}`}>
                <div className={styles.statHeader}>
                  <Clock className={`${styles.statIcon} ${styles.green}`} size={20} />
                  <h3 className={styles.statTitle}>Active Systems</h3>
                </div>
                <p className={`${styles.statValue} ${styles.green}`}>
                  {systemsData.activeSubcontractors}
                </p>
              </div>
            </div>
          </div>

          {/* Ownership Distribution */}
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Ownership Distribution</h3>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ownershipData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, value }) => 
                      `${value} systems ${name}`
                    }
                  >
                    {ownershipData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} Systems`, '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className={styles.legendGrid}>
              <div className={styles.legendItem}>
                <p className={styles.legendLabel}>In-House</p>
                <p className={`${styles.legendValue} ${styles.cyan}`}>
                  {inHousePercentage.toFixed(0)}%
                </p>
              </div>
              <div className={styles.legendItem}>
                <p className={styles.legendLabel}>Subcontracted</p>
                <p className={`${styles.legendValue} ${styles.orange}`}>
                  {subcontractedPercentage.toFixed(0)}%
                </p>
              </div>
            </div>
          </div>

          {/* Status Overview */}
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Systems Status</h3>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, value }) =>
                      `${value} systems ${name}`
                    }
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} Systems`, '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className={styles.statusGrid}>
              {statusData.map((status, index) => (
                <div key={index} className={styles.legendItem}>
                  <p className={styles.legendLabel}>{status.name}</p>
                  <p className={styles[`status${status.name.replace(' ', '')}`]}>
                    {status.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* New Table Section */}
        <div className={styles.tableSection}>
          <div className={styles.checkboxContainer}>
            <input
              type="checkbox"
              id="showTable"
              className={styles.checkbox}
              checked={showTable}
              onChange={(e) => setShowTable(e.target.checked)}
            />
            <label htmlFor="showTable" className={styles.checkboxLabel}>
              Show Detailed Systems Data
            </label>
          </div>

          {showTable && (
            <div className={styles.tableContainer}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>SR#</th>
                    <th>System</th>
                    <th>Ownership</th>
                    <th>Subcontractor</th>
                    <th>Status</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Contract Value</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row, index) => (
                    <tr key={index}>
                      <td>{row.sr}</td>
                      <td>{row.system}</td>
                      <td>
                        <span className={`${styles.tableHighlight} ${
                          row.ownership === 'In-House' 
                            ? styles.ownershipInHouse 
                            : styles.ownershipSubcontractor
                        }`}>
                          {row.ownership}
                        </span>
                      </td>
                      <td>{row.subcontractor}</td>
                      <td>
                        <span className={`${styles.tableHighlight} ${
                          row.status === 'Active'
                            ? styles.statusHighlightActive
                            : row.status === 'On Hold'
                            ? styles.statusHighlightHold
                            : styles.statusHighlightNotStarted
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td>{formatExcelDate(row.startDate)}</td>
                      <td>{formatExcelDate(row.endDate)}</td>
                      <td>{row.contractValue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemsOverview;