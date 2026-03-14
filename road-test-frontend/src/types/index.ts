
export interface Project {
  id: number;
  name: string;
  description?: string;
}

export interface Worksheet {
  id: number;
  name: string;
  description?: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface TestCase {
  id: number;
  summary: string;
  category?: number;
  priority?: number;
  case_status?: number;
  is_automated?: boolean;
  script?: string;
  arguments?: string;
  extra_link?: string;
  notes?: string;
  text?: string;
  setup?: string;
  breakdown?: string;
}

export interface TestCaseCreate {
  summary: string;
  category: number;
  case_status: number;
  priority?: number;
  is_automated?: boolean;
  script?: string;
  arguments?: string;
  extra_link?: string;
  notes?: string;
  text?: string;
  setup?: string;
  breakdown?: string;
}

export interface TestCaseUpdate {
  summary?: string;
  category?: number;
  case_status?: number;
  priority?: number;
  is_automated?: boolean;
  script?: string;
  arguments?: string;
  extra_link?: string;
  notes?: string;
  text?: string;
  setup?: string;
  breakdown?: string;
}
