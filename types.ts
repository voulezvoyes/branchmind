// Main types for BranchMind application

export interface RelatedIdea {
  suggestion: string;
  explanation: string;
}

export interface AIAnalysisData {
  summary?: string; // Optional summary from AI
  tags?: string[]; // Optional array of tags, e.g., ["#idea", "#project"]
  relatedIdeas?: RelatedIdea[]; // Optional array of related idea objects
}

export interface ThoughtNode {
  id: string; // Unique identifier for the thought
  timestamp: string; // ISO string format for when the thought was recorded
  userThought: string; // The raw text input from the user
  parentId?: string | null; // Optional ID of the parent thought this branched from
  aiAnalysis?: AIAnalysisData; // Optional AI-generated analysis
}

// Specific type for the expected JSON structure from Gemini for BranchMind
export interface GeminiBranchMindResponse {
  summary?: string;
  tags?: string[];
  relatedIdeas?: RelatedIdea[];
}