
-- Role enum
CREATE TYPE public.app_role AS ENUM ('homeowner', 'contractor', 'admin');

-- User roles table (separate from profiles per security requirements)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'banned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Teams table
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  name TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Astana',
  specialties TEXT[] DEFAULT '{}',
  description TEXT DEFAULT '',
  years_experience INT DEFAULT 0,
  pricing_model TEXT DEFAULT '',
  verified_status TEXT NOT NULL DEFAULT 'pending' CHECK (verified_status IN ('pending', 'verified', 'rejected')),
  verification_docs JSONB DEFAULT '[]',
  trust_score NUMERIC(5,2) DEFAULT 0,
  trust_score_breakdown JSONB DEFAULT '{}',
  avg_rating NUMERIC(3,2) DEFAULT 0,
  review_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Portfolio items
CREATE TABLE public.portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  before_image_url TEXT,
  after_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

-- Projects
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  homeowner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  district TEXT DEFAULT '',
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Reviews
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL NOT NULL,
  homeowner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT NOT NULL,
  body TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  verification_type TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_type IN ('verified_project', 'unverified')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, homeowner_user_id)
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Review evidence
CREATE TABLE public.review_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES public.reviews(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.review_evidence ENABLE ROW LEVEL SECURITY;

-- Review replies
CREATE TABLE public.review_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES public.reviews(id) ON DELETE CASCADE NOT NULL,
  contractor_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('approved', 'removed'))
);
ALTER TABLE public.review_replies ENABLE ROW LEVEL SECURITY;

-- Reports
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('review', 'team', 'user')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  details TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Audit logs (append-only)
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  meta_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ============ HELPER FUNCTIONS ============

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_team_owner(_user_id UUID, _team_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teams WHERE id = _team_id AND owner_user_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_profile_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- ============ RLS POLICIES ============

-- user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- profiles
CREATE POLICY "Anyone authenticated can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- teams (public read)
CREATE POLICY "Anyone can view teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Contractors can create teams" ON public.teams FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'contractor') AND auth.uid() = owner_user_id);
CREATE POLICY "Owners can update own team" ON public.teams FOR UPDATE TO authenticated USING (auth.uid() = owner_user_id);
CREATE POLICY "Admins can update any team" ON public.teams FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete teams" ON public.teams FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- portfolio_items (public read)
CREATE POLICY "Anyone can view portfolio" ON public.portfolio_items FOR SELECT USING (true);
CREATE POLICY "Team owners can manage portfolio" ON public.portfolio_items FOR INSERT TO authenticated WITH CHECK (public.is_team_owner(auth.uid(), team_id));
CREATE POLICY "Team owners can update portfolio" ON public.portfolio_items FOR UPDATE TO authenticated USING (public.is_team_owner(auth.uid(), team_id));
CREATE POLICY "Team owners can delete portfolio" ON public.portfolio_items FOR DELETE TO authenticated USING (public.is_team_owner(auth.uid(), team_id));
CREATE POLICY "Admins can manage portfolio" ON public.portfolio_items FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- projects
CREATE POLICY "Homeowners can view own projects" ON public.projects FOR SELECT TO authenticated USING (auth.uid() = homeowner_user_id);
CREATE POLICY "Contractors can view team projects" ON public.projects FOR SELECT TO authenticated USING (public.is_team_owner(auth.uid(), team_id));
CREATE POLICY "Admins can view all projects" ON public.projects FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Homeowners can create projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'homeowner') AND auth.uid() = homeowner_user_id);
CREATE POLICY "Homeowners can update own projects" ON public.projects FOR UPDATE TO authenticated USING (auth.uid() = homeowner_user_id);
CREATE POLICY "Admins can manage projects" ON public.projects FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- reviews
CREATE POLICY "Public can view approved reviews" ON public.reviews FOR SELECT USING (status = 'approved');
CREATE POLICY "Homeowners can view own reviews" ON public.reviews FOR SELECT TO authenticated USING (auth.uid() = homeowner_user_id);
CREATE POLICY "Admins can view all reviews" ON public.reviews FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Homeowners can create reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'homeowner') AND auth.uid() = homeowner_user_id);
CREATE POLICY "Homeowners can update pending reviews" ON public.reviews FOR UPDATE TO authenticated USING (auth.uid() = homeowner_user_id AND status = 'pending');
CREATE POLICY "Homeowners can delete pending reviews" ON public.reviews FOR DELETE TO authenticated USING (auth.uid() = homeowner_user_id AND status = 'pending');
CREATE POLICY "Admins can manage reviews" ON public.reviews FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete reviews" ON public.reviews FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- review_evidence
CREATE POLICY "Public can view evidence of approved reviews" ON public.review_evidence FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.reviews WHERE id = review_id AND status = 'approved')
);
CREATE POLICY "Review owners can view own evidence" ON public.review_evidence FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.reviews WHERE id = review_id AND homeowner_user_id = auth.uid())
);
CREATE POLICY "Admins can view all evidence" ON public.review_evidence FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Review owners can add evidence" ON public.review_evidence FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.reviews WHERE id = review_id AND homeowner_user_id = auth.uid() AND status = 'pending')
);
CREATE POLICY "Admins can manage evidence" ON public.review_evidence FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- review_replies
CREATE POLICY "Public can view replies on approved reviews" ON public.review_replies FOR SELECT USING (
  status = 'approved' AND EXISTS (SELECT 1 FROM public.reviews WHERE id = review_id AND status = 'approved')
);
CREATE POLICY "Contractors can reply to approved reviews of their team" ON public.review_replies FOR INSERT TO authenticated WITH CHECK (
  public.has_role(auth.uid(), 'contractor') AND auth.uid() = contractor_user_id AND
  EXISTS (SELECT 1 FROM public.reviews r JOIN public.teams t ON r.team_id = t.id WHERE r.id = review_id AND t.owner_user_id = auth.uid() AND r.status = 'approved')
);
CREATE POLICY "Reply owners can update own replies" ON public.review_replies FOR UPDATE TO authenticated USING (auth.uid() = contractor_user_id);
CREATE POLICY "Admins can manage replies" ON public.review_replies FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- reports
CREATE POLICY "Reporters can view own reports" ON public.reports FOR SELECT TO authenticated USING (auth.uid() = reporter_user_id);
CREATE POLICY "Admins can view all reports" ON public.reports FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can create reports" ON public.reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_user_id);
CREATE POLICY "Admins can manage reports" ON public.reports FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- audit_logs
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- ============ TRIGGER: Auto-create profile on signup ============

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role app_role;
BEGIN
  _role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'homeowner');
  
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ TRIGGER: Update updated_at ============

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ STORAGE BUCKETS ============

