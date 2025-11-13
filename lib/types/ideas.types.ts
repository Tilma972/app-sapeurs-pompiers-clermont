/**
 * Boîte à Idées - Types TypeScript
 * Types locaux pour le module ideas (avant regénération database.types.ts)
 */

export type IdeaStatus = 'draft' | 'published' | 'archived' | 'flagged' | 'deleted';
export type VoteType = 'up' | 'down';
export type ReportReason = 'spam' | 'inappropriate' | 'offensive' | 'duplicate' | 'other';
export type ReportStatus = 'pending' | 'reviewed' | 'dismissed' | 'actioned';

export type IdeaCategory = 
  | 'Équipement'
  | 'Formation'
  | 'Sécurité'
  | 'Bien-être'
  | 'Procédures'
  | 'Communauté'
  | 'Technologie';

export interface Idea {
  id: string;
  user_id: string;
  titre: string;
  description: string;
  audio_url: string | null;
  categories: string[];
  tags: string[];
  votes_count: number;
  comments_count: number;
  views_count: number;
  status: IdeaStatus;
  anonyme: boolean;
  ai_generated: boolean;
  ai_confidence_score: number | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  deleted_at: string | null;
}

export interface IdeaWithAuthor extends Idea {
  author: {
    id: string;
    nom: string | null;
    prenom: string | null;
    role: string;
  } | null;
}

export interface IdeaVote {
  id: string;
  idea_id: string;
  user_id: string;
  vote_type: VoteType;
  created_at: string;
  updated_at: string;
}

export interface IdeaComment {
  id: string;
  idea_id: string;
  user_id: string;
  content: string;
  is_flagged: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface IdeaCommentWithAuthor extends IdeaComment {
  author: {
    id: string;
    nom: string | null;
    prenom: string | null;
    role: string;
  };
}

export interface IdeaReport {
  id: string;
  idea_id: string | null;
  comment_id: string | null;
  reporter_user_id: string;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface CreateIdeaData {
  titre: string;
  description: string;
  audio_url?: string | null;
  categories?: string[];
  tags?: string[];
  status?: IdeaStatus;
  anonyme?: boolean;
  ai_generated?: boolean;
  ai_confidence_score?: number | null;
}

export interface UpdateIdeaData {
  titre?: string;
  description?: string;
  categories?: string[];
  tags?: string[];
  status?: IdeaStatus;
  anonyme?: boolean;
}

export interface IdeaFilters {
  status?: IdeaStatus | IdeaStatus[];
  categories?: string[];
  tags?: string[];
  user_id?: string;
  search?: string;
  sortBy?: 'recent' | 'popular' | 'trending';
  limit?: number;
  offset?: number;
}

export interface IdeaStats {
  total_ideas: number;
  ideas_this_month: number;
  pending_moderation: number;
  trending_keywords: Array<{ tag: string; count: number }>;
  top_ideas: IdeaWithAuthor[];
  ideas_by_category: Array<{ category: string; count: number }>;
}

export interface VoiceTranscriptionResult {
  text: string;
  duration?: number;
}

export interface AIAnalysisResult {
  titre: string;
  categories: string[];
  tags: string[];
  contenuInapproprie: boolean;
  scoreConfiance: number;
}
