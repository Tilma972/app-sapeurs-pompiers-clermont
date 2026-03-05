export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      associative_contributions: {
        Row: {
          amount: number
          createdAt: string
          id: string
          isAnonymous: boolean
          message: string | null
          moneyPotId: string
          status: Database["public"]["Enums"]["ContributionStatus"]
          stripePaymentId: string | null
          updatedAt: string
          userId: string
        }
        Insert: {
          amount: number
          createdAt?: string
          id?: string
          isAnonymous?: boolean
          message?: string | null
          moneyPotId: string
          status?: Database["public"]["Enums"]["ContributionStatus"]
          stripePaymentId?: string | null
          updatedAt?: string
          userId: string
        }
        Update: {
          amount?: number
          createdAt?: string
          id?: string
          isAnonymous?: boolean
          message?: string | null
          moneyPotId?: string
          status?: Database["public"]["Enums"]["ContributionStatus"]
          stripePaymentId?: string | null
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "associative_contributions_moneyPotId_fkey"
            columns: ["moneyPotId"]
            isOneToOne: false
            referencedRelation: "associative_money_pots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "associative_contributions_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "membres_calendriers_suivi"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "associative_contributions_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "associative_contributions_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "profiles_with_equipe_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "associative_contributions_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "profiles_with_identity"
            referencedColumns: ["id"]
          },
        ]
      }
      associative_event_participants: {
        Row: {
          createdAt: string
          eventId: string
          guests: number
          id: string
          status: Database["public"]["Enums"]["ParticipationStatus"]
          updatedAt: string
          userId: string
        }
        Insert: {
          createdAt?: string
          eventId: string
          guests?: number
          id?: string
          status: Database["public"]["Enums"]["ParticipationStatus"]
          updatedAt?: string
          userId: string
        }
        Update: {
          createdAt?: string
          eventId?: string
          guests?: number
          id?: string
          status?: Database["public"]["Enums"]["ParticipationStatus"]
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "associative_event_participants_eventId_fkey"
            columns: ["eventId"]
            isOneToOne: false
            referencedRelation: "associative_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "associative_event_participants_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "membres_calendriers_suivi"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "associative_event_participants_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "associative_event_participants_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "profiles_with_equipe_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "associative_event_participants_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "profiles_with_identity"
            referencedColumns: ["id"]
          },
        ]
      }
      associative_events: {
        Row: {
          createdAt: string
          date: string
          description: string | null
          id: string
          location: string | null
          maxParticipants: number | null
          organizerId: string
          status: Database["public"]["Enums"]["EventStatus"]
          title: string
          type: Database["public"]["Enums"]["EventType"]
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          date: string
          description?: string | null
          id?: string
          location?: string | null
          maxParticipants?: number | null
          organizerId: string
          status?: Database["public"]["Enums"]["EventStatus"]
          title: string
          type: Database["public"]["Enums"]["EventType"]
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          date?: string
          description?: string | null
          id?: string
          location?: string | null
          maxParticipants?: number | null
          organizerId?: string
          status?: Database["public"]["Enums"]["EventStatus"]
          title?: string
          type?: Database["public"]["Enums"]["EventType"]
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "associative_events_organizerId_fkey"
            columns: ["organizerId"]
            isOneToOne: false
            referencedRelation: "membres_calendriers_suivi"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "associative_events_organizerId_fkey"
            columns: ["organizerId"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "associative_events_organizerId_fkey"
            columns: ["organizerId"]
            isOneToOne: false
            referencedRelation: "profiles_with_equipe_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "associative_events_organizerId_fkey"
            columns: ["organizerId"]
            isOneToOne: false
            referencedRelation: "profiles_with_identity"
            referencedColumns: ["id"]
          },
        ]
      }
      associative_loans: {
        Row: {
          createdAt: string
          endDate: string
          id: string
          materialId: string
          startDate: string
          status: Database["public"]["Enums"]["LoanStatus"]
          updatedAt: string
          userId: string
        }
        Insert: {
          createdAt?: string
          endDate: string
          id?: string
          materialId: string
          startDate: string
          status?: Database["public"]["Enums"]["LoanStatus"]
          updatedAt?: string
          userId: string
        }
        Update: {
          createdAt?: string
          endDate?: string
          id?: string
          materialId?: string
          startDate?: string
          status?: Database["public"]["Enums"]["LoanStatus"]
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "associative_loans_materialId_fkey"
            columns: ["materialId"]
            isOneToOne: false
            referencedRelation: "associative_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "associative_loans_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "membres_calendriers_suivi"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "associative_loans_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "associative_loans_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "profiles_with_equipe_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "associative_loans_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "profiles_with_identity"
            referencedColumns: ["id"]
          },
        ]
      }
      associative_materials: {
        Row: {
          condition: Database["public"]["Enums"]["MaterialCondition"]
          createdAt: string
          description: string | null
          id: string
          inventoryNumber: string | null
          isAvailable: boolean
          name: string
          photoUrl: string | null
          updatedAt: string
        }
        Insert: {
          condition: Database["public"]["Enums"]["MaterialCondition"]
          createdAt?: string
          description?: string | null
          id?: string
          inventoryNumber?: string | null
          isAvailable?: boolean
          name: string
          photoUrl?: string | null
          updatedAt?: string
        }
        Update: {
          condition?: Database["public"]["Enums"]["MaterialCondition"]
          createdAt?: string
          description?: string | null
          id?: string
          inventoryNumber?: string | null
          isAvailable?: boolean
          name?: string
          photoUrl?: string | null
          updatedAt?: string
        }
        Relationships: []
      }
      associative_money_pots: {
        Row: {
          createdAt: string
          description: string | null
          eventId: string | null
          id: string
          status: Database["public"]["Enums"]["PotStatus"]
          targetAmount: number | null
          title: string
          updatedAt: string
        }
        Insert: {
          createdAt?: string
          description?: string | null
          eventId?: string | null
          id?: string
          status?: Database["public"]["Enums"]["PotStatus"]
          targetAmount?: number | null
          title: string
          updatedAt?: string
        }
        Update: {
          createdAt?: string
          description?: string | null
          eventId?: string | null
          id?: string
          status?: Database["public"]["Enums"]["PotStatus"]
          targetAmount?: number | null
          title?: string
          updatedAt?: string
        }
        Relationships: [
          {
            foreignKeyName: "associative_money_pots_eventId_fkey"
            columns: ["eventId"]
            isOneToOne: true
            referencedRelation: "associative_events"
            referencedColumns: ["id"]
          },
        ]
      }
      associative_poll_votes: {
        Row: {
          createdAt: string
          id: string
          optionId: string
          pollId: string
          userId: string
        }
        Insert: {
          createdAt?: string
          id?: string
          optionId: string
          pollId: string
          userId: string
        }
        Update: {
          createdAt?: string
          id?: string
          optionId?: string
          pollId?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "associative_poll_votes_pollId_fkey"
            columns: ["pollId"]
            isOneToOne: false
            referencedRelation: "associative_polls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "associative_poll_votes_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "membres_calendriers_suivi"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "associative_poll_votes_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "associative_poll_votes_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "profiles_with_equipe_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "associative_poll_votes_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "profiles_with_identity"
            referencedColumns: ["id"]
          },
        ]
      }
      associative_polls: {
        Row: {
          createdAt: string
          eventId: string | null
          expiresAt: string | null
          id: string
          options: Json
          question: string
        }
        Insert: {
          createdAt?: string
          eventId?: string | null
          expiresAt?: string | null
          id?: string
          options: Json
          question: string
        }
        Update: {
          createdAt?: string
          eventId?: string | null
          expiresAt?: string | null
          id?: string
          options?: Json
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "associative_polls_eventId_fkey"
            columns: ["eventId"]
            isOneToOne: false
            referencedRelation: "associative_events"
            referencedColumns: ["id"]
          },
        ]
      }
      badges_definitions: {
        Row: {
          active: boolean | null
          category: string
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          order_display: number | null
          rarity: string
          slug: string
          unlock_criteria: Json
          updated_at: string | null
          xp_reward: number | null
        }
        Insert: {
          active?: boolean | null
          category: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          order_display?: number | null
          rarity?: string
          slug: string
          unlock_criteria: Json
          updated_at?: string | null
          xp_reward?: number | null
        }
        Update: {
          active?: boolean | null
          category?: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          order_display?: number | null
          rarity?: string
          slug?: string
          unlock_criteria?: Json
          updated_at?: string | null
          xp_reward?: number | null
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
      challenges_definitions: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          slug: string
          start_date: string | null
          target_type: string
          target_value: number
          token_reward: number | null
          type: string
          xp_reward: number | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          slug: string
          start_date?: string | null
          target_type: string
          target_value: number
          token_reward?: number | null
          type: string
          xp_reward?: number | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          slug?: string
          start_date?: string | null
          target_type?: string
          target_value?: number
          token_reward?: number | null
          type?: string
          xp_reward?: number | null
        }
        Relationships: []
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
      contact_messages: {
        Row: {
          created_at: string | null
          email: string
          id: string
          message: string
          name: string
          read: boolean | null
          replied: boolean | null
          subject: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          message: string
          name: string
          read?: boolean | null
          replied?: boolean | null
          subject: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
          read?: boolean | null
          replied?: boolean | null
          subject?: string
        }
        Relationships: []
      }
      demandes_depot_fonds: {
        Row: {
          created_at: string
          date_depot_prevue: string | null
          disponibilites_proposees: string | null
          id: string
          montant_a_deposer: number
          montant_recu: number | null
          notes_tresorier: string | null
          notes_utilisateur: string | null
          statut: string
          updated_at: string
          user_id: string
          valide_le: string | null
          valide_par: string | null
        }
        Insert: {
          created_at?: string
          date_depot_prevue?: string | null
          disponibilites_proposees?: string | null
          id?: string
          montant_a_deposer: number
          montant_recu?: number | null
          notes_tresorier?: string | null
          notes_utilisateur?: string | null
          statut?: string
          updated_at?: string
          user_id: string
          valide_le?: string | null
          valide_par?: string | null
        }
        Update: {
          created_at?: string
          date_depot_prevue?: string | null
          disponibilites_proposees?: string | null
          id?: string
          montant_a_deposer?: number
          montant_recu?: number | null
          notes_tresorier?: string | null
          notes_utilisateur?: string | null
          statut?: string
          updated_at?: string
          user_id?: string
          valide_le?: string | null
          valide_par?: string | null
        }
        Relationships: []
      }
      demandes_pot_equipe: {
        Row: {
          categorie: string | null
          created_at: string | null
          demandeur_id: string
          description: string
          equipe_id: string
          id: string
          montant: number
          notes_tresorier: string | null
          paid_at: string | null
          preuve_depense_url: string | null
          rejection_reason: string | null
          statut: string
          titre: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          categorie?: string | null
          created_at?: string | null
          demandeur_id: string
          description: string
          equipe_id: string
          id?: string
          montant: number
          notes_tresorier?: string | null
          paid_at?: string | null
          preuve_depense_url?: string | null
          rejection_reason?: string | null
          statut?: string
          titre: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          categorie?: string | null
          created_at?: string | null
          demandeur_id?: string
          description?: string
          equipe_id?: string
          id?: string
          montant?: number
          notes_tresorier?: string | null
          paid_at?: string | null
          preuve_depense_url?: string | null
          rejection_reason?: string | null
          statut?: string
          titre?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "demandes_pot_equipe_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipe_calendriers_suivi"
            referencedColumns: ["equipe_id"]
          },
          {
            foreignKeyName: "demandes_pot_equipe_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandes_pot_equipe_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes_ranking_view"
            referencedColumns: ["equipe_id"]
          },
          {
            foreignKeyName: "demandes_pot_equipe_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes_stats_view"
            referencedColumns: ["equipe_id"]
          },
          {
            foreignKeyName: "demandes_pot_equipe_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_equipe_view"
            referencedColumns: ["equipe_id"]
          },
        ]
      }
      demandes_versement: {
        Row: {
          created_at: string | null
          equipe_id: string | null
          iban: string | null
          id: string
          montant: number
          nom_beneficiaire: string | null
          notes_tresorier: string | null
          notes_utilisateur: string | null
          paid_at: string | null
          paid_by: string | null
          preuve_paiement_url: string | null
          rejection_reason: string | null
          statut: string
          type_versement: string
          user_id: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          created_at?: string | null
          equipe_id?: string | null
          iban?: string | null
          id?: string
          montant: number
          nom_beneficiaire?: string | null
          notes_tresorier?: string | null
          notes_utilisateur?: string | null
          paid_at?: string | null
          paid_by?: string | null
          preuve_paiement_url?: string | null
          rejection_reason?: string | null
          statut?: string
          type_versement: string
          user_id: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          created_at?: string | null
          equipe_id?: string | null
          iban?: string | null
          id?: string
          montant?: number
          nom_beneficiaire?: string | null
          notes_tresorier?: string | null
          notes_utilisateur?: string | null
          paid_at?: string | null
          paid_by?: string | null
          preuve_paiement_url?: string | null
          rejection_reason?: string | null
          statut?: string
          type_versement?: string
          user_id?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "demandes_versement_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipe_calendriers_suivi"
            referencedColumns: ["equipe_id"]
          },
          {
            foreignKeyName: "demandes_versement_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demandes_versement_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes_ranking_view"
            referencedColumns: ["equipe_id"]
          },
          {
            foreignKeyName: "demandes_versement_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes_stats_view"
            referencedColumns: ["equipe_id"]
          },
          {
            foreignKeyName: "demandes_versement_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_equipe_view"
            referencedColumns: ["equipe_id"]
          },
        ]
      }
      equipes: {
        Row: {
          actif: boolean
          archived_at: string | null
          archived_by: string | null
          calendriers_alloues: number
          calendriers_remis_par_admin: number
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
          calendriers_remis_par_admin?: number
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
          calendriers_remis_par_admin?: number
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
            referencedRelation: "membres_calendriers_suivi"
            referencedColumns: ["user_id"]
          },
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
            referencedRelation: "membres_calendriers_suivi"
            referencedColumns: ["user_id"]
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
            referencedRelation: "membres_calendriers_suivi"
            referencedColumns: ["user_id"]
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
            referencedRelation: "membres_calendriers_suivi"
            referencedColumns: ["user_id"]
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
            referencedRelation: "membres_calendriers_suivi"
            referencedColumns: ["user_id"]
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
            referencedRelation: "membres_calendriers_suivi"
            referencedColumns: ["user_id"]
          },
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
            referencedRelation: "membres_calendriers_suivi"
            referencedColumns: ["user_id"]
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
            referencedRelation: "membres_calendriers_suivi"
            referencedColumns: ["user_id"]
          },
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
      mouvements_pot_equipe: {
        Row: {
          created_at: string | null
          created_by: string | null
          equipe_id: string
          id: string
          libelle: string
          montant: number
          solde_apres: number | null
          solde_avant: number | null
          source_id: string | null
          source_type: string | null
          type_mouvement: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          equipe_id: string
          id?: string
          libelle: string
          montant: number
          solde_apres?: number | null
          solde_avant?: number | null
          source_id?: string | null
          source_type?: string | null
          type_mouvement: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          equipe_id?: string
          id?: string
          libelle?: string
          montant?: number
          solde_apres?: number | null
          solde_avant?: number | null
          source_id?: string | null
          source_type?: string | null
          type_mouvement?: string
        }
        Relationships: [
          {
            foreignKeyName: "mouvements_pot_equipe_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipe_calendriers_suivi"
            referencedColumns: ["equipe_id"]
          },
          {
            foreignKeyName: "mouvements_pot_equipe_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mouvements_pot_equipe_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes_ranking_view"
            referencedColumns: ["equipe_id"]
          },
          {
            foreignKeyName: "mouvements_pot_equipe_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes_stats_view"
            referencedColumns: ["equipe_id"]
          },
          {
            foreignKeyName: "mouvements_pot_equipe_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_equipe_view"
            referencedColumns: ["equipe_id"]
          },
        ]
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
            referencedRelation: "equipe_calendriers_suivi"
            referencedColumns: ["equipe_id"]
          },
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
            referencedRelation: "equipes_ranking_view"
            referencedColumns: ["equipe_id"]
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
      n8n_settings: {
        Row: {
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
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
            referencedRelation: "membres_calendriers_suivi"
            referencedColumns: ["user_id"]
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
      order_items: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          metadata: Json | null
          name: string
          product_id: string | null
          quantity: number
          total_price: number | null
          transaction_id: string
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          name: string
          product_id?: string | null
          quantity: number
          total_price?: number | null
          transaction_id: string
          unit_price: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          name?: string
          product_id?: string | null
          quantity?: number
          total_price?: number | null
          transaction_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "boutique_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "support_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["order_status_enum"]
          transaction_id: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          status: Database["public"]["Enums"]["order_status_enum"]
          transaction_id: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["order_status_enum"]
          transaction_id?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "boutique_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_history_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "support_transactions"
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
            referencedRelation: "equipe_calendriers_suivi"
            referencedColumns: ["equipe_id"]
          },
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
            referencedRelation: "equipes_ranking_view"
            referencedColumns: ["equipe_id"]
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
      pots_equipe_historique: {
        Row: {
          annee: number
          created_at: string | null
          created_by: string | null
          equipe_id: string
          id: string
          notes: string | null
          solde_anterieur: number
          updated_at: string | null
        }
        Insert: {
          annee: number
          created_at?: string | null
          created_by?: string | null
          equipe_id: string
          id?: string
          notes?: string | null
          solde_anterieur?: number
          updated_at?: string | null
        }
        Update: {
          annee?: number
          created_at?: string | null
          created_by?: string | null
          equipe_id?: string
          id?: string
          notes?: string | null
          solde_anterieur?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pots_equipe_historique_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "membres_calendriers_suivi"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "pots_equipe_historique_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pots_equipe_historique_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_equipe_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pots_equipe_historique_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_identity"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pots_equipe_historique_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipe_calendriers_suivi"
            referencedColumns: ["equipe_id"]
          },
          {
            foreignKeyName: "pots_equipe_historique_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pots_equipe_historique_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes_ranking_view"
            referencedColumns: ["equipe_id"]
          },
          {
            foreignKeyName: "pots_equipe_historique_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes_stats_view"
            referencedColumns: ["equipe_id"]
          },
          {
            foreignKeyName: "pots_equipe_historique_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
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
          avatar_url: string | null
          calendriers_confirmation_date: string | null
          calendriers_lot_attribue: number
          calendriers_reception_confirmee: boolean
          created_at: string
          display_name: string | null
          email: string
          first_name: string | null
          full_name: string
          id: string
          identity_verified: boolean | null
          is_active: boolean
          last_name: string | null
          phone: string | null
          role: string
          team_id: string | null
          updated_at: string
          verification_date: string | null
          verification_method: string | null
        }
        Insert: {
          avatar_url?: string | null
          calendriers_confirmation_date?: string | null
          calendriers_lot_attribue?: number
          calendriers_reception_confirmee?: boolean
          created_at?: string
          display_name?: string | null
          email: string
          first_name?: string | null
          full_name: string
          id: string
          identity_verified?: boolean | null
          is_active?: boolean
          last_name?: string | null
          phone?: string | null
          role?: string
          team_id?: string | null
          updated_at?: string
          verification_date?: string | null
          verification_method?: string | null
        }
        Update: {
          avatar_url?: string | null
          calendriers_confirmation_date?: string | null
          calendriers_lot_attribue?: number
          calendriers_reception_confirmee?: boolean
          created_at?: string
          display_name?: string | null
          email?: string
          first_name?: string | null
          full_name?: string
          id?: string
          identity_verified?: boolean | null
          is_active?: boolean
          last_name?: string | null
          phone?: string | null
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
            referencedRelation: "equipe_calendriers_suivi"
            referencedColumns: ["equipe_id"]
          },
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
            referencedRelation: "equipes_ranking_view"
            referencedColumns: ["equipe_id"]
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
            referencedRelation: "boutique_orders"
            referencedColumns: ["id"]
          },
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
          invoice_number: string | null
          invoice_sent: boolean | null
          invoice_url: string | null
          latitude: number | null
          longitude: number | null
          notes: string | null
          order_status: string | null
          payment_method: Database["public"]["Enums"]["payment_method_enum"]
          payment_status: string | null
          receipt_generated: boolean | null
          receipt_number: string | null
          receipt_sent: boolean | null
          receipt_type: string | null
          receipt_url: string | null
          shipping_address: string | null
          source: string | null
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
          tournee_id: string | null
          transaction_type: string | null
          updated_at: string | null
          user_id: string | null
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
          invoice_number?: string | null
          invoice_sent?: boolean | null
          invoice_url?: string | null
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          order_status?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method_enum"]
          payment_status?: string | null
          receipt_generated?: boolean | null
          receipt_number?: string | null
          receipt_sent?: boolean | null
          receipt_type?: string | null
          receipt_url?: string | null
          shipping_address?: string | null
          source?: string | null
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
          tournee_id?: string | null
          transaction_type?: string | null
          updated_at?: string | null
          user_id?: string | null
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
          invoice_number?: string | null
          invoice_sent?: boolean | null
          invoice_url?: string | null
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          order_status?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method_enum"]
          payment_status?: string | null
          receipt_generated?: boolean | null
          receipt_number?: string | null
          receipt_sent?: boolean | null
          receipt_type?: string | null
          receipt_url?: string | null
          shipping_address?: string | null
          source?: string | null
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
          tournee_id?: string | null
          transaction_type?: string | null
          updated_at?: string | null
          user_id?: string | null
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
            referencedRelation: "equipe_calendriers_suivi"
            referencedColumns: ["equipe_id"]
          },
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
            referencedRelation: "equipes_ranking_view"
            referencedColumns: ["equipe_id"]
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
      user_badges: {
        Row: {
          badge_id: string | null
          id: string
          seen: boolean | null
          unlocked_at: string | null
          user_id: string | null
        }
        Insert: {
          badge_id?: string | null
          id?: string
          seen?: boolean | null
          unlocked_at?: string | null
          user_id?: string | null
        }
        Update: {
          badge_id?: string | null
          id?: string
          seen?: boolean | null
          unlocked_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_challenges: {
        Row: {
          challenge_id: string | null
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          current_progress: number | null
          id: string
          period_start: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          challenge_id?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          current_progress?: number | null
          id?: string
          period_start?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          challenge_id?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          current_progress?: number | null
          id?: string
          period_start?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_cosmetics: {
        Row: {
          equipped: boolean | null
          id: string
          name: string
          slug: string
          type: string
          unlocked_at: string | null
          user_id: string | null
        }
        Insert: {
          equipped?: boolean | null
          id?: string
          name: string
          slug: string
          type: string
          unlocked_at?: string | null
          user_id?: string | null
        }
        Update: {
          equipped?: boolean | null
          id?: string
          name?: string
          slug?: string
          type?: string
          unlocked_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_progression: {
        Row: {
          created_at: string | null
          current_xp: number | null
          last_activity_date: string | null
          level: number | null
          streak_days: number | null
          tokens: number | null
          total_xp: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_xp?: number | null
          last_activity_date?: string | null
          level?: number | null
          streak_days?: number | null
          tokens?: number | null
          total_xp?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_xp?: number | null
          last_activity_date?: string | null
          level?: number | null
          streak_days?: number | null
          tokens?: number | null
          total_xp?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      whitelist: {
        Row: {
          added_at: string | null
          added_by: string | null
          calendriers_recus: boolean | null
          calendriers_recus_at: string | null
          calendriers_remis: boolean | null
          calendriers_remis_at: string | null
          calendriers_remis_by: string | null
          email: string | null
          first_name: string
          id: string
          last_name: string
          notes: string | null
          used: boolean | null
          used_at: string | null
        }
        Insert: {
          added_at?: string | null
          added_by?: string | null
          calendriers_recus?: boolean | null
          calendriers_recus_at?: string | null
          calendriers_remis?: boolean | null
          calendriers_remis_at?: string | null
          calendriers_remis_by?: string | null
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          notes?: string | null
          used?: boolean | null
          used_at?: string | null
        }
        Update: {
          added_at?: string | null
          added_by?: string | null
          calendriers_recus?: boolean | null
          calendriers_recus_at?: string | null
          calendriers_remis?: boolean | null
          calendriers_remis_at?: string | null
          calendriers_remis_by?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          notes?: string | null
          used?: boolean | null
          used_at?: string | null
        }
        Relationships: []
      }
      whitelist_audit: {
        Row: {
          action: string
          details: Json | null
          id: string
          performed_at: string | null
          performed_by: string | null
          whitelist_id: string | null
        }
        Insert: {
          action: string
          details?: Json | null
          id?: string
          performed_at?: string | null
          performed_by?: string | null
          whitelist_id?: string | null
        }
        Update: {
          action?: string
          details?: Json | null
          id?: string
          performed_at?: string | null
          performed_by?: string | null
          whitelist_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whitelist_audit_whitelist_id_fkey"
            columns: ["whitelist_id"]
            isOneToOne: false
            referencedRelation: "whitelist"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_history: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          metadata: Json | null
          reason: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          metadata?: Json | null
          reason: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          metadata?: Json | null
          reason?: string
          user_id?: string | null
        }
        Relationships: []
      }
      zones_tournees: {
        Row: {
          annee: number
          code_zone: string | null
          created_at: string
          date_debut_tournee: string | null
          date_fin_tournee: string | null
          description: string | null
          equipe_id: string
          geom: Json
          id: string
          nb_calendriers_alloues: number | null
          nb_calendriers_distribues: number | null
          nb_foyers_estimes: number | null
          nom_zone: string
          notes: string | null
          pompier_id: string | null
          population_estimee: number | null
          statut: string
          updated_at: string
        }
        Insert: {
          annee?: number
          code_zone?: string | null
          created_at?: string
          date_debut_tournee?: string | null
          date_fin_tournee?: string | null
          description?: string | null
          equipe_id: string
          geom: Json
          id?: string
          nb_calendriers_alloues?: number | null
          nb_calendriers_distribues?: number | null
          nb_foyers_estimes?: number | null
          nom_zone: string
          notes?: string | null
          pompier_id?: string | null
          population_estimee?: number | null
          statut?: string
          updated_at?: string
        }
        Update: {
          annee?: number
          code_zone?: string | null
          created_at?: string
          date_debut_tournee?: string | null
          date_fin_tournee?: string | null
          description?: string | null
          equipe_id?: string
          geom?: Json
          id?: string
          nb_calendriers_alloues?: number | null
          nb_calendriers_distribues?: number | null
          nb_foyers_estimes?: number | null
          nom_zone?: string
          notes?: string | null
          pompier_id?: string | null
          population_estimee?: number | null
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "zones_tournees_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipe_calendriers_suivi"
            referencedColumns: ["equipe_id"]
          },
          {
            foreignKeyName: "zones_tournees_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zones_tournees_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes_ranking_view"
            referencedColumns: ["equipe_id"]
          },
          {
            foreignKeyName: "zones_tournees_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes_stats_view"
            referencedColumns: ["equipe_id"]
          },
          {
            foreignKeyName: "zones_tournees_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_equipe_view"
            referencedColumns: ["equipe_id"]
          },
          {
            foreignKeyName: "zones_tournees_pompier_id_fkey"
            columns: ["pompier_id"]
            isOneToOne: false
            referencedRelation: "membres_calendriers_suivi"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "zones_tournees_pompier_id_fkey"
            columns: ["pompier_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zones_tournees_pompier_id_fkey"
            columns: ["pompier_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_equipe_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zones_tournees_pompier_id_fkey"
            columns: ["pompier_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_identity"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      boutique_orders: {
        Row: {
          amount: number | null
          created_at: string | null
          id: string | null
          items: Json | null
          items_count: number | null
          last_status_change: string | null
          notes: string | null
          order_status: string | null
          stripe_session_id: string | null
          supporter_email: string | null
          supporter_name: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          id?: string | null
          items?: never
          items_count?: never
          last_status_change?: never
          notes?: string | null
          order_status?: string | null
          stripe_session_id?: string | null
          supporter_email?: string | null
          supporter_name?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          id?: string | null
          items?: never
          items_count?: never
          last_status_change?: never
          notes?: string | null
          order_status?: string | null
          stripe_session_id?: string | null
          supporter_email?: string | null
          supporter_name?: string | null
        }
        Relationships: []
      }
      equipe_calendriers_suivi: {
        Row: {
          calendriers_distribues_total: number | null
          calendriers_remis_par_admin: number | null
          ecart: number | null
          equipe_couleur: string | null
          equipe_id: string | null
          equipe_nom: string | null
          equipe_numero: number | null
          nb_membres_confirmes: number | null
          nb_membres_total: number | null
          stock_dormant: number | null
          total_confirmes_membres: number | null
          total_theorique_membres: number | null
        }
        Relationships: []
      }
      equipes_ranking_view: {
        Row: {
          calendriers_alloues: number | null
          calendriers_distribues: number | null
          chef_equipe_id: string | null
          chef_equipe_nom: string | null
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
          rang_calendriers: number | null
          rang_montant: number | null
          rang_progression: number | null
          secteur: string | null
          tournees_actives: number | null
          tournees_terminees: number | null
        }
        Relationships: []
      }
      equipes_stats_view: {
        Row: {
          calendriers_alloues: number | null
          calendriers_distribues: number | null
          chef_equipe_id: string | null
          chef_equipe_nom: string | null
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
          tournees_actives: number | null
          tournees_terminees: number | null
        }
        Relationships: []
      }
      membres_calendriers_suivi: {
        Row: {
          calendriers_confirmation_date: string | null
          calendriers_distribues: number | null
          calendriers_lot_attribue: number | null
          calendriers_reception_confirmee: boolean | null
          display_name: string | null
          equipe_nom: string | null
          full_name: string | null
          nb_tournees_completees: number | null
          stock_en_main: number | null
          team_id: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "equipe_calendriers_suivi"
            referencedColumns: ["equipe_id"]
          },
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
            referencedRelation: "equipes_ranking_view"
            referencedColumns: ["equipe_id"]
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
            referencedRelation: "equipe_calendriers_suivi"
            referencedColumns: ["equipe_id"]
          },
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
            referencedRelation: "equipes_ranking_view"
            referencedColumns: ["equipe_id"]
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
      zones_tournees_enrichies: {
        Row: {
          annee: number | null
          code_zone: string | null
          created_at: string | null
          date_debut_tournee: string | null
          date_fin_tournee: string | null
          description: string | null
          equipe_couleur: string | null
          equipe_id: string | null
          equipe_nom: string | null
          equipe_numero: number | null
          equipe_secteur: string | null
          geom: Json | null
          id: string | null
          nb_calendriers_alloues: number | null
          nb_calendriers_distribues: number | null
          nb_calendriers_restants: number | null
          nb_foyers_estimes: number | null
          nom_zone: string | null
          notes: string | null
          pompier_email: string | null
          pompier_id: string | null
          pompier_nom: string | null
          pompier_telephone: string | null
          population_estimee: number | null
          progression_pct: number | null
          statut: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "zones_tournees_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipe_calendriers_suivi"
            referencedColumns: ["equipe_id"]
          },
          {
            foreignKeyName: "zones_tournees_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zones_tournees_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes_ranking_view"
            referencedColumns: ["equipe_id"]
          },
          {
            foreignKeyName: "zones_tournees_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes_stats_view"
            referencedColumns: ["equipe_id"]
          },
          {
            foreignKeyName: "zones_tournees_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_equipe_view"
            referencedColumns: ["equipe_id"]
          },
          {
            foreignKeyName: "zones_tournees_pompier_id_fkey"
            columns: ["pompier_id"]
            isOneToOne: false
            referencedRelation: "membres_calendriers_suivi"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "zones_tournees_pompier_id_fkey"
            columns: ["pompier_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zones_tournees_pompier_id_fkey"
            columns: ["pompier_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_equipe_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zones_tournees_pompier_id_fkey"
            columns: ["pompier_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_identity"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      award_xp: {
        Args: {
          p_amount: number
          p_metadata?: Json
          p_reason: string
          p_user_id: string
        }
        Returns: {
          leveled_up: boolean
          new_level: number
          new_xp: number
          tokens_earned: number
        }[]
      }
      backfill_all_missing_receipts: {
        Args: never
        Returns: {
          details: Json
          total_eligible: number
          total_errors: number
          total_sent: number
          total_skipped: number
        }[]
      }
      backfill_send_receipt_webhook: {
        Args: { transaction_uuid: string }
        Returns: {
          message: string
          request_id: number
          status: string
          transaction_id: string
        }[]
      }
      bytea_to_text: { Args: { data: string }; Returns: string }
      check_and_unlock_badges: {
        Args: { p_user_id: string }
        Returns: {
          badge_icon: string
          badge_id: string
          badge_name: string
          xp_awarded: number
        }[]
      }
      check_vote_rate_limit: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      claim_whitelist_entry: {
        Args: { p_email: string; p_first_name: string; p_last_name: string }
        Returns: {
          email: string
          first_name: string
          id: string
          last_name: string
          used: boolean
          used_at: string
        }[]
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
      confirm_calendar_reception: { Args: never; Returns: boolean }
      creer_demande_versement: {
        Args: {
          p_iban?: string
          p_montant: number
          p_nom_beneficiaire?: string
          p_notes_utilisateur?: string
          p_type_versement: string
        }
        Returns: string
      }
      detect_vote_desync: {
        Args: never
        Returns: {
          actual_count: number
          difference: number
          downvotes: number
          idea_id: string
          stored_count: number
          titre: string
          upvotes: number
        }[]
      }
      generate_receipt_number: { Args: never; Returns: string }
      get_avatar_url: {
        Args: { p: Database["public"]["Tables"]["profiles"]["Row"] }
        Returns: string
      }
      get_boutique_stats: { Args: never; Returns: Json }
      get_detail_fonds_utilisateur: {
        Args: { p_user_id: string }
        Returns: Json
      }
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
      get_equipe_zones_stats: {
        Args: { p_annee?: number; p_equipe_id: string }
        Returns: {
          progression_pct: number
          total_calendriers_alloues: number
          total_calendriers_distribues: number
          total_population: number
          total_zones: number
          zones_a_faire: number
          zones_en_cours: number
          zones_terminees: number
        }[]
      }
      get_equipes_ranking: {
        Args: never
        Returns: {
          calendriers_alloues: number
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
      get_montant_non_depose: { Args: { p_user_id: string }; Returns: number }
      get_n8n_webhook_url: { Args: never; Returns: string }
      get_top_ideas_by_votes: {
        Args: { result_limit?: number }
        Returns: {
          author_name: string
          comments_count: number
          created_at: string
          downvotes: number
          idea_id: string
          titre: string
          upvotes: number
          views_count: number
          votes_count: number
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
      get_user_rank_global: {
        Args: { p_user_id: string }
        Returns: {
          percentile: number
          rank: number
          total_users: number
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
      get_user_vote_stats: {
        Args: { target_user_id: string }
        Returns: {
          downvotes: number
          last_vote_at: string
          total_votes: number
          upvotes: number
          votes_last_24h: number
          votes_remaining: number
        }[]
      }
      get_xp_required_for_level: {
        Args: { target_level: number }
        Returns: number
      }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "http_request"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_delete:
        | {
            Args: { uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { content: string; content_type: string; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_get:
        | {
            Args: { uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { data: Json; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
        SetofOptions: {
          from: "*"
          to: "http_header"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_list_curlopt: {
        Args: never
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_post:
        | {
            Args: { content: string; content_type: string; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { data: Json; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_put: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_reset_curlopt: { Args: never; Returns: boolean }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      increment_annonce_vues: {
        Args: { annonce_id: string }
        Returns: undefined
      }
      increment_idea_views: {
        Args: { target_idea_id: string }
        Returns: undefined
      }
      issue_receipt: {
        Args: { p_transaction_id: string }
        Returns: {
          id: string
          receipt_number: string
        }[]
      }
      list_photos_with_real_counts: {
        Args: {
          p_author_id?: string
          p_before?: string
          p_category?: string
          p_limit?: number
        }
        Returns: {
          category: string
          comments_count: number
          created_at: string
          description: string
          id: string
          image_url: string
          likes_count: number
          reports_count: number
          status: string
          taken_at: string
          thumbnail_url: string
          title: string
          user_id: string
        }[]
      }
      marquer_demande_payee: {
        Args: { p_demande_id: string; p_preuve_url?: string }
        Returns: boolean
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
      reconcile_all_idea_votes: {
        Args: never
        Returns: {
          difference: number
          idea_id: string
          new_count: number
          old_count: number
        }[]
      }
      reconcile_idea_votes_single: {
        Args: { target_idea_id: string }
        Returns: {
          downvotes: number
          idea_id: string
          new_count: number
          old_count: number
          upvotes: number
          was_fixed: boolean
        }[]
      }
      rejeter_demande_versement: {
        Args: { p_demande_id: string; p_raison: string }
        Returns: boolean
      }
      set_n8n_webhook_url: { Args: { url: string }; Returns: string }
      text_to_bytea: { Args: { data: string }; Returns: string }
      update_order_status: {
        Args: {
          p_new_status: string
          p_notes?: string
          p_transaction_id: string
          p_updated_by?: string
        }
        Returns: Json
      }
      update_user_streak: { Args: { p_user_id: string }; Returns: number }
      urlencode:
        | { Args: { data: Json }; Returns: string }
        | {
            Args: { string: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.urlencode(string => bytea), public.urlencode(string => varchar). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
        | {
            Args: { string: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.urlencode(string => bytea), public.urlencode(string => varchar). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
      valider_demande_depot: {
        Args: {
          p_demande_id: string
          p_montant_recu: number
          p_notes_tresorier?: string
        }
        Returns: Json
      }
      valider_demande_versement: {
        Args: { p_demande_id: string; p_notes_tresorier?: string }
        Returns: boolean
      }
    }
    Enums: {
      ContributionStatus: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED"
      EventStatus: "DRAFT" | "PLANNED" | "COMPLETED" | "CANCELLED"
      EventType: "AG" | "SAINTE_BARBE" | "REPAS_GARDE" | "SPORT" | "AUTRE"
      LoanStatus: "PENDING" | "APPROVED" | "ACTIVE" | "RETURNED" | "OVERDUE"
      MaterialCondition: "NEW" | "GOOD" | "USED" | "DAMAGED" | "BROKEN"
      order_status_enum:
        | "pending"
        | "confirmed"
        | "preparing"
        | "ready"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "refunded"
      ParticipationStatus: "PRESENT" | "ABSENT" | "ASTREINTE"
      payment_method_enum: "especes" | "cheque" | "carte" | "virement"
      payment_status: "pending" | "succeeded" | "failed"
      PotStatus: "ACTIVE" | "CLOSED" | "COMPLETED"
      transparency_mode: "prive" | "equipe" | "anonyme"
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
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
      ContributionStatus: ["PENDING", "COMPLETED", "FAILED", "REFUNDED"],
      EventStatus: ["DRAFT", "PLANNED", "COMPLETED", "CANCELLED"],
      EventType: ["AG", "SAINTE_BARBE", "REPAS_GARDE", "SPORT", "AUTRE"],
      LoanStatus: ["PENDING", "APPROVED", "ACTIVE", "RETURNED", "OVERDUE"],
      MaterialCondition: ["NEW", "GOOD", "USED", "DAMAGED", "BROKEN"],
      order_status_enum: [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      ParticipationStatus: ["PRESENT", "ABSENT", "ASTREINTE"],
      payment_method_enum: ["especes", "cheque", "carte", "virement"],
      payment_status: ["pending", "succeeded", "failed"],
      PotStatus: ["ACTIVE", "CLOSED", "COMPLETED"],
      transparency_mode: ["prive", "equipe", "anonyme"],
    },
  },
} as const