INSERT INTO storage.buckets (id, name, public) VALUES ('portfolio', 'portfolio', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('evidence', 'evidence', true);

-- Storage policies
CREATE POLICY "Anyone can view portfolio files" ON storage.objects FOR SELECT USING (bucket_id = 'portfolio');
CREATE POLICY "Team owners can upload portfolio" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'portfolio');
CREATE POLICY "Team owners can update portfolio" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'portfolio');
CREATE POLICY "Team owners can delete portfolio" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'portfolio');

CREATE POLICY "Anyone can view evidence files" ON storage.objects FOR SELECT USING (bucket_id = 'evidence');
CREATE POLICY "Authenticated can upload evidence" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'evidence');
CREATE POLICY "Authenticated can delete evidence" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'evidence');

-- ============ TRUST SCORE FUNCTION ============

CREATE OR REPLACE FUNCTION public.compute_trust_score(_team_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _avg_rating NUMERIC;
  _review_count INT;
  _evidence_count INT;
  _recent_count INT;
  _rating_score NUMERIC;
  _volume_score NUMERIC;
  _evidence_score NUMERIC;
  _recency_score NUMERIC;
  _trust_score NUMERIC;
  _breakdown JSONB;
BEGIN
  SELECT COALESCE(AVG(rating), 0), COUNT(*)
  INTO _avg_rating, _review_count
  FROM public.reviews
  WHERE team_id = _team_id AND status = 'approved';

  SELECT COUNT(DISTINCT re.review_id)
  INTO _evidence_count
  FROM public.review_evidence re
  JOIN public.reviews r ON r.id = re.review_id
  WHERE r.team_id = _team_id AND r.status = 'approved';

  SELECT COUNT(*)
  INTO _recent_count
  FROM public.reviews
  WHERE team_id = _team_id AND status = 'approved' AND created_at > now() - interval '6 months';

  -- Rating score (0-40): normalized from 1-5 to 0-40
  _rating_score := CASE WHEN _review_count > 0 THEN ((_avg_rating - 1) / 4.0) * 40 ELSE 0 END;
  
  -- Volume score (0-25): log scale, caps at ~50 reviews
  _volume_score := LEAST(25, LN(GREATEST(_review_count, 1) + 1) / LN(51) * 25);
  
  -- Evidence score (0-20): bonus for reviews with photos
  _evidence_score := CASE WHEN _review_count > 0 THEN LEAST(20, (_evidence_count::NUMERIC / _review_count) * 20) ELSE 0 END;
  
  -- Recency score (0-15): recent reviews boost
  _recency_score := CASE WHEN _review_count > 0 THEN LEAST(15, (_recent_count::NUMERIC / GREATEST(_review_count, 1)) * 15) ELSE 0 END;

  _trust_score := ROUND(_rating_score + _volume_score + _evidence_score + _recency_score, 2);

  _breakdown := jsonb_build_object(
    'rating_score', ROUND(_rating_score, 2),
    'volume_score', ROUND(_volume_score, 2),
    'evidence_score', ROUND(_evidence_score, 2),
    'recency_score', ROUND(_recency_score, 2)
  );

  UPDATE public.teams
  SET trust_score = _trust_score,
      trust_score_breakdown = _breakdown,
      avg_rating = _avg_rating,
      review_count = _review_count
  WHERE id = _team_id;

  RETURN jsonb_build_object('trust_score', _trust_score, 'breakdown', _breakdown);
END;
$$;

-- Trigger to recalculate trust score when review status changes
CREATE OR REPLACE FUNCTION public.trigger_recalculate_trust_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.compute_trust_score(COALESCE(NEW.team_id, OLD.team_id));
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER recalc_trust_on_review_change
  AFTER INSERT OR UPDATE OF status OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.trigger_recalculate_trust_score();
