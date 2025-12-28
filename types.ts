
export interface Correction {
  original: string;
  correction: string;
  explanation: string;
  type: 'អក្ខរាវិរុទ្ធ' | 'វេយ្យាករណ៍' | 'កម្រិតភាសា';
}

export interface AnalysisResult {
  corrections: Correction[];
  suggestions: string;
  overallFeedback: string;
  languageLevel: string;
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
