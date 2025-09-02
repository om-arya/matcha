import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse';


export type PostSurveyData = {
  filename: string;
  '3D_EFFECTS': number;
  ANIMATIONS: number;
  BIASED_TITLE: number;
  DECEPTIVE_LABELS: number;
  DUAL_Y_AXES: number;
  FIGSIZE_TOO_SMALL: number;
  FONTSIZE_TOO_SMALL: number;
  INSUFFICIENT_COLOR_CONTRAST: number;
  INVERTED_Y_AXIS: number;
  MISLEADING_ANNOTATIONS: number;
  MISSING_LEGEND: number;
  MISSING_TITLE: number;
  MISSING_XLABEL: number;
  MISSING_YLABEL: number;
  NON_SEQUENTIAL_AXIS: number;
  TAMPERED_ASPECT_RATIO: number;
  TRUNCATED_Y_AXIS: number;
  question: string;
  baseline_summary: string;
  optimized_summary: string;
};

function parseCSVFile(filePath: string): PostSurveyData[] {
  const csv = fs.readFileSync(path.resolve(filePath), 'utf-8');

  const parsed = Papa.parse(csv, {
    header: true,
    skipEmptyLines: true,
  });

  const numericFields = [
    '3D_EFFECTS','ANIMATIONS','BIASED_TITLE','DECEPTIVE_LABELS',
    'DUAL_Y_AXES','FIGSIZE_TOO_SMALL','FONTSIZE_TOO_SMALL',
    'INSUFFICIENT_COLOR_CONTRAST','INVERTED_Y_AXIS',
    'MISLEADING_ANNOTATIONS','MISSING_LEGEND','MISSING_TITLE',
    'MISSING_XLABEL','MISSING_YLABEL','NON_SEQUENTIAL_AXIS','TAMPERED_ASPECT_RATIO',
    'TRUNCATED_Y_AXIS'
  ];

  return parsed.data.map((row: any) => {
    numericFields.forEach(field => {
      row[field] = Number(row[field]);
    });

    // Trim all string fields to remove \r or extra spaces
    Object.keys(row).forEach(key => {
      if (typeof row[key] === 'string') {
        row[key] = row[key].trim().replace(/\r$/, '');
      }
    });

    return row as PostSurveyData;
  });
}

// Parse CSV and write TypeScript file

const data = parseCSVFile('./postsurvey_graph_analysis.csv');

const tsContent = `import { type PostSurveyData } from "./parseCSV";

export const postSurveyGraphData: PostSurveyData[] = ${JSON.stringify(data, null, 2)};
`;

fs.writeFileSync(path.resolve('./postsurvey_graph_data.ts'), tsContent, 'utf-8');

console.log('Data saved to postsurvey_graph_data.ts');