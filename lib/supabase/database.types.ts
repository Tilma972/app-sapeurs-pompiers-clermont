export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      annonces: {
        Row: {
          categorie: string
          created_at: string
          description: string
          favoris: number
          id: string
          localisation: string | null
          photos: string[]
          prix: number
          statut: string
          telephone: string | null
          titre: string
          updated_at: string
          user_id: string
          vues: number
        }
        Insert: {
          categorie: string
          created_at?: string
          description: string
          favoris?: number
          id?: string
          localisation?: string | null
          photos?: string[]
          prix: number
          statut?: string
          telephone?: string | null
          titre: string
          updated_at?: string
          user_id: string
          vues?: number
        }
        Update: {
          categorie?: string
          created_at?: string
          description?: string
          favoris?: number
          id?: string
          localisation?: string | null
          photos?: string[]
          prix?: number
          statut?: string
          telephone?: string | null
          titre?: string
          updated_at?: string
          user_id?: string
          vues?: number
        }
        Relationships: []
      }
      annonces_favoris: {
        Row: {
          annonce_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          annonce_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          annonce_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "annonces_favoris_annonce_id_fkey"
            columns: ["annonce_id"]
            isOneToOne: false
            referencedRelation: "annonces"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          calendar_price: number
          id: string
          min_retrocession: number
          recommended_retrocession: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          calendar_price?: number
          id: string
          min_retrocession?: number
          recommended_retrocession?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          calendar_price?: number
          id?: string
          min_retrocession?: number
          recommended_retrocession?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      card_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          status: Database["public"]["Enums"]["payment_status"]
          stripe_payment_intent_id: string | null
          tournee_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_payment_intent_id?: string | null
          tournee_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_payment_intent_id?: string | null
          tournee_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_payments_tournee_id_fkey"
            columns: ["tournee_id"]
            isOneToOne: false
            referencedRelation: "tournee_summary"
            referencedColumns: ["tournee_id"]
          },
          {
            foreignKeyName: "card_payments_tournee_id_fkey"
            columns: ["tournee_id"]
            isOneToOne: false
            referencedRelation: "tournees"
            referencedColumns: ["id"]
          },
        ]
      }
      comptes_sp: {
        Row: {
          created_at: string | null
          id: string
          pourcentage_pot_equipe_defaut: number | null
          solde_bloque: number
          solde_disponible: number
          solde_utilise: number
          total_contributions_equipe: number
          total_retributions: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          pourcentage_pot_equipe_defaut?: number | null
          solde_bloque?: number
          solde_disponible?: number
          solde_utilise?: number
          total_contributions_equipe?: number
          total_retributions?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          pourcentage_pot_equipe_defaut?: number | null
          solde_bloque?: number
          solde_disponible?: number
          solde_utilise?: number
          total_contributions_equipe?: number
          total_retributions?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      equipes: {
        Row: {
          actif: boolean
          archived_at: string | null
          archived_by: string | null
          calendriers_alloues: number
          charte_texte: string | null
          charte_votee: boolean | null
          chef_equipe_id: string | null
          communes: string[] | null
          couleur: string | null
          created_at: string
          date_vote_charte: string | null
          description: string | null
          enable_retribution: boolean | null
          id: string
          mode_transparence:
            | Database["public"]["Enums"]["transparency_mode"]
            | null
          nom: string
          numero: number | null
          ordre_affichage: number | null
          pourcentage_minimum_pot: number | null
          pourcentage_recommande_pot: number | null
          secteur: string
          secteur_centre_lat: number | null
          secteur_centre_lon: number | null
          status: string | null
          type: string
          updated_at: string
        }
        Insert: {
          actif?: boolean
          archived_at?: string | null
          archived_by?: string | null
          calendriers_alloues?: number
          charte_texte?: string | null
          charte_votee?: boolean | null
          chef_equipe_id?: string | null
          communes?: string[] | null
          couleur?: string | null
          created_at?: string
          date_vote_charte?: string | null
          description?: string | null
          enable_retribution?: boolean | null
          id?: string
          mode_transparence?:
            | Database["public"]["Enums"]["transparency_mode"]
            | null
          nom: string
          numero?: number | null
          ordre_affichage?: number | null
          pourcentage_minimum_pot?: number | null
          pourcentage_recommande_pot?: number | null
          secteur: string
          secteur_centre_lat?: number | null
          secteur_centre_lon?: number | null
          status?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          actif?: boolean
          archived_at?: string | null
          archived_by?: string | null
          calendriers_alloues?: number
          charte_texte?: string | null
          charte_votee?: boolean | null
          chef_equipe_id?: string | null
          communes?: string[] | null
          couleur?: string | null
          created_at?: string
          date_vote_charte?: string | null
          description?: string | null
          enable_retribution?: boolean | null
          id?: string
          mode_transparence?:
            | Database["public"]["Enums"]["transparency_mode"]
            | null
          nom?: string
          numero?: number | null
          ordre_affichage?: number | null
          pourcentage_minimum_pot?: number | null
          pourcentage_recommande_pot?: number | null
          secteur?: string
          secteur_centre_lat?: number | null
          secteur_centre_lon?: number | null
          status?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipes_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipes_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_equipe_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipes_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_identity"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_bans: {
        Row: {
          banned_at: string
          banned_by: string
          id: string
          reason: string
          user_id: string
        }
        Insert: {
          banned_at?: string
          banned_by: string
          id?: string
          reason: string
          user_id: string
        }
        Update: {
          banned_at?: string
          banned_by?: string
          id?: string
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      gallery_comments: {
        Row: {
          content: string
          created_at: string
          deleted_at: string | null
          id: string
          is_flagged: boolean | null
          photo_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_flagged?: boolean | null
          photo_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_flagged?: boolean | null
          photo_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_comments_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "gallery_photos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gallery_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gallery_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_equipe_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gallery_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_identity"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_likes: {
        Row: {
          created_at: string
          photo_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          photo_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          photo_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_likes_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "gallery_photos"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_photo_reports: {
        Row: {
          created_at: string
          id: string
          photo_id: string
          reason: string
          reporter_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          photo_id: string
          reason: string
          reporter_id: string
        }
        Update: {
          created_at?: string
          id?: string
          photo_id?: string
          reason?: string
          reporter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_photo_reports_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "gallery_photos"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_photos: {
        Row: {
          category: string
          comments_count: number
          created_at: string
          description: string | null
          id: string
          image_url: string
          likes_count: number
          reports_count: number
          status: string
          taken_at: string | null
          thumbnail_url: string | null
          title: string
          user_id: string
        }
        Insert: {
          category: string
          comments_count?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url: string
          likes_count?: number
          reports_count?: number
          status?: string
          taken_at?: string | null
          thumbnail_url?: string | null
          title: string
          user_id: string
        }
        Update: {
          category?: string
          comments_count?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string
          likes_count?: number
          reports_count?: number
          status?: string
          taken_at?: string | null
          thumbnail_url?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      idea_comments: {
        Row: {
          content: string
          created_at: string
          deleted_at: string | null
          id: string
          idea_id: string
          is_flagged: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          idea_id: string
          is_flagged?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          idea_id?: string
          is_flagged?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "idea_comments_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idea_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idea_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_equipe_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idea_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_identity"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_reports: {
        Row: {
          comment_id: string | null
          created_at: string
          details: string | null
          id: string
          idea_id: string | null
          reason: string
          reporter_user_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          idea_id?: string | null
          reason: string
          reporter_user_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          idea_id?: string | null
          reason?: string
          reporter_user_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "idea_reports_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "idea_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idea_reports_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idea_reports_reporter_user_id_fkey"
            columns: ["reporter_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idea_reports_reporter_user_id_fkey"
            columns: ["reporter_user_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_equipe_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idea_reports_reporter_user_id_fkey"
            columns: ["reporter_user_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_identity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idea_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idea_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_equipe_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idea_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_identity"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_vote_log: {
        Row: {
          id: string
          user_id: string
          voted_at: string
        }
        Insert: {
          id?: string
          user_id: string
          voted_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          voted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "idea_vote_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idea_vote_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_equipe_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idea_vote_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_identity"
            referencedColumns: ["id"]
          },
        ]
      }
      idea_votes: {
        Row: {
          created_at: string
          id: string
          idea_id: string
          updated_at: string
          user_id: string
          vote_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          idea_id: string
          updated_at?: string
          user_id: string
          vote_type: string
        }
        Update: {
          created_at?: string
          id?: string
          idea_id?: string
          updated_at?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "idea_votes_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idea_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idea_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_equipe_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "idea_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_identity"
            referencedColumns: ["id"]
          },
        ]
      }
      ideas: {
        Row: {
          ai_confidence_score: number | null
          ai_generated: boolean | null
          anonyme: boolean | null
          audio_duration: number | null
          audio_url: string | null
          categories: string[] | null
          comments_count: number | null
          created_at: string
          deleted_at: string | null
          description: string
          id: string
          published_at: string | null
          status: string | null
          tags: string[] | null
          titre: string
          transcription: string | null
          updated_at: string
          user_id: string
          views_count: number | null
          votes_count: number | null
        }
        Insert: {
          ai_confidence_score?: number | null
          ai_generated?: boolean | null
          anonyme?: boolean | null
          audio_duration?: number | null
          audio_url?: string | null
          categories?: string[] | null
          comments_count?: number | null
          created_at?: string
          deleted_at?: string | null
          description: string
          id?: string
          published_at?: string | null
          status?: string | null
          tags?: string[] | null
          titre: string
          transcription?: string | null
          updated_at?: string
          user_id: string
          views_count?: number | null
          votes_count?: number | null
        }
        Update: {
          ai_confidence_score?: number | null
          ai_generated?: boolean | null
          anonyme?: boolean | null
          audio_duration?: number | null
          audio_url?: string | null
          categories?: string[] | null
          comments_count?: number | null
          created_at?: string
          deleted_at?: string | null
          description?: string
          id?: string
          published_at?: string | null
          status?: string | null
          tags?: string[] | null
          titre?: string
          transcription?: string | null
          updated_at?: string
          user_id?: string
          views_count?: number | null
          votes_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ideas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ideas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_equipe_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ideas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_identity"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_partners: {
        Row: {
          created_at: string
          id: number
          logo: string
          name: string
          sector: string
          since: number
          tier: string
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          logo: string
          name: string
          sector: string
          since: number
          tier: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          logo?: string
          name?: string
          sector?: string
          since?: number
          tier?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      mouvements_retribution: {
        Row: {
          created_at: string | null
          equipe_id: string | null
          id: string
          montant_amicale: number
          montant_compte_perso: number
          montant_pompier_total: number
          montant_pot_equipe: number
          montant_total_collecte: number
          pourcentage_pot_equipe: number
          statut: string | null
          tournee_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          equipe_id?: string | null
          id?: string
          montant_amicale: number
          montant_compte_perso: number
          montant_pompier_total: number
          montant_pot_equipe: number
          montant_total_collecte: number
          pourcentage_pot_equipe: number
          statut?: string | null
          tournee_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          equipe_id?: string | null
          id?: string
          montant_amicale?: number
          montant_compte_perso?: number
          montant_pompier_total?: number
          montant_pot_equipe?: number
          montant_total_collecte?: number
          pourcentage_pot_equipe?: number
          statut?: string | null
          tournee_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mouvements_retribution_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mouvements_retribution_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes_stats_view"
            referencedColumns: ["equipe_id"]
          },
          {
            foreignKeyName: "mouvements_retribution_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_equipe_view"
            referencedColumns: ["equipe_id"]
          },
          {
            foreignKeyName: "mouvements_retribution_tournee_id_fkey"
            columns: ["tournee_id"]
            isOneToOne: false
            referencedRelation: "tournee_summary"
            referencedColumns: ["tournee_id"]
          },
          {
            foreignKeyName: "mouvements_retribution_tournee_id_fkey"
            columns: ["tournee_id"]
            isOneToOne: false
            referencedRelation: "tournees"
            referencedColumns: ["id"]
          },
        ]
      }
      offer_usage: {
        Row: {
          action_type: string
          created_at: string
          expires_at: string | null
          id: string
          metadata: Json | null
          offer_id: string
          partner_id: string
          qr_token: string | null
          user_id: string
          validated_at: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          offer_id: string
          partner_id: string
          qr_token?: string | null
          user_id: string
          validated_at?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          offer_id?: string
          partner_id?: string
          qr_token?: string | null
          user_id?: string
          validated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offer_usage_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "partner_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_usage_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_equipe_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_identity"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_offers: {
        Row: {
          actif: boolean
          action_url: string | null
          code_promo: string | null
          conditions: string | null
          created_at: string
          description: string | null
          external_id: string | null
          featured: boolean
          id: string
          image_url: string | null
          limite_globale: number | null
          limite_par_user: number | null
          ordre: number
          partner_id: string
          source: string | null
          titre: string
          type_avantage: string
          updated_at: string
          usage_count: number
          valeur: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          actif?: boolean
          action_url?: string | null
          code_promo?: string | null
          conditions?: string | null
          created_at?: string
          description?: string | null
          external_id?: string | null
          featured?: boolean
          id?: string
          image_url?: string | null
          limite_globale?: number | null
          limite_par_user?: number | null
          ordre?: number
          partner_id: string
          source?: string | null
          titre: string
          type_avantage: string
          updated_at?: string
          usage_count?: number
          valeur: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          actif?: boolean
          action_url?: string | null
          code_promo?: string | null
          conditions?: string | null
          created_at?: string
          description?: string | null
          external_id?: string | null
          featured?: boolean
          id?: string
          image_url?: string | null
          limite_globale?: number | null
          limite_par_user?: number | null
          ordre?: number
          partner_id?: string
          source?: string | null
          titre?: string
          type_avantage?: string
          updated_at?: string
          usage_count?: number
          valeur?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_offers_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          actif: boolean
          adresse: string | null
          categorie: string | null
          code_postal: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          email: string | null
          featured: boolean
          id: string
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          nom: string
          ordre: number
          site_web: string | null
          telephone: string | null
          updated_at: string
          ville: string | null
        }
        Insert: {
          actif?: boolean
          adresse?: string | null
          categorie?: string | null
          code_postal?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          featured?: boolean
          id?: string
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          nom: string
          ordre?: number
          site_web?: string | null
          telephone?: string | null
          updated_at?: string
          ville?: string | null
        }
        Update: {
          actif?: boolean
          adresse?: string | null
          categorie?: string | null
          code_postal?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          featured?: boolean
          id?: string
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          nom?: string
          ordre?: number
          site_web?: string | null
          telephone?: string | null
          updated_at?: string
          ville?: string | null
        }
        Relationships: []
      }
      pots_equipe: {
        Row: {
          created_at: string | null
          equipe_id: string
          id: string
          solde_bloque: number
          solde_disponible: number
          solde_utilise: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          equipe_id: string
          id?: string
          solde_bloque?: number
          solde_disponible?: number
          solde_utilise?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          equipe_id?: string
          id?: string
          solde_bloque?: number
          solde_disponible?: number
          solde_utilise?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pots_equipe_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: true
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pots_equipe_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: true
            referencedRelation: "equipes_stats_view"
            referencedColumns: ["equipe_id"]
          },
          {
            foreignKeyName: "pots_equipe_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: true
            referencedRelation: "profiles_with_equipe_view"
            referencedColumns: ["equipe_id"]
          },
        ]
      }
      products: {
        Row: {
          badge_text: string | null
          badge_variant: string | null
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          price: number
          status: string
          stock: number
          updated_at: string
        }
        Insert: {
          badge_text?: string | null
          badge_variant?: string | null
          category: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          price: number
          status?: string
          stock?: number
          updated_at?: string
        }
        Update: {
          badge_text?: string | null
          badge_variant?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          status?: string
          stock?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          first_name: string | null
          full_name: string
          id: string
          identity_verified: boolean | null
          is_active: boolean
          last_name: string | null
          role: string
          team_id: string | null
          updated_at: string
          verification_date: string | null
          verification_method: string | null
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          first_name?: string | null
          full_name: string
          id: string
          identity_verified?: boolean | null
          is_active?: boolean
          last_name?: string | null
          role?: string
          team_id?: string | null
          updated_at?: string
          verification_date?: string | null
          verification_method?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string | null
          first_name?: string | null
          full_name?: string
          id?: string
          identity_verified?: boolean | null
          is_active?: boolean
          last_name?: string | null
          role?: string
          team_id?: string | null
          updated_at?: string
          verification_date?: string | null
          verification_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "equipes_stats_view"
            referencedColumns: ["equipe_id"]
          },
          {
            foreignKeyName: "profiles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_equipe_view"
            referencedColumns: ["equipe_id"]
          },
        ]
      }
      receipts: {
        Row: {
          created_at: string | null
          email_delivery_status: string | null
          email_sent: boolean | null
          email_sent_at: string | null
          fiscal_year: number
          generated_at: string | null
          id: string
          pdf_checksum: string | null
          pdf_generated: boolean | null
          pdf_storage_path: string | null
          pdf_url: string | null
          public_access_token: string | null
          receipt_number: string
          receipt_type: string
          resend_message_id: string | null
          sequence_number: number
          status: string | null
          transaction_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email_delivery_status?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          fiscal_year: number
          generated_at?: string | null
          id?: string
          pdf_checksum?: string | null
          pdf_generated?: boolean | null
          pdf_storage_path?: string | null
          pdf_url?: string | null
          public_access_token?: string | null
          receipt_number: string
          receipt_type: string
          resend_message_id?: string | null
          sequence_number: number
          status?: string | null
          transaction_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email_delivery_status?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          fiscal_year?: number
          generated_at?: string | null
          id?: string
          pdf_checksum?: string | null
          pdf_generated?: boolean | null
          pdf_storage_path?: string | null
          pdf_url?: string | null
          public_access_token?: string | null
          receipt_number?: string
          receipt_type?: string
          resend_message_id?: string | null
          sequence_number?: number
          status?: string | null
          transaction_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receipts_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: true
            referencedRelation: "support_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      support_transactions: {
        Row: {
          amount: number
          calendar_accepted: boolean
          calendars_given: number | null
          consent_email: boolean | null
          created_at: string | null
          created_offline: boolean | null
          donor_address: string | null
          donor_city: string | null
          donor_first_name: string | null
          donor_last_name: string | null
          donor_zip: string | null
          geolocation_timestamp: string | null
          id: string
          latitude: number | null
          longitude: number | null
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method_enum"]
          payment_status: string | null
          receipt_generated: boolean | null
          receipt_number: string | null
          receipt_sent: boolean | null
          receipt_type: string | null
          receipt_url: string | null
          stripe_payment_intent: string | null
          stripe_session_id: string | null
          supporter_address_line1: string | null
          supporter_city: string | null
          supporter_email: string | null
          supporter_name: string | null
          supporter_phone: string | null
          supporter_postal_code: string | null
          synced_at: string | null
          tax_deductible: boolean | null
          tax_reduction: number | null
          tournee_id: string
          transaction_type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          calendar_accepted?: boolean
          calendars_given?: number | null
          consent_email?: boolean | null
          created_at?: string | null
          created_offline?: boolean | null
          donor_address?: string | null
          donor_city?: string | null
          donor_first_name?: string | null
          donor_last_name?: string | null
          donor_zip?: string | null
          geolocation_timestamp?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method_enum"]
          payment_status?: string | null
          receipt_generated?: boolean | null
          receipt_number?: string | null
          receipt_sent?: boolean | null
          receipt_type?: string | null
          receipt_url?: string | null
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          supporter_address_line1?: string | null
          supporter_city?: string | null
          supporter_email?: string | null
          supporter_name?: string | null
          supporter_phone?: string | null
          supporter_postal_code?: string | null
          synced_at?: string | null
          tax_deductible?: boolean | null
          tax_reduction?: number | null
          tournee_id: string
          transaction_type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          calendar_accepted?: boolean
          calendars_given?: number | null
          consent_email?: boolean | null
          created_at?: string | null
          created_offline?: boolean | null
          donor_address?: string | null
          donor_city?: string | null
          donor_first_name?: string | null
          donor_last_name?: string | null
          donor_zip?: string | null
          geolocation_timestamp?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method_enum"]
          payment_status?: string | null
          receipt_generated?: boolean | null
          receipt_number?: string | null
          receipt_sent?: boolean | null
          receipt_type?: string | null
          receipt_url?: string | null
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          supporter_address_line1?: string | null
          supporter_city?: string | null
          supporter_email?: string | null
          supporter_name?: string | null
          supporter_phone?: string | null
          supporter_postal_code?: string | null
          synced_at?: string | null
          tax_deductible?: boolean | null
          tax_reduction?: number | null
          tournee_id?: string
          transaction_type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_transactions_tournee_id_fkey"
            columns: ["tournee_id"]
            isOneToOne: false
            referencedRelation: "tournee_summary"
            referencedColumns: ["tournee_id"]
          },
          {
            foreignKeyName: "support_transactions_tournee_id_fkey"
            columns: ["tournee_id"]
            isOneToOne: false
            referencedRelation: "tournees"
            referencedColumns: ["id"]
          },
        ]
      }
      tournees: {
        Row: {
          calendriers_alloues: number
          calendriers_distribues: number
          created_at: string
          date_debut: string
          date_fin: string | null
          equipe_id: string | null
          id: string
          montant_collecte: number
          notes: string | null
          statut: string
          updated_at: string
          user_id: string
          zone: string
        }
        Insert: {
          calendriers_alloues?: number
          calendriers_distribues?: number
          created_at?: string
          date_debut?: string
          date_fin?: string | null
          equipe_id?: string | null
          id?: string
          montant_collecte?: number
          notes?: string | null
          statut?: string
          updated_at?: string
          user_id: string
          zone: string
        }
        Update: {
          calendriers_alloues?: number
          calendriers_distribues?: number
          created_at?: string
          date_debut?: string
          date_fin?: string | null
          equipe_id?: string | null
          id?: string
          montant_collecte?: number
          notes?: string | null
          statut?: string
          updated_at?: string
          user_id?: string
          zone?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournees_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournees_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes_stats_view"
            referencedColumns: ["equipe_id"]
          },
          {
            foreignKeyName: "tournees_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_equipe_view"
            referencedColumns: ["equipe_id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_type: string | null
          headers: Json | null
          id: string
          payload: Json
          processing_duration_ms: number | null
          source: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_type?: string | null
          headers?: Json | null
          id?: string
          payload: Json
          processing_duration_ms?: number | null
          source: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_type?: string | null
          headers?: Json | null
          id?: string
          payload?: Json
          processing_duration_ms?: number | null
          source?: string
          status?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      equipes_stats_view: {
        Row: {
          archived_at: string | null
          calendriers_alloues: number | null
          calendriers_distribues: number | null
          chef_equipe_id: string | null
          chef_equipe_nom: string | null
          communes: string[] | null
          couleur: string | null
          derniere_activite: string | null
          equipe_id: string | null
          equipe_nom: string | null
          equipe_numero: number | null
          equipe_type: string | null
          montant_collecte: number | null
          moyenne_par_calendrier: number | null
          nombre_membres: number | null
          nombre_tournees: number | null
          ordre_affichage: number | null
          progression_pourcentage: number | null
          secteur: string | null
          secteur_centre_lat: number | null
          secteur_centre_lon: number | null
          status: string | null
          tournees_actives: number | null
          tournees_terminees: number | null
        }
        Relationships: []
      }
      profiles_with_equipe_view: {
        Row: {
          calendriers_alloues: number | null
          calendriers_distribues: number | null
          chef_equipe_id: string | null
          chef_equipe_nom: string | null
          created_at: string | null
          equipe_couleur: string | null
          equipe_id: string | null
          equipe_nom: string | null
          equipe_numero: number | null
          equipe_ordre: number | null
          equipe_type: string | null
          full_name: string | null
          id: string | null
          montant_collecte: number | null
          moyenne_par_calendrier: number | null
          nombre_tournees: number | null
          role: string | null
          secteur: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      profiles_with_identity: {
        Row: {
          computed_display_name: string | null
          created_at: string | null
          display_name: string | null
          first_name: string | null
          full_name: string | null
          id: string | null
          identity_verified: boolean | null
          is_active: boolean | null
          last_name: string | null
          legal_name: string | null
          role: string | null
          team_id: string | null
          updated_at: string | null
          verification_date: string | null
          verification_method: string | null
        }
        Insert: {
          computed_display_name?: never
          created_at?: string | null
          display_name?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string | null
          identity_verified?: boolean | null
          is_active?: boolean | null
          last_name?: string | null
          legal_name?: never
          role?: string | null
          team_id?: string | null
          updated_at?: string | null
          verification_date?: string | null
          verification_method?: string | null
        }
        Update: {
          computed_display_name?: never
          created_at?: string | null
          display_name?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string | null
          identity_verified?: boolean | null
          is_active?: boolean | null
          last_name?: string | null
          legal_name?: never
          role?: string | null
          team_id?: string | null
          updated_at?: string | null
          verification_date?: string | null
          verification_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "equipes_stats_view"
            referencedColumns: ["equipe_id"]
          },
          {
            foreignKeyName: "profiles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_equipe_view"
            referencedColumns: ["equipe_id"]
          },
        ]
      }
      tournee_summary: {
        Row: {
          calendars_distributed: number | null
          cartes_total: number | null
          cheques_total: number | null
          dons_amount: number | null
          dons_count: number | null
          especes_total: number | null
          montant_total: number | null
          soutiens_amount: number | null
          soutiens_count: number | null
          total_deductions: number | null
          total_transactions: number | null
          tournee_id: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_vote_rate_limit: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      cleanup_orphan_idea_audios: { Args: never; Returns: undefined }
      cloturer_tournee: {
        Args: {
          calendriers_finaux: number
          montant_final: number
          tournee_uuid: string
        }
        Returns: boolean
      }
      cloturer_tournee_avec_retribution:
        | {
            Args: {
              p_calendriers_vendus: number
              p_montant_total: number
              p_tournee_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_calendriers_vendus: number
              p_montant_total: number
              p_pourcentage_pot_equipe: number
              p_tournee_id: string
            }
            Returns: Json
          }
      generate_receipt_number: { Args: never; Returns: string }
      get_display_name: {
        Args: { p: Database["public"]["Tables"]["profiles"]["Row"] }
        Returns: string
      }
      get_equipe_membres: {
        Args: { equipe_id_param: string }
        Returns: {
          calendriers_distribues: number
          derniere_tournee: string
          membre_id: string
          membre_nom: string
          membre_role: string
          montant_collecte: number
          moyenne_par_calendrier: number
          nombre_tournees: number
        }[]
      }
      get_equipe_stats: {
        Args: { equipe_id_param: string }
        Returns: {
          calendriers_alloues: number
          calendriers_distribues: number
          couleur: string
          equipe_id: string
          equipe_nom: string
          equipe_numero: number
          montant_collecte: number
          moyenne_par_calendrier: number
          nombre_membres: number
          progression_pourcentage: number
          secteur: string
          tournees_actives: number
        }[]
      }
      get_equipes_ranking: {
        Args: never
        Returns: {
          calendriers_distribues: number
          couleur: string
          equipe_nom: string
          equipe_numero: number
          montant_collecte: number
          nombre_membres: number
          progression_pourcentage: number
          rang: number
          secteur: string
        }[]
      }
      get_equipes_summary_for_charts: {
        Args: never
        Returns: {
          couleur: string
          progression_pourcentage: number
          secteur: string
          team: string
          totalamountcollected: number
          totalcalendarsdistributed: number
        }[]
      }
      get_global_tournee_stats: {
        Args: never
        Returns: {
          total_calendriers_distribues: number
          total_montant_collecte: number
          total_tournees_actives: number
        }[]
      }
      get_tournee_detailed_stats: {
        Args: { tournee_uuid: string }
        Returns: {
          calendriers_alloues: number
          calendriers_distribues: number
          date_debut: string
          date_fin: string
          montant_cartes: number
          montant_cheques: number
          montant_collecte: number
          montant_especes: number
          nombre_transactions: number
          statut: string
          tournee_id: string
          zone: string
        }[]
      }
      get_tournee_stats: {
        Args: { tournee_uuid: string }
        Returns: {
          calendriers_distribues: number
          montant_collecte: number
          nombre_transactions: number
        }[]
      }
      get_user_tournee_stats: {
        Args: { user_uuid: string }
        Returns: {
          moyenne_calendriers_par_tournee: number
          moyenne_montant_par_tournee: number
          total_calendriers_distribues: number
          total_montant_collecte: number
          total_tournees: number
          tournees_actives: number
          tournees_completed: number
        }[]
      }
      increment_annonce_vues: {
        Args: { annonce_id: string }
        Returns: undefined
      }
      issue_receipt: {
        Args: { p_transaction_id: string }
        Returns: {
          id: string
          receipt_number: string
        }[]
      }
      recalculate_idea_comments_count: {
        Args: { target_idea_id: string }
        Returns: undefined
      }
      recalculate_idea_votes_count: {
        Args: { target_idea_id: string }
        Returns: undefined
      }
      recalculate_photo_comments_count: {
        Args: { target_photo_id: string }
        Returns: undefined
      }
    }
    Enums: {
      payment_method_enum: "especes" | "cheque" | "carte" | "virement"
      payment_status: "pending" | "succeeded" | "failed"
      transparency_mode: "prive" | "equipe" | "anonyme"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      payment_method_enum: ["especes", "cheque", "carte", "virement"],
      payment_status: ["pending", "succeeded", "failed"],
      transparency_mode: ["prive", "equipe", "anonyme"],
    },
  },
} as const
