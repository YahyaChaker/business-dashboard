import React, { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Sparkles, Calendar, Clock, Building2, TrendingUp, Wallet } from "lucide-react";
import * as XLSX from "xlsx";
import styles from "./ui/CompactProjectHeader.module.css";

interface ProjectData {
  title: string;
  reference: string;
  client: string;
  startDate: string;
  endDate: string;
  value: number;
  duration: string;
  progress: number;
}

const defaultProjectData: ProjectData = {
  title: "Loading...",
  reference: "...",
  client: "Loading...",
  startDate: "...",
  endDate: "...",
  value: 0,
  duration: "...",
  progress: 0,
};

const CompactProjectHeader: React.FC = () => {
  const [projectData, setProjectData] = useState<ProjectData>(defaultProjectData);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const loadProjectData = async () => {
      try {
        const response = await fetch("Project Performance Template.xlsx").then((res) =>
          res.arrayBuffer()
        );
        const workbook = XLSX.read(response, { cellStyles: true, cellDates: true, cellNF: true });

        const overviewSheet = workbook.Sheets["Project Overview"];
        if (!overviewSheet) throw new Error("Project Overview sheet not found");

        const overviewData = XLSX.utils.sheet_to_json(overviewSheet, { header: 1 }) as any[][];

        if (!overviewData || overviewData.length < 7) {
          throw new Error("Invalid data structure in Excel file");
        }

        const startDate = new Date(overviewData[4][3]);
        const endDate = new Date(overviewData[5][3]);
        const totalDuration = endDate.getTime() - startDate.getTime();
        const elapsed = Date.now() - startDate.getTime();
        const progress = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);

        const months = Math.ceil(totalDuration / (1000 * 60 * 60 * 24 * 30.44));
         
        const data: ProjectData = {
          title: overviewData[1][3] || "No Title",
          reference: overviewData[2][3] || "No Reference",
          client: overviewData[3][3] || "No Client",
          startDate: startDate.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "2-digit",
          }),
          endDate: endDate.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "2-digit",
          }),
          value: overviewData[6][3] || 0,
          duration: `${months} months`,
          progress: Math.round(progress),
        };

        setProjectData(data);
      } catch (error) {
        console.error("Error loading project data:", error);
        setProjectData({
          ...defaultProjectData,
          title: "Error loading data",
          client: "Please check console for details",
        });
      }
    };

    loadProjectData();
  }, []);

  return (
    <div className={styles.pageHeader}>
      <div className={styles.headerBackground} />
      <div 
        className={`${styles.cardWrapper} ${isHovered ? styles.cardHovered : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Card className={styles.card}>
        <CardContent className={styles.cardContent}>
          <div className={styles.mainLayout}>
            
            {/* Left Section with Enhanced Visual Hierarchy */}
            <div className={styles.leftSection}>
              <div className={styles.logoSection}>
                <img src="/Qatari Diar.svg" alt="Qatari Diar Logo" className={styles.clientLogo} />
                <div className={styles.logoDivider} />
              </div>
              <div className={styles.projectInfo}>
                <div className={styles.referenceWrapper}>
                  <span className={styles.referenceBadge}>
                    <Building2 size={14} className={styles.badgeIcon} />
                    {projectData.reference}
                  </span>
                  <Sparkles className={styles.sparkleIcon} size={16} />
                </div>
                <h2 className={styles.projectTitle}>{projectData.title}</h2>
                <p className={styles.clientName}>{projectData.client}</p>
              </div>
            </div>

            {/* Right Section with Enhanced Branding */}
            <div className={styles.rightSection}>
              <img 
                src="/Elegancia FM.png" 
                alt="Elegancia FM Logo" 
                className={styles.companyLogo} 
              />  
            </div>

          </div> 

          <div className={styles.centerSection}>
            <div className={styles.metricsGrid}>
              {/* Center Section with Visual Progress */}
              <div className={styles.centerSection}>
                
                <div className={styles.metricsGrid}>
                  <div className={styles.metricItem}>
                    <span className={styles.metricIcon}>
                      <Wallet size={16} />
                    </span>
                    <div className={styles.metricContent}>
                      <span className={styles.metricLabel}>Project Value</span>
                      <span className={styles.valueAmount}>
                        QAR {projectData.value.toLocaleString()}
                      </span>
                    </div>
                  </div>  

                  <div className={styles.metricItem}>
                    <span className={styles.metricIcon}>
                      <Clock size={16} />
                    </span>
                    <div className={styles.metricContent}>
                      <span className={styles.metricValue}>{projectData.duration}</span>
                      <span className={styles.metricLabel}>Duration</span>
                    </div>
                  </div>

                  <div className={styles.progressSection}>
                    <div className={styles.progressCircleWrapper}>
                      <div 
                        className={`${styles.progressCircle} ${styles[`progress${Math.round(projectData.progress / 10) * 10}`]}`}
                      >
                        <div className={styles.progressInner}>
                          <TrendingUp size={20} className={styles.progressIcon} />
                          <span className={styles.progressText}>{projectData.progress}%</span>
                          <span className={styles.progressLabel}>Completion</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.metricItem}>
                    <span className={styles.metricIcon}>
                      <Calendar size={16} />
                    </span>
                    <div className={styles.metricContent}>
                      <span className={styles.metricValue}>{projectData.startDate}</span>
                      <span className={styles.metricLabel}>Start Date</span>
                    </div>
                  </div>

                  <div className={styles.metricItem}>
                    <span className={styles.metricIcon}>
                      <Calendar size={16} />
                    </span>
                    <div className={styles.metricContent}>
                      <span className={styles.metricValue}>{projectData.endDate}</span>
                      <span className={styles.metricLabel}>End Date</span>
                    </div>
                  </div>       

                </div>
              </div>
            </div>
          </div>

        </CardContent>  
        </Card>
      </div>
    </div>
  );
};

export default CompactProjectHeader;