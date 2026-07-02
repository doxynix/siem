export type ApiResponse = {
  message: string;
  success: true;
};

export type LeakFinding = {
  ruleId: string;
  ruleName: string;
  severity: string;
  matchedText: string;
};

export type ScanRequest = {
  content: string;
};

export type ScanResult = {
  isSafe: boolean;
  findings?: LeakFinding[];
  message: string;
};
