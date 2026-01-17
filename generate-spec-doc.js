const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        Header, Footer, AlignmentType, LevelFormat, HeadingLevel,
        BorderStyle, WidthType, ShadingType, PageNumber, PageBreak } = require('docx');
const fs = require('fs');

// Color scheme
const COLORS = {
  primary: "1B4F72",
  secondary: "2E86AB",
  accent: "F18F01",
  success: "28A745",
  warning: "FFC107",
  light: "F8F9FA",
  dark: "212529",
  muted: "6C757D"
};

// Helper functions
const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };

function createHeaderCell(text, width) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: COLORS.primary, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({
      children: [new TextRun({ text, bold: true, color: "FFFFFF", font: "Arial", size: 20 })]
    })]
  });
}

function createCell(text, width, fill = "FFFFFF") {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({
      children: [new TextRun({ text, font: "Arial", size: 20 })]
    })]
  });
}

function createCodeBlock(code) {
  return new Paragraph({
    shading: { fill: "F4F4F4", type: ShadingType.CLEAR },
    spacing: { before: 100, after: 100 },
    children: [new TextRun({ text: code, font: "Consolas", size: 18 })]
  });
}

// Build the document
const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "Arial", color: COLORS.primary },
        paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: COLORS.secondary },
        paragraph: { spacing: { before: 300, after: 150 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: COLORS.dark },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } },
    ]
  },
  numbering: {
    config: [
      { reference: "bullets",
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
          { level: 1, format: LevelFormat.BULLET, text: "○", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 1440, hanging: 360 } } } }
        ] },
      { reference: "numbers",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 }, // A4
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({ text: "SOLVARI RADAR ENGINE", font: "Arial", size: 18, color: COLORS.muted }),
            new TextRun({ text: "  |  Technical Specification v2.1", font: "Arial", size: 18, color: COLORS.muted })
          ]
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "Solvari Digital  •  AetherLink.ai  •  ", font: "Arial", size: 16, color: COLORS.muted }),
            new TextRun({ text: "Page ", font: "Arial", size: 16, color: COLORS.muted }),
            new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 16, color: COLORS.muted })
          ]
        })]
      })
    },
    children: [
      // ============================================
      // TITLE PAGE
      // ============================================
      new Paragraph({ spacing: { before: 2000 } }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "SOLVARI RADAR ENGINE", font: "Arial", size: 56, bold: true, color: COLORS.primary })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200 },
        children: [new TextRun({ text: "Vakmensen Discovery & Acquisition Platform", font: "Arial", size: 32, color: COLORS.secondary })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 100 },
        children: [new TextRun({ text: "met KVK Handelsregister Integratie", font: "Arial", size: 24, color: COLORS.accent })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 400 },
        children: [new TextRun({ text: "Technical Specification Document", font: "Arial", size: 24, color: COLORS.muted })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 100 },
        children: [new TextRun({ text: "Version 2.1  •  January 2026", font: "Arial", size: 20, color: COLORS.muted })]
      }),
      new Paragraph({ spacing: { before: 1500 } }),

      // Info box
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [4500, 4500],
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders,
                width: { size: 4500, type: WidthType.DXA },
                shading: { fill: "E8F4F8", type: ShadingType.CLEAR },
                margins: { top: 150, bottom: 150, left: 200, right: 200 },
                children: [
                  new Paragraph({ children: [new TextRun({ text: "Prepared by:", bold: true, font: "Arial", size: 20 })] }),
                  new Paragraph({ children: [new TextRun({ text: "AetherLink AI Consultancy", font: "Arial", size: 20 })] }),
                  new Paragraph({ children: [new TextRun({ text: "Constance van der Vlist, CEO", font: "Arial", size: 18, color: COLORS.muted })] }),
                  new Paragraph({ children: [new TextRun({ text: "Marco Rink, CTO", font: "Arial", size: 18, color: COLORS.muted })] }),
                ]
              }),
              new TableCell({
                borders,
                width: { size: 4500, type: WidthType.DXA },
                shading: { fill: "E8F4F8", type: ShadingType.CLEAR },
                margins: { top: 150, bottom: 150, left: 200, right: 200 },
                children: [
                  new Paragraph({ children: [new TextRun({ text: "Prepared for:", bold: true, font: "Arial", size: 20 })] }),
                  new Paragraph({ children: [new TextRun({ text: "Solvari Digital", font: "Arial", size: 20 })] }),
                  new Paragraph({ children: [new TextRun({ text: "Coen Verver, CCO", font: "Arial", size: 18, color: COLORS.muted })] }),
                  new Paragraph({ children: [new TextRun({ text: "Arno van der Laan, CTO", font: "Arial", size: 18, color: COLORS.muted })] }),
                ]
              })
            ]
          })
        ]
      }),

      new Paragraph({ children: [new PageBreak()] }),

      // ============================================
      // EXECUTIVE SUMMARY
      // ============================================
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("1. Executive Summary")] }),

      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({
          text: "De Solvari Radar Engine is een geavanceerd multi-source discovery platform voor het systematisch opsporen, kwalificeren en acquireren van vakmensen in de Nederlandse bouw- en renovatiesector. Dit document beschrijft de complete technische architectuur inclusief de operationele KVK Handelsregister API integratie met live GPS-gebaseerde kaartweergave.",
          font: "Arial", size: 22
        })]
      }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("1.1 Huidige Implementatie Status")] }),

      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [3500, 2500, 3000],
        rows: [
          new TableRow({
            children: [
              createHeaderCell("Component", 3500),
              createHeaderCell("Status", 2500),
              createHeaderCell("Details", 3000)
            ]
          }),
          new TableRow({ children: [
            createCell("KVK API Integratie", 3500),
            createCell("LIVE", 2500, "D4EDDA"),
            createCell("Test + Productie ready", 3000, "D4EDDA")
          ]}),
          new TableRow({ children: [
            createCell("GPS Coördinaten", 3500),
            createCell("LIVE", 2500, "D4EDDA"),
            createCell("Via vestigingsprofiel", 3000, "D4EDDA")
          ]}),
          new TableRow({ children: [
            createCell("OpenStreetMap + Leaflet", 3500),
            createCell("LIVE", 2500, "D4EDDA"),
            createCell("Interactieve kaart", 3000, "D4EDDA")
          ]}),
          new TableRow({ children: [
            createCell("4-Ring Classificatie", 3500),
            createCell("LIVE", 2500, "D4EDDA"),
            createCell("AI-powered scoring", 3000, "D4EDDA")
          ]}),
          new TableRow({ children: [
            createCell("Pipeline Control", 3500),
            createCell("LIVE", 2500, "D4EDDA"),
            createCell("Full-width UI", 3000, "D4EDDA")
          ]})
        ]
      }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300 }, children: [new TextRun("1.2 Strategische Doelstellingen")] }),

      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [3000, 3000, 3000],
        rows: [
          new TableRow({
            children: [
              createHeaderCell("Metric", 3000),
              createHeaderCell("Huidige Situatie", 3000),
              createHeaderCell("Target met Radar", 3000)
            ]
          }),
          new TableRow({ children: [
            createCell("Nieuwe vakmensen/maand", 3000),
            createCell("50-100", 3000, "FFF3CD"),
            createCell("500-1000", 3000, "D4EDDA")
          ]}),
          new TableRow({ children: [
            createCell("Cost per acquisition", 3000),
            createCell("€150-200", 3000, "FFF3CD"),
            createCell("€25-50", 3000, "D4EDDA")
          ]}),
          new TableRow({ children: [
            createCell("Time to first contact", 3000),
            createCell("3-5 dagen", 3000, "FFF3CD"),
            createCell("<24 uur", 3000, "D4EDDA")
          ]}),
          new TableRow({ children: [
            createCell("Conversion rate", 3000),
            createCell("5-8%", 3000, "FFF3CD"),
            createCell("15-25%", 3000, "D4EDDA")
          ]}),
          new TableRow({ children: [
            createCell("Data coverage vakmensen", 3000),
            createCell("40%", 3000, "FFF3CD"),
            createCell("95%+", 3000, "D4EDDA")
          ]})
        ]
      }),

      new Paragraph({ children: [new PageBreak()] }),

      // ============================================
      // KVK INTEGRATION - NEW SECTION
      // ============================================
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("2. KVK Handelsregister Integratie")] }),

      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({
          text: "De KVK API integratie is volledig operationeel en vormt de kern van de vakmensen discovery. Hieronder de technische specificaties van de werkende implementatie.",
          font: "Arial", size: 22
        })]
      }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.1 API Configuratie")] }),

      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [3000, 6000],
        rows: [
          new TableRow({
            children: [
              createHeaderCell("Parameter", 3000),
              createHeaderCell("Waarde", 6000)
            ]
          }),
          new TableRow({ children: [
            createCell("Test Base URL", 3000),
            createCell("https://api.kvk.nl/test/api/", 6000)
          ]}),
          new TableRow({ children: [
            createCell("Productie Base URL", 3000, "E8F4F8"),
            createCell("https://api.kvk.nl/api/", 6000, "E8F4F8")
          ]}),
          new TableRow({ children: [
            createCell("API Key Header", 3000),
            createCell("apikey: l7xx...", 6000)
          ]}),
          new TableRow({ children: [
            createCell("Rate Limit", 3000, "E8F4F8"),
            createCell("1000 calls/dag (test), custom (productie)", 6000, "E8F4F8")
          ]}),
          new TableRow({ children: [
            createCell("Response Format", 3000),
            createCell("JSON (HAL+JSON)", 6000)
          ]})
        ]
      }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300 }, children: [new TextRun("2.2 Geïmplementeerde Endpoints")] }),

      createCodeBlock("GET  /api/v1/kvk/search              - Zoeken in Handelsregister"),
      createCodeBlock("GET  /api/v1/kvk/basisprofiel/{kvk}  - Bedrijfsprofiel ophalen"),
      createCodeBlock("GET  /api/v1/kvk/vestigingsprofiel/{nr}?geoData=true  - GPS coördinaten"),
      createCodeBlock("GET  /api/v1/kvk/vakmensen           - Vakmensen zoeken per plaats/vak"),
      createCodeBlock("POST /api/v1/kvk/scan                - Batch scan + classificatie"),

      new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300 }, children: [new TextRun("2.3 GPS Data Flow")] }),

      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun({
          text: "De GPS coördinaten worden opgehaald via het vestigingsprofiel endpoint met geoData=true parameter:",
          font: "Arial", size: 22
        })]
      }),

      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [2000, 3500, 3500],
        rows: [
          new TableRow({
            children: [
              createHeaderCell("Stap", 2000),
              createHeaderCell("Actie", 3500),
              createHeaderCell("Data", 3500)
            ]
          }),
          new TableRow({ children: [
            createCell("1", 2000, "E8F4F8"),
            createCell("KVK Search", 3500, "E8F4F8"),
            createCell("kvkNummer, vestigingsnummer", 3500, "E8F4F8")
          ]}),
          new TableRow({ children: [
            createCell("2", 2000),
            createCell("Vestigingsprofiel ophalen", 3500),
            createCell("adressen[] met geoData", 3500)
          ]}),
          new TableRow({ children: [
            createCell("3", 2000, "E8F4F8"),
            createCell("GPS extractie", 3500, "E8F4F8"),
            createCell("gpsLatitude, gpsLongitude", 3500, "E8F4F8")
          ]}),
          new TableRow({ children: [
            createCell("4", 2000),
            createCell("Marker plaatsing", 3500),
            createCell("Leaflet marker op kaart", 3500)
          ]})
        ]
      }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300 }, children: [new TextRun("2.4 Test KVK Nummers")] }),

      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [2000, 3500, 2000, 1500],
        rows: [
          new TableRow({
            children: [
              createHeaderCell("KVK Nr", 2000),
              createHeaderCell("Bedrijfsnaam", 3500),
              createHeaderCell("Plaats", 2000),
              createHeaderCell("GPS", 1500)
            ]
          }),
          new TableRow({ children: [
            createCell("68750110", 2000),
            createCell("Test BV Donald", 3500),
            createCell("Lollum", 2000),
            createCell("Ja", 1500, "D4EDDA")
          ]}),
          new TableRow({ children: [
            createCell("69599068", 2000, "E8F4F8"),
            createCell("Test Stichting Bolderbast", 3500, "E8F4F8"),
            createCell("Lochem", 2000, "E8F4F8"),
            createCell("Ja", 1500, "D4EDDA")
          ]}),
          new TableRow({ children: [
            createCell("69599084", 2000),
            createCell("Test EMZ Dagobert", 3500),
            createCell("Amsterdam", 2000),
            createCell("Ja", 1500, "D4EDDA")
          ]}),
          new TableRow({ children: [
            createCell("69599076", 2000, "E8F4F8"),
            createCell("Test VOF Guus", 3500, "E8F4F8"),
            createCell("Almere", 2000, "E8F4F8"),
            createCell("Ja", 1500, "D4EDDA")
          ]})
        ]
      }),

      new Paragraph({ children: [new PageBreak()] }),

      // ============================================
      // SYSTEM ARCHITECTURE
      // ============================================
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("3. System Architecture")] }),

      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({
          text: "De Radar Engine is opgebouwd uit een moderne microservices architectuur met Docker containers.",
          font: "Arial", size: 22
        })]
      }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.1 Docker Services")] }),

      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [2500, 2500, 2000, 2000],
        rows: [
          new TableRow({
            children: [
              createHeaderCell("Service", 2500),
              createHeaderCell("Image", 2500),
              createHeaderCell("Port", 2000),
              createHeaderCell("Status", 2000)
            ]
          }),
          new TableRow({ children: [
            createCell("solvari_frontend", 2500),
            createCell("React + Vite", 2500),
            createCell("3001", 2000),
            createCell("Running", 2000, "D4EDDA")
          ]}),
          new TableRow({ children: [
            createCell("solvari_backend", 2500, "E8F4F8"),
            createCell("FastAPI + Uvicorn", 2500, "E8F4F8"),
            createCell("8001", 2000, "E8F4F8"),
            createCell("Running", 2000, "D4EDDA")
          ]}),
          new TableRow({ children: [
            createCell("solvari_postgres", 2500),
            createCell("PostgreSQL 16", 2500),
            createCell("5433", 2000),
            createCell("Healthy", 2000, "D4EDDA")
          ]}),
          new TableRow({ children: [
            createCell("solvari_redis", 2500, "E8F4F8"),
            createCell("Redis 7", 2500, "E8F4F8"),
            createCell("6380", 2000, "E8F4F8"),
            createCell("Healthy", 2000, "D4EDDA")
          ]})
        ]
      }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300 }, children: [new TextRun("3.2 Five-Layer Architecture")] }),

      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [1500, 2500, 5000],
        rows: [
          new TableRow({
            children: [
              createHeaderCell("Layer", 1500),
              createHeaderCell("Naam", 2500),
              createHeaderCell("Componenten", 5000)
            ]
          }),
          new TableRow({ children: [
            createCell("L5", 1500, "E8F4F8"),
            createCell("ACTION LAYER", 2500, "E8F4F8"),
            createCell("Email sequences, CRM sync, Slack alerts, Reports", 5000, "E8F4F8")
          ]}),
          new TableRow({ children: [
            createCell("L4", 1500, "D4EDDA"),
            createCell("INTELLIGENCE", 2500, "D4EDDA"),
            createCell("Claude AI classification, 4-Ring scoring, Growth prediction", 5000, "D4EDDA")
          ]}),
          new TableRow({ children: [
            createCell("L3", 1500, "FFF3CD"),
            createCell("ENRICHMENT", 2500, "FFF3CD"),
            createCell("KVK profile merge, GPS enrichment, Score calculation", 5000, "FFF3CD")
          ]}),
          new TableRow({ children: [
            createCell("L2", 1500, "FCE4D6"),
            createCell("NORMALIZATION", 2500, "FCE4D6"),
            createCell("Entity resolution, Deduplication, Schema mapping", 5000, "FCE4D6")
          ]}),
          new TableRow({ children: [
            createCell("L1", 1500, "E2D5F1"),
            createCell("DATA INGESTION", 2500, "E2D5F1"),
            createCell("KVK API, Google Places, Playwright scraping", 5000, "E2D5F1")
          ]})
        ]
      }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 400 }, children: [new TextRun("3.3 4-Ring Classification System")] }),

      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [1500, 2000, 3000, 2500],
        rows: [
          new TableRow({
            children: [
              createHeaderCell("Ring", 1500),
              createHeaderCell("Type", 2000),
              createHeaderCell("Profiel", 3000),
              createHeaderCell("Hook Strategy", 2500)
            ]
          }),
          new TableRow({ children: [
            createCell("Ring 1", 1500, "FFCDD2"),
            createCell("Vakman", 2000, "FFCDD2"),
            createCell("Gevestigd bedrijf >5 jaar", 3000, "FFCDD2"),
            createCell("Directe agenda-vulling", 2500, "FFCDD2")
          ]}),
          new TableRow({ children: [
            createCell("Ring 2", 1500, "FFE0B2"),
            createCell("ZZP'er", 2000, "FFE0B2"),
            createCell("Jonge ondernemer, tech-savvy", 3000, "FFE0B2"),
            createCell("Gratis Admin-Bot", 2500, "FFE0B2")
          ]}),
          new TableRow({ children: [
            createCell("Ring 3", 1500, "FFF9C4"),
            createCell("Hobbyist", 2000, "FFF9C4"),
            createCell("Part-timer, nog geen KvK", 3000, "FFF9C4"),
            createCell("Solvari Starter", 2500, "FFF9C4")
          ]}),
          new TableRow({ children: [
            createCell("Ring 4", 1500, "BBDEFB"),
            createCell("Academy", 2000, "BBDEFB"),
            createCell("Interne medewerkers", 3000, "BBDEFB"),
            createCell("Monitoring", 2500, "BBDEFB")
          ]})
        ]
      }),

      new Paragraph({ children: [new PageBreak()] }),

      // ============================================
      // DATABASE DESIGN
      // ============================================
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("4. Database Design")] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("4.1 Core Data Models")] }),

      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun({
          text: "Backend Pydantic models voor KVK data:",
          font: "Arial", size: 22
        })]
      }),

      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [2500, 2500, 4000],
        rows: [
          new TableRow({
            children: [
              createHeaderCell("Model", 2500),
              createHeaderCell("Veld", 2500),
              createHeaderCell("Type / Beschrijving", 4000)
            ]
          }),
          new TableRow({ children: [
            createCell("KvKGeoData", 2500, "E8F4F8"),
            createCell("gpsLatitude", 2500, "E8F4F8"),
            createCell("Optional[float] - WGS84 latitude", 4000, "E8F4F8")
          ]}),
          new TableRow({ children: [
            createCell("", 2500),
            createCell("gpsLongitude", 2500),
            createCell("Optional[float] - WGS84 longitude", 4000)
          ]}),
          new TableRow({ children: [
            createCell("KvKAdres", 2500, "E8F4F8"),
            createCell("type", 2500, "E8F4F8"),
            createCell("bezoekadres / correspondentieadres", 4000, "E8F4F8")
          ]}),
          new TableRow({ children: [
            createCell("", 2500),
            createCell("volledigAdres", 2500),
            createCell("Straat + huisnr + postcode + plaats", 4000)
          ]}),
          new TableRow({ children: [
            createCell("", 2500, "E8F4F8"),
            createCell("geoData", 2500, "E8F4F8"),
            createCell("Optional[KvKGeoData]", 4000, "E8F4F8")
          ]}),
          new TableRow({ children: [
            createCell("KvKVestiging", 2500),
            createCell("vestigingsnummer", 2500),
            createCell("12-digit branch identifier", 4000)
          ]}),
          new TableRow({ children: [
            createCell("", 2500, "E8F4F8"),
            createCell("kvkNummer", 2500, "E8F4F8"),
            createCell("8-digit company identifier", 4000, "E8F4F8")
          ]}),
          new TableRow({ children: [
            createCell("", 2500),
            createCell("adressen", 2500),
            createCell("List[KvKAdres] - met GPS", 4000)
          ]}),
          new TableRow({ children: [
            createCell("", 2500, "E8F4F8"),
            createCell("sbiActiviteiten", 2500, "E8F4F8"),
            createCell("List[KvKSbiActiviteit]", 4000, "E8F4F8")
          ]}),
          new TableRow({ children: [
            createCell("KvKBasisprofiel", 2500),
            createCell("naam", 2500),
            createCell("Handelsnaam bedrijf", 4000)
          ]}),
          new TableRow({ children: [
            createCell("", 2500, "E8F4F8"),
            createCell("rechtsvorm", 2500, "E8F4F8"),
            createCell("BV, VOF, Eenmanszaak, etc.", 4000, "E8F4F8")
          ]}),
          new TableRow({ children: [
            createCell("", 2500),
            createCell("totaalWerkzamePersonen", 2500),
            createCell("Aantal medewerkers", 4000)
          ]})
        ]
      }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300 }, children: [new TextRun("4.2 SBI Code Mapping")] }),

      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [3000, 2000, 4000],
        rows: [
          new TableRow({
            children: [
              createHeaderCell("Solvari Categorie", 3000),
              createHeaderCell("SBI Codes", 2000),
              createHeaderCell("Beschrijving", 4000)
            ]
          }),
          new TableRow({ children: [
            createCell("Warmtepompen", 3000),
            createCell("43.22, 43.22.2", 2000),
            createCell("Loodgieters, CV installateurs", 4000)
          ]}),
          new TableRow({ children: [
            createCell("Zonnepanelen", 3000, "E8F4F8"),
            createCell("43.21, 43.21.2", 2000, "E8F4F8"),
            createCell("Elektrotechnische installatie", 4000, "E8F4F8")
          ]}),
          new TableRow({ children: [
            createCell("Kozijnen", 3000),
            createCell("43.32, 16.23", 2000),
            createCell("Schrijnwerk, timmerwerk", 4000)
          ]}),
          new TableRow({ children: [
            createCell("Dakkapellen", 3000, "E8F4F8"),
            createCell("43.91, 43.99", 2000, "E8F4F8"),
            createCell("Dakdekken, overige bouw", 4000, "E8F4F8")
          ]}),
          new TableRow({ children: [
            createCell("Isolatie", 3000),
            createCell("43.29.1", 2000),
            createCell("Isolatiewerkzaamheden", 4000)
          ]}),
          new TableRow({ children: [
            createCell("Badkamers", 3000, "E8F4F8"),
            createCell("43.22, 43.34", 2000, "E8F4F8"),
            createCell("Loodgieters, stukadoors", 4000, "E8F4F8")
          ]}),
          new TableRow({ children: [
            createCell("Schilderwerk", 3000),
            createCell("43.34.1", 2000),
            createCell("Schilderen, glaszetten", 4000)
          ]}),
          new TableRow({ children: [
            createCell("Tuinaanleg", 3000, "E8F4F8"),
            createCell("81.30", 2000, "E8F4F8"),
            createCell("Landschapsverzorging", 4000, "E8F4F8")
          ]})
        ]
      }),

      new Paragraph({ children: [new PageBreak()] }),

      // ============================================
      // FRONTEND FEATURES
      // ============================================
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("5. Frontend Features")] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("5.1 RadarMap Component")] }),

      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun({
          text: "Interactieve kaart met OpenStreetMap + Leaflet integratie:",
          font: "Arial", size: 22
        })]
      }),

      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [3000, 6000],
        rows: [
          new TableRow({
            children: [
              createHeaderCell("Feature", 3000),
              createHeaderCell("Implementatie", 6000)
            ]
          }),
          new TableRow({ children: [
            createCell("Kaartweergave", 3000),
            createCell("OpenStreetMap tiles via Leaflet (gratis)", 6000)
          ]}),
          new TableRow({ children: [
            createCell("GPS Markers", 3000, "E8F4F8"),
            createCell("Exacte locatie (groen) vs geschat (gestreept)", 6000, "E8F4F8")
          ]}),
          new TableRow({ children: [
            createCell("Stad selectie", 3000),
            createCell("Quick select: Amsterdam, Rotterdam, Utrecht, etc.", 6000)
          ]}),
          new TableRow({ children: [
            createCell("Vakgebied filter", 3000, "E8F4F8"),
            createCell("Loodgieter, elektra, schilder, timmerman, etc.", 6000, "E8F4F8")
          ]}),
          new TableRow({ children: [
            createCell("KVK Search", 3000),
            createCell("Naam, KvK-nummer, plaats, straat zoeken", 6000)
          ]}),
          new TableRow({ children: [
            createCell("Marker popup", 3000, "E8F4F8"),
            createCell("Bedrijfsinfo + GPS status + selectie knop", 6000, "E8F4F8")
          ]}),
          new TableRow({ children: [
            createCell("Batch selectie", 3000),
            createCell("Meerdere bedrijven selecteren voor radar scan", 6000)
          ]}),
          new TableRow({ children: [
            createCell("Kaartlagen", 3000, "E8F4F8"),
            createCell("Street view / Satellite view toggle", 6000, "E8F4F8")
          ]})
        ]
      }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300 }, children: [new TextRun("5.2 Marker Iconen")] }),

      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [3000, 3000, 3000],
        rows: [
          new TableRow({
            children: [
              createHeaderCell("Type", 3000),
              createHeaderCell("Visueel", 3000),
              createHeaderCell("Betekenis", 3000)
            ]
          }),
          new TableRow({ children: [
            createCell("kvkGeoIcon", 3000, "D4EDDA"),
            createCell("Paars + groene rand", 3000, "D4EDDA"),
            createCell("Exacte GPS locatie", 3000, "D4EDDA")
          ]}),
          new TableRow({ children: [
            createCell("kvkIcon", 3000, "FFF3CD"),
            createCell("Paars + gestreepte rand", 3000, "FFF3CD"),
            createCell("Geschatte locatie", 3000, "FFF3CD")
          ]}),
          new TableRow({ children: [
            createCell("ringIcon(1)", 3000, "FFCDD2"),
            createCell("Rood (geselecteerd)", 3000, "FFCDD2"),
            createCell("Geselecteerd voor scan", 3000, "FFCDD2")
          ]})
        ]
      }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300 }, children: [new TextRun("5.3 Tech Stack")] }),

      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "React 18.2 + TypeScript", font: "Arial", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "Vite 5 build tool", font: "Arial", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "Leaflet 1.9.4 + react-leaflet 4.2.1", font: "Arial", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "Framer Motion voor animaties", font: "Arial", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "Tailwind CSS 3.4 styling", font: "Arial", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "Axios voor API calls", font: "Arial", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "Lucide React icons", font: "Arial", size: 22 })]
      }),

      new Paragraph({ children: [new PageBreak()] }),

      // ============================================
      // API INTEGRATIONS
      // ============================================
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("6. Aanvullende API Integraties")] }),

      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({
          text: "Naast KVK zijn de volgende databronnen gepland voor integratie:",
          font: "Arial", size: 22
        })]
      }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("6.1 Tier 1: Essentieel (KVK al live)")] }),

      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [2000, 2500, 2000, 2500],
        rows: [
          new TableRow({
            children: [
              createHeaderCell("Bron", 2000),
              createHeaderCell("Data Types", 2500),
              createHeaderCell("Kosten", 2000),
              createHeaderCell("Status", 2500)
            ]
          }),
          new TableRow({ children: [
            createCell("KVK API", 2000, "D4EDDA"),
            createCell("Bedrijfsdata, SBI, GPS", 2500, "D4EDDA"),
            createCell("€0.09-0.50/call", 2000, "D4EDDA"),
            createCell("LIVE", 2500, "D4EDDA")
          ]}),
          new TableRow({ children: [
            createCell("Google Places", 2000),
            createCell("Reviews, Ratings, Foto's", 2500),
            createCell("17K gratis/mnd", 2000),
            createCell("Gepland", 2500, "FFF3CD")
          ]}),
          new TableRow({ children: [
            createCell("LinkedIn Sales Nav", 2000, "E8F4F8"),
            createCell("Profielen, Skills", 2500, "E8F4F8"),
            createCell("€80-100/user/mnd", 2000, "E8F4F8"),
            createCell("Gepland", 2500, "FFF3CD")
          ]})
        ]
      }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300 }, children: [new TextRun("6.2 Tier 2: Overheid & Certificering")] }),

      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "RVO ISDE Register - Gecertificeerde warmtepomp installateurs (gratis)", font: "Arial", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "EP-Online - Energielabel adviseurs (gratis)", font: "Arial", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "Omgevingsloket - Bouwvergunningen per regio (gratis)", font: "Arial", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "Kadaster PDOK - BAG data, nieuwbouw activiteit (gratis)", font: "Arial", size: 22 })]
      }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300 }, children: [new TextRun("6.3 Tier 3: Brancheverenigingen")] }),

      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "Techniek Nederland - Ledenlijst installatietechniek", font: "Arial", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "Bouwend Nederland - Aannemers en bouwbedrijven", font: "Arial", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "OnderhoudNL - Schilders en onderhoudsbedrijven", font: "Arial", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        children: [new TextRun({ text: "UNETO-VNI - Elektrotechniek", font: "Arial", size: 22 })]
      }),

      new Paragraph({ children: [new PageBreak()] }),

      // ============================================
      // SCORING ENGINE
      // ============================================
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("7. Scoring Engine")] }),

      new Paragraph({
        spacing: { after: 200 },
        children: [new TextRun({
          text: "De Radar Score (0-100) bepaalt de geschiktheid en prioriteit van een vakman.",
          font: "Arial", size: 22
        })]
      }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("7.1 Scoring Factors")] }),

      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [500, 2800, 1000, 4700],
        rows: [
          new TableRow({
            children: [
              createHeaderCell("#", 500),
              createHeaderCell("Factor", 2800),
              createHeaderCell("Weight", 1000),
              createHeaderCell("Berekening", 4700)
            ]
          }),
          new TableRow({ children: [
            createCell("1", 500), createCell("Google Review Score", 2800), createCell("15%", 1000),
            createCell("(rating - 1) / 4 × 100", 4700)
          ]}),
          new TableRow({ children: [
            createCell("2", 500, "E8F4F8"), createCell("Review Volume", 2800, "E8F4F8"), createCell("10%", 1000, "E8F4F8"),
            createCell("min(log10(count + 1) × 5, 100)", 4700, "E8F4F8")
          ]}),
          new TableRow({ children: [
            createCell("3", 500), createCell("KVK Certificeringen", 2800), createCell("12%", 1000),
            createCell("ISDE, RVO registraties", 4700)
          ]}),
          new TableRow({ children: [
            createCell("4", 500, "E8F4F8"), createCell("SBI Specialisatie Match", 2800, "E8F4F8"), createCell("12%", 1000, "E8F4F8"),
            createCell("Matched / total Solvari categories", 4700, "E8F4F8")
          ]}),
          new TableRow({ children: [
            createCell("5", 500), createCell("Growth Signals", 2800), createCell("10%", 1000),
            createCell("Vacatures, bouwvergunningen", 4700)
          ]}),
          new TableRow({ children: [
            createCell("6", 500, "E8F4F8"), createCell("Bedrijfsleeftijd", 2800, "E8F4F8"), createCell("8%", 1000, "E8F4F8"),
            createCell("sigmoid(years, center=5)", 4700, "E8F4F8")
          ]}),
          new TableRow({ children: [
            createCell("7", 500), createCell("GPS Data Kwaliteit", 2800), createCell("8%", 1000),
            createCell("Exacte locatie = +100%", 4700)
          ]}),
          new TableRow({ children: [
            createCell("8", 500, "E8F4F8"), createCell("totaalWerkzamePersonen", 2800, "E8F4F8"), createCell("8%", 1000, "E8F4F8"),
            createCell("Via KVK basisprofiel", 4700, "E8F4F8")
          ]})
        ]
      }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 400 }, children: [new TextRun("7.2 Priority Classification")] }),

      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [1500, 1500, 3500, 2500],
        rows: [
          new TableRow({
            children: [
              createHeaderCell("Priority", 1500),
              createHeaderCell("Score", 1500),
              createHeaderCell("Actie", 3500),
              createHeaderCell("SLA", 2500)
            ]
          }),
          new TableRow({ children: [
            createCell("HOT", 1500, "D4EDDA"), createCell("80-100", 1500, "D4EDDA"),
            createCell("Directe persoonlijke outreach", 3500, "D4EDDA"),
            createCell("Contact < 4 uur", 2500, "D4EDDA")
          ]}),
          new TableRow({ children: [
            createCell("WARM", 1500, "FFF3CD"), createCell("60-79", 1500, "FFF3CD"),
            createCell("Automated email + follow-up", 3500, "FFF3CD"),
            createCell("Contact < 24 uur", 2500, "FFF3CD")
          ]}),
          new TableRow({ children: [
            createCell("NURTURE", 1500, "FCE4D6"), createCell("40-59", 1500, "FCE4D6"),
            createCell("Content marketing, newsletter", 3500, "FCE4D6"),
            createCell("Weekly", 2500, "FCE4D6")
          ]}),
          new TableRow({ children: [
            createCell("COLD", 1500, "F8D7DA"), createCell("0-39", 1500, "F8D7DA"),
            createCell("Monitor for changes", 3500, "F8D7DA"),
            createCell("Monthly", 2500, "F8D7DA")
          ]})
        ]
      }),

      new Paragraph({ children: [new PageBreak()] }),

      // ============================================
      // IMPLEMENTATION ROADMAP
      // ============================================
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("8. Implementation Roadmap")] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("8.1 Phase 1: Foundation (COMPLEET)")] }),

      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [4000, 3000, 2000],
        rows: [
          new TableRow({
            children: [
              createHeaderCell("Deliverable", 4000),
              createHeaderCell("Owner", 3000),
              createHeaderCell("Status", 2000)
            ]
          }),
          new TableRow({ children: [
            createCell("Database schema + Docker setup", 4000, "D4EDDA"),
            createCell("Backend Team", 3000, "D4EDDA"),
            createCell("DONE", 2000, "D4EDDA")
          ]}),
          new TableRow({ children: [
            createCell("KVK API integration", 4000, "D4EDDA"),
            createCell("Backend Team", 3000, "D4EDDA"),
            createCell("DONE", 2000, "D4EDDA")
          ]}),
          new TableRow({ children: [
            createCell("GPS vestigingsprofiel", 4000, "D4EDDA"),
            createCell("Backend Team", 3000, "D4EDDA"),
            createCell("DONE", 2000, "D4EDDA")
          ]}),
          new TableRow({ children: [
            createCell("Leaflet kaart integratie", 4000, "D4EDDA"),
            createCell("Frontend Team", 3000, "D4EDDA"),
            createCell("DONE", 2000, "D4EDDA")
          ]}),
          new TableRow({ children: [
            createCell("4-Ring classificatie", 4000, "D4EDDA"),
            createCell("AI Team", 3000, "D4EDDA"),
            createCell("DONE", 2000, "D4EDDA")
          ]})
        ]
      }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300 }, children: [new TextRun("8.2 Phase 2: Enrichment (IN PROGRESS)")] }),

      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [4000, 3000, 2000],
        rows: [
          new TableRow({
            children: [
              createHeaderCell("Deliverable", 4000),
              createHeaderCell("Owner", 3000),
              createHeaderCell("Status", 2000)
            ]
          }),
          new TableRow({ children: [
            createCell("Google Places API", 4000),
            createCell("Backend Team", 3000),
            createCell("Planned", 2000, "FFF3CD")
          ]}),
          new TableRow({ children: [
            createCell("RVO/ISDE register import", 4000, "E8F4F8"),
            createCell("Data Team", 3000, "E8F4F8"),
            createCell("Planned", 2000, "FFF3CD")
          ]}),
          new TableRow({ children: [
            createCell("Branchevereniging imports", 4000),
            createCell("Data Team", 3000),
            createCell("Planned", 2000, "FFF3CD")
          ]}),
          new TableRow({ children: [
            createCell("Advanced scoring + ML", 4000, "E8F4F8"),
            createCell("AI Team", 3000, "E8F4F8"),
            createCell("Planned", 2000, "FFF3CD")
          ]})
        ]
      }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300 }, children: [new TextRun("8.3 Phase 3: Scale")] }),

      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [4000, 3000, 2000],
        rows: [
          new TableRow({
            children: [
              createHeaderCell("Deliverable", 4000),
              createHeaderCell("Owner", 3000),
              createHeaderCell("Status", 2000)
            ]
          }),
          new TableRow({ children: [
            createCell("Graydon/Credit integration", 4000),
            createCell("Backend Team", 3000),
            createCell("Backlog", 2000, "E8F4F8")
          ]}),
          new TableRow({ children: [
            createCell("Analytics dashboard", 4000, "E8F4F8"),
            createCell("Frontend Team", 3000, "E8F4F8"),
            createCell("Backlog", 2000, "E8F4F8")
          ]}),
          new TableRow({ children: [
            createCell("CRM integration", 4000),
            createCell("Full Stack", 3000),
            createCell("Backlog", 2000, "E8F4F8")
          ]}),
          new TableRow({ children: [
            createCell("Production deployment", 4000, "E8F4F8"),
            createCell("DevOps", 3000, "E8F4F8"),
            createCell("Backlog", 2000, "E8F4F8")
          ]})
        ]
      }),

      new Paragraph({ children: [new PageBreak()] }),

      // ============================================
      // APPENDIX
      // ============================================
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Appendix A: Complete API Reference")] }),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("A.1 KVK Endpoints (LIVE)")] }),

      createCodeBlock("GET  /api/v1/kvk/search?naam=&plaats=&kvkNummer="),
      createCodeBlock("GET  /api/v1/kvk/basisprofiel/{kvk_nummer}"),
      createCodeBlock("GET  /api/v1/kvk/vestigingsprofiel/{vestigingsnummer}?geoData=true"),
      createCodeBlock("GET  /api/v1/kvk/bedrijf/{kvk_nummer}  (comprehensive)"),
      createCodeBlock("GET  /api/v1/kvk/vakmensen?plaats=&vakgebied="),
      createCodeBlock("POST /api/v1/kvk/scan  (body: {kvk_nummers: []})"),

      new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300 }, children: [new TextRun("A.2 Core Radar Endpoints")] }),

      createCodeBlock("GET  /api/v1/health           - Health check"),
      createCodeBlock("GET  /api/v1/stats            - Dashboard statistics"),
      createCodeBlock("GET  /api/v1/profiles         - List profiles"),
      createCodeBlock("GET  /api/v1/profiles/{id}    - Profile detail"),
      createCodeBlock("POST /api/v1/pipeline         - Run full pipeline"),
      createCodeBlock("POST /api/v1/classify         - Classify text"),
      createCodeBlock("GET  /api/v1/rings            - 4-Ring info"),

      new Paragraph({ spacing: { before: 400 } }),

      // End document
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 800 },
        children: [new TextRun({ text: "— End of Technical Specification v2.1 —", font: "Arial", size: 20, color: COLORS.muted, italics: true })]
      }),

      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200 },
        children: [new TextRun({ text: "Solvari Digital × AetherLink.ai | Confidential", font: "Arial", size: 18, color: COLORS.muted })]
      }),

      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 100 },
        children: [new TextRun({ text: "Generated: " + new Date().toISOString().split('T')[0], font: "Arial", size: 16, color: COLORS.muted })]
      })
    ]
  }]
});

// Generate the document
const outputPath = "C:/Users/info/SOLLAMA-OPERATOR-RADAR-RALPH-T-01/docs/solvari-radar-engine-specification-v2.1.docx";

// Ensure docs directory exists
const docsDir = "C:/Users/info/SOLLAMA-OPERATOR-RADAR-RALPH-T-01/docs";
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log("Document generated: " + outputPath);
  console.log("File size: " + (buffer.length / 1024).toFixed(2) + " KB");
}).catch(err => {
  console.error("Error generating document:", err);
});
